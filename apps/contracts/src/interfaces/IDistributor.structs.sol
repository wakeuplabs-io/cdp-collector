// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IDistributorStructs
 * @notice Interface defining all data structures used by the Distributor contract
 * @dev These structs organize pool, member, and donation data in a standardized format
 */
interface IDistributorStructs {

    enum PoolStatus {
        PENDING, // Waiting for all members to join
        ACTIVE,
        INACTIVE
    }

    struct Pool {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageUri;
        uint256 totalDonationsAmount;
        uint256 totalDonationsCount;
        uint256 uniqueDonatorsCount;
        uint256 createdAt;
        PoolStatus status;
    }

    struct Member {
        address member;
        bytes32 invitationCodeHash;
        uint256 percentage; // Basis points (1% = 100, 100% = 10000)
    }
}
