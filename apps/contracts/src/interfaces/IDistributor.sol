// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDistributorErrors} from "./IDistributor.errors.sol";
import {IDistributorEvents} from "./IDistributor.events.sol";
import {IDistributorStructs} from "./IDistributor.structs.sol";

interface IDistributor is
    IDistributorErrors,
    IDistributorEvents,
    IDistributorStructs
{
    /// @notice Creates a new fundraising pool
    /// @param title The title of the pool
    /// @param description The description of the pool
    /// @param imageUri The URI of the pool's image
    /// @param percentages Array of percentages for invitation slots (in basis points, 1% = 100)
    /// @param invitationCodes Array of hashed invitation codes for each slot
    /// @return poolId The unique identifier of the created pool
    /// @dev Creator is automatically added with percentage = 10000 - sum(percentages)
    /// @dev All other members must join using invitation codes
    function createPool(
        string calldata title,
        string calldata description,
        string calldata imageUri,
        bytes32[] calldata invitationCodes,
        uint256[] calldata percentages
    ) external returns (uint256 poolId);

    /// @notice Gets pool information
    /// @param poolId The pool identifier
    /// @return pool The pool struct
    function getPool(uint256 poolId) external view returns (Pool memory pool);

    /// @notice Gets the number of members in a pool
    /// @param poolId The pool identifier
    /// @return total The number of members in the pool
    function getPoolMembersCount(
        uint256 poolId
    ) external view returns (uint256 total);

    /// @notice Gets members of a pool with their information (paginated)
    /// @param poolId The pool identifier
    /// @param offset Starting index for pagination (0-based)
    /// @param limit Maximum number of members to return
    /// @return members Array of member information
    function getPoolMembers(
        uint256 poolId,
        uint256 offset,
        uint256 limit
    ) external view returns (Member[] memory members);

    /// @notice Gets the summary of a pool
    /// @param poolId The pool identifier
    /// @return summary The summary of the pool
    function getPoolSummary(
        uint256 poolId
    ) external view returns (PoolSummary memory summary);

    /// @notice Gets the summary of a user
    /// @param user The address of the user
    /// @return summary The summary of the user
    function getUserSummary(
        address user
    ) external view returns (UserSummary memory summary);

    /// @notice Gets the number of pools that a user is a member of
    /// @param user The address to check membership for
    /// @return total The number of pools the user is a member of
    function getUserPoolsCount(
        address user
    ) external view returns (uint256 total);

    /// @notice Gets pool IDs that a user is a member of (paginated)
    /// @param user The address to check membership for
    /// @param offset Starting index for pagination (0-based)
    /// @param limit Maximum number of pool IDs to return
    /// @return pools Array of pool IDs where the user is a member
    function getUserPools(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (Pool[] memory pools);

    /// @notice Joins a pool using invitation code (claims an address(0) slot)
    /// @param poolId The pool identifier
    /// @param invitationCode The invitation code for the slot
    function joinPool(uint256 poolId, bytes32 invitationCode) external;

    /// @notice Deactivates a pool (only creator can call)
    /// @param poolId The pool identifier
    function deactivatePool(uint256 poolId) external;

    /// @notice Donates USDC to a specific pool
    /// @param poolId The pool identifier
    /// @param amount The amount to donate in USDC
    function donate(uint256 poolId, uint256 amount) external;
}
