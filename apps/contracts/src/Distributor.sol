// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDistributor} from "./interfaces/IDistributor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Distributor is IDistributor {
    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice Counter for generating unique pool IDs
    uint256 public nextPoolId = 1;

    /// @notice Mapping from pool ID to pool data
    mapping(uint256 => Pool) private _pools;

    /// @notice Mapping from pool ID to array of members
    mapping(uint256 => Member[]) private _poolMembers;

    mapping(uint256 => mapping(address => bool)) private _isDonator;

    /// @notice Mapping from user address to pool ids they are a member of
    mapping(address => uint256[]) private _userPools;

    /// @notice Mapping to check if an address is a member of a pool. poolId -> address -> bool
    mapping(uint256 => mapping(address => bool)) private _isMember;

    /// @notice Global mapping from member address to their available balance
    mapping(address => uint256) private _balances;

    constructor(address _usdcAddress) {
        usdc = IERC20(_usdcAddress);
    }

    /// @inheritdoc IDistributor
    function createPool(
        string calldata title,
        string calldata description,
        string calldata imageUri,
        bytes32[] calldata invitationCodes,
        uint256[] calldata percentages
    ) external returns (uint256 poolId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (percentages.length != invitationCodes.length)
            revert ArrayLengthMismatch();

        // Calculate total percentage for invitation slots
        uint256 totalMemberPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            if (percentages[i] == 0 || percentages[i] > 10000) {
                revert InvalidMemberPercentage(percentages[i]);
            }
            totalMemberPercentage += percentages[i];
        }

        // Ensure total percentage doesn't exceed 100%
        if (totalMemberPercentage >= 10000) {
            revert InvalidTotalPercentage(totalMemberPercentage);
        }

        // Ensure creator percentage is not zero
        uint256 creatorPercentage = 10000 - totalMemberPercentage;
        if (creatorPercentage == 0) {
            revert InvalidCreatorPercentage();
        }

        // Increment pool ID
        poolId = nextPoolId++;

        // Create the pool
        _pools[poolId] = Pool({
            id: poolId,
            creator: msg.sender,
            title: title,
            description: description,
            imageUri: imageUri,
            totalDonationsAmount: 0,
            totalDonationsCount: 0,
            uniqueDonatorsCount: 0,
            createdAt: block.timestamp,
            status: percentages.length == 0
                ? PoolStatus.ACTIVE
                : PoolStatus.PENDING
        });

        // Add creator as first member
        _poolMembers[poolId].push(
            Member({
                member: msg.sender,
                percentage: creatorPercentage,
                invitationCodeHash: bytes32(0) // Creator doesn't need invitation code
            })
        );
        _isMember[poolId][msg.sender] = true;

        // Add invitation slots (all with address(0) initially)
        for (uint256 i = 0; i < percentages.length; i++) {
            _poolMembers[poolId].push(
                Member({
                    member: address(0), // All slots start as invitation slots
                    percentage: percentages[i],
                    invitationCodeHash: invitationCodes[i]
                })
            );
        }

        emit PoolCreated(poolId, msg.sender, title, description, imageUri);
    }

    /// @inheritdoc IDistributor
    function joinPool(uint256 poolId, string calldata invitationCode) external {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        if (pool.status == PoolStatus.INACTIVE) revert PoolInactive(poolId);
        if (_isMember[poolId][msg.sender]) revert MemberAlreadyInPool();

        bytes32 providedHash = keccak256(abi.encodePacked(invitationCode));

        // Find slot with matching invitation code hash
        Member[] storage members = _poolMembers[poolId];
        bool slotFound = false;
        uint256 slotIndex;
        uint256 slotPercentage;

        for (uint256 i = 0; i < members.length; i++) {
            if (
                members[i].member == address(0) &&
                members[i].invitationCodeHash == providedHash &&
                members[i].invitationCodeHash != bytes32(0)
            ) {
                slotIndex = i;
                slotPercentage = members[i].percentage;
                slotFound = true;
                break;
            }
        }

        if (!slotFound) revert InvalidInvitationCode();

        // Assign member to the slot
        members[slotIndex].member = msg.sender;
        _isMember[poolId][msg.sender] = true;

        // Check if all members have joined and update pool status
        if (_allMembersJoined(poolId)) {
            _pools[poolId].status = PoolStatus.ACTIVE;
        }

        emit MemberJoined(poolId, msg.sender, slotPercentage);
    }

    /// @inheritdoc IDistributor
    function donate(uint256 poolId, uint256 amount) external {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        if (pool.status == PoolStatus.INACTIVE) revert PoolInactive(poolId);
        if (pool.status == PoolStatus.PENDING) revert PoolPending(poolId);
        if (amount == 0) revert InvalidDonationAmount();

        // Transfer USDC from donor to contract
        if (!usdc.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        // Split donation immediately to member balances
        Member[] storage members = _poolMembers[poolId];
        for (uint256 i = 0; i < members.length; i++) {
            uint256 memberShare = (amount * members[i].percentage) / 10000;
            _balances[members[i].member] += memberShare;
        }

        // Update pool balance for tracking
        pool.totalDonationsAmount += amount;
        pool.totalDonationsCount++;
        if (!_isDonator[poolId][msg.sender]) {
            pool.uniqueDonatorsCount++;
            _isDonator[poolId][msg.sender] = true;
        }

        emit DonationMade(poolId, msg.sender, amount);
    }

    /// @inheritdoc IDistributor
    function withdraw(uint256 amount, address recipient) external {
        if (amount == 0) revert InvalidWithdrawalAmount();

        uint256 balance = _balances[msg.sender];
        if (amount > balance) {
            revert InsufficientBalance(amount, balance);
        }

        // Update member's global balance
        _balances[msg.sender] -= amount;

        // Transfer USDC to recipient
        if (!usdc.transfer(recipient, amount)) {
            revert TransferFailed();
        }

        emit FundsWithdrawn(msg.sender, recipient, amount);
    }

    /// @inheritdoc IDistributor
    function deactivatePool(uint256 poolId) external {
        Pool storage pool = _pools[poolId];

        if (pool.id == 0) {
            revert PoolNotFound(poolId);
        } else if (msg.sender != pool.creator) {
            revert NotPoolCreator(msg.sender, poolId);
        }

        // deactivate pool
        pool.status = PoolStatus.INACTIVE;

        emit PoolDeactivated(poolId, msg.sender);
    }

    /// @inheritdoc IDistributor
    function getPool(uint256 poolId) external view returns (Pool memory pool) {
        return _pools[poolId];
    }

    /// @inheritdoc IDistributor
    function getPoolMembersCount(
        uint256 poolId
    ) external view returns (uint256 total) {
        return _poolMembers[poolId].length;
    }

    /// @inheritdoc IDistributor
    function getPoolMembers(
        uint256 poolId,
        uint256 offset,
        uint256 limit
    ) external view returns (Member[] memory members) {
        if (_pools[poolId].id == 0) revert PoolNotFound(poolId);

        if (offset > _poolMembers[poolId].length) {
            return new Member[](0);
        } else if (offset + limit > _poolMembers[poolId].length) {
            limit = _poolMembers[poolId].length - offset;
        }

        members = new Member[](limit);
        for (uint256 i = 0; i < limit; i++) {
            members[i] = _poolMembers[poolId][i + offset];
        }
    }

    /// @inheritdoc IDistributor
    function getBalanceOf(
        address member
    ) public view returns (uint256 availableAmount) {
        return _balances[member];
    }

    /// @inheritdoc IDistributor
    function getDonationsCount(
        uint256 poolId
    ) external view returns (uint256 total) {
        return _pools[poolId].totalDonationsCount;
    }

    /// @inheritdoc IDistributor
    function getUserPoolsCount(
        address user
    ) external view returns (uint256 total) {
        return _userPools[user].length;
    }

    /// @inheritdoc IDistributor
    function getUserPools(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (Pool[] memory pools) {
        if (offset > _userPools[user].length) {
            return new Pool[](0);
        } else if (offset + limit > _userPools[user].length) {
            limit = _userPools[user].length - offset;
        }

        pools = new Pool[](limit);
        for (uint256 i = 0; i < limit; i++) {
            pools[i] = _pools[_userPools[user][i + offset]];
        }
    }

    /// @notice Checks if all members have joined a pool (no address(0) slots remaining)
    /// @param poolId The pool identifier
    /// @return joined True if all members have joined
    function _allMembersJoined(
        uint256 poolId
    ) private view returns (bool joined) {
        Member[] storage members = _poolMembers[poolId];

        for (uint256 i = 0; i < members.length; i++) {
            if (members[i].member == address(0)) {
                return false;
            }
        }

        return true;
    }
}
