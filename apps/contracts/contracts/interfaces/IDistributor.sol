// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDistributorErrors} from "./IDistributor.errors.sol";
import {IDistributorEvents} from "./IDistributor.events.sol";
import {IDistributorStructs} from "./IDistributor.structs.sol";

interface IDistributor is IDistributorErrors, IDistributorEvents, IDistributorStructs {
    /// @notice Creates a new fundraising pool
    /// @param title The title of the pool
    /// @param description The description of the pool
    /// @param imageUri The URI of the pool's image
    /// @param members Array of member addresses (use address(0) for invitation slots)
    /// @param percentages Array of percentages for each member (in basis points, 1% = 100)
    /// @param invitationCodes Array of hashed invitation codes for each slot
    /// @return poolId The unique identifier of the created pool
    function createPool(
        string calldata title,
        string calldata description,
        string calldata imageUri,
        address[] calldata members,
        uint256[] calldata percentages,
        bytes32[] calldata invitationCodes
    ) external returns (uint256 poolId);


    /// @notice Joins a pool using invitation code (claims an address(0) slot)
    /// @param poolId The pool identifier
    /// @param invitationCode The invitation code for the slot
    function joinPool(uint256 poolId, string calldata invitationCode) external;

    /// @notice Donates USDC to a specific pool
    /// @param poolId The pool identifier
    /// @param amount The amount to donate in USDC
    function donate(uint256 poolId, uint256 amount) external;

    /// @notice Withdraws available funds from a pool (only members can call)
    /// @param poolId The pool identifier
    /// @param amount The amount to withdraw in USDC
    /// @param recipient The address to receive the funds
    function withdraw(uint256 poolId, uint256 amount, address recipient) external;

    /// @notice Deactivates a pool (only creator can call)
    /// @param poolId The pool identifier
    function deactivatePool(uint256 poolId) external;

    /// @notice Gets pool information
    /// @param poolId The pool identifier
    /// @return pool The pool struct
    function getPool(uint256 poolId) external view returns (Pool memory pool);

    /// @notice Gets all members of a pool with their information
    /// @param poolId The pool identifier
    /// @return members Array of member information
    function getPoolMembers(uint256 poolId) external view returns (Member[] memory members);

    /// @notice Gets the available balance for a specific member in a pool
    /// @param poolId The pool identifier
    /// @param member The member address
    /// @return availableAmount The amount available for withdrawal
    function getAvailableBalance(uint256 poolId, address member) external view returns (uint256 availableAmount);

    /// @notice Gets the total balance of a pool
    /// @param poolId The pool identifier
    /// @return totalBalance The current total balance of the pool
    function getPoolBalance(uint256 poolId) external view returns (uint256 totalBalance);

    /// @notice Gets the next available pool ID
    /// @return nextPoolId The next pool ID that will be assigned
    function getNextPoolId() external view returns (uint256 nextPoolId);

    /// @notice Gets the USDC token address
    /// @return usdcAddress The address of the USDC token contract
    function getUSDCAddress() external view returns (address usdcAddress);
}
