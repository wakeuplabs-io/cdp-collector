// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDistributor} from "./interfaces/IDistributor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Distributor is IDistributor {
    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice Counter for generating unique pool IDs
    uint256 private _nextPoolId = 1;

    /// @notice Mapping from pool ID to pool data
    mapping(uint256 => Pool) private _pools;

    /// @notice Mapping from pool ID to array of members
    mapping(uint256 => Member[]) private _poolMembers;

    /// @notice Mapping from pool ID to member address to member index (for faster lookups)
    mapping(uint256 => mapping(address => uint256)) private _memberIndices;

    /// @notice Mapping to check if an address is a member of a pool
    mapping(uint256 => mapping(address => bool)) private _isMember;

    constructor(address _usdcAddress) {
        usdc = IERC20(_usdcAddress);
    }

    /// @inheritdoc IDistributor
    function createPool(
        string calldata title,
        string calldata description,
        string calldata imageUri,
        address[] calldata members,
        uint256[] calldata percentages
    ) external returns (uint256 poolId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (members.length != percentages.length) revert ArrayLengthMismatch();

        // Calculate total percentage for members
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
        poolId = _nextPoolId++;

        // Create the pool
        _pools[poolId] = Pool({
            id: poolId,
            creator: msg.sender,
            title: title,
            description: description,
            imageUri: imageUri,
            totalBalance: 0,
            totalWithdrawn: 0,
            createdAt: block.timestamp,
            active: true
        });

        // Add creator as first member
        _poolMembers[poolId].push(
            Member({
                memberAddress: msg.sender,
                percentage: creatorPercentage,
                totalWithdrawn: 0
            })
        );
        _memberIndices[poolId][msg.sender] = 0;
        _isMember[poolId][msg.sender] = true;

        // Add other members
        for (uint256 i = 0; i < members.length; i++) {
            _poolMembers[poolId].push(
                Member({
                    memberAddress: members[i],
                    percentage: percentages[i],
                    totalWithdrawn: 0
                })
            );
            _memberIndices[poolId][members[i]] =
                _poolMembers[poolId].length -
                1;
            _isMember[poolId][members[i]] = true;
        }

        emit PoolCreated(
            poolId,
            msg.sender,
            title,
            description,
            imageUri,
            creatorPercentage
        );
    }

    /// @inheritdoc IDistributor
    function donate(uint256 poolId, uint256 amount) external {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        if (!pool.active) revert PoolInactive(poolId);
        if (amount == 0) revert InvalidDonationAmount();

        // Transfer USDC from donor to contract
        if (!usdc.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        // Update pool balance
        pool.totalBalance += amount;

        emit DonationMade(poolId, msg.sender, amount, pool.totalBalance);
    }

    /// @inheritdoc IDistributor
    function withdraw(
        uint256 poolId,
        uint256 amount,
        address recipient
    ) external {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        if (!pool.active) revert PoolInactive(poolId);
        if (!_isMember[poolId][msg.sender])
            revert NotPoolMember(msg.sender, poolId);
        if (amount == 0) revert InvalidWithdrawalAmount();

        uint256 availableAmount = getAvailableBalance(poolId, msg.sender);
        if (amount > availableAmount) {
            revert InsufficientBalance(amount, availableAmount);
        }

        // Update member's withdrawn amount
        uint256 memberIndex = _memberIndices[poolId][msg.sender];
        _poolMembers[poolId][memberIndex].totalWithdrawn += amount;
        pool.totalWithdrawn += amount;

        // Transfer USDC to recipient
        if (!usdc.transfer(recipient, amount)) {
            revert TransferFailed();
        }

        emit FundsWithdrawn(poolId, msg.sender, amount, recipient);
    }

    /// @inheritdoc IDistributor
    function deactivatePool(uint256 poolId) external {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        if (msg.sender != pool.creator)
            revert NotPoolCreator(msg.sender, poolId);

        pool.active = false;
        emit PoolDeactivated(poolId, msg.sender);
    }

    /// @inheritdoc IDistributor
    function getPool(uint256 poolId) external view returns (Pool memory pool) {
        pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
    }

    /// @inheritdoc IDistributor
    function getPoolMembers(
        uint256 poolId
    ) external view returns (Member[] memory members) {
        //  TODO: simplify?
        if (_pools[poolId].id == 0) revert PoolNotFound(poolId);

        Member[] storage poolMembers = _poolMembers[poolId];

        members = new Member[](poolMembers.length);
        uint256 index = 0;

        for (uint256 i = 0; i < poolMembers.length; i++) {
            members[index] = Member({
                memberAddress: poolMembers[i].memberAddress,
                percentage: poolMembers[i].percentage,
                totalWithdrawn: poolMembers[i].totalWithdrawn
            });
            index++;
        }
    }

    /// @inheritdoc IDistributor
    function getAvailableBalance(
        uint256 poolId,
        address member
    ) public view returns (uint256 availableAmount) {
        if (_pools[poolId].id == 0) revert PoolNotFound(poolId);
        if (!_isMember[poolId][member]) return 0;

        uint256 memberIndex = _memberIndices[poolId][member];
        Member storage memberData = _poolMembers[poolId][memberIndex];

        Pool storage pool = _pools[poolId];
        uint256 memberShare = (pool.totalBalance * memberData.percentage) /
            10000;

        if (memberShare > memberData.totalWithdrawn) {
            availableAmount = memberShare - memberData.totalWithdrawn;
        }
    }

    /// @inheritdoc IDistributor
    function getPoolBalance(
        uint256 poolId
    ) external view returns (uint256 totalBalance) {
        Pool storage pool = _pools[poolId];
        if (pool.id == 0) revert PoolNotFound(poolId);
        return pool.totalBalance;
    }

    /// @inheritdoc IDistributor
    function getNextPoolId() external view returns (uint256 nextPoolId) {
        return _nextPoolId;
    }

    /// @inheritdoc IDistributor
    function getUSDCAddress() external view returns (address usdcAddress) {
        return address(usdc);
    }
}
