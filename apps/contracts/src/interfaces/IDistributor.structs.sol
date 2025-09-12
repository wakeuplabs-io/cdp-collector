// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IDistributorStructs
 * @notice Interface defining all data structures used by the Distributor contract
 * @dev These structs organize pool, member, and donation data in a standardized format
 */
interface IDistributorStructs {
    struct Pool {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageUri;
        uint256 totalBalance;
        uint256 totalWithdrawn;
        uint256 createdAt;
        bool active;
    }

    struct Member {
        address memberAddress;
        bytes32 invitationCodeHash;
        uint256 percentage; // Basis points (1% = 100, 100% = 10000)
        uint256 totalWithdrawn;
    }
}
