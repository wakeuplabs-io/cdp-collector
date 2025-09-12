// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDistributorStructs} from "./IDistributor.structs.sol";

/**
 * @title IDistributorEvents
 * @notice Interface defining all events emitted by the Distributor contract
 * @dev These events provide transparency and allow off-chain applications to track fundraising activity
 */
interface IDistributorEvents {
    /// @notice Emitted when a new pool is created
    /// @param poolId The unique identifier of the pool
    /// @param creator The address of the pool creator
    /// @param title The title of the pool
    /// @param description The description of the pool
    /// @param imageUri The URI of the pool's image
    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        string title,
        string description,
        string imageUri
    );


    /// @notice Emitted when a donation is made to a pool
    /// @param poolId The pool identifier
    /// @param donor The address of the donor
    /// @param amount The amount donated in USDC
    /// @param newTotalBalance The new total balance of the pool
    event DonationMade(
        uint256 indexed poolId,
        address indexed donor,
        uint256 amount,
        uint256 newTotalBalance
    );

    /// @notice Emitted when funds are withdrawn from a pool
    /// @param poolId The pool identifier
    /// @param member The address of the member withdrawing
    /// @param amount The amount withdrawn in USDC
    /// @param recipient The address receiving the funds
    event FundsWithdrawn(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted when a pool is deactivated
    /// @param poolId The pool identifier
    /// @param deactivatedBy The address that deactivated the pool
    event PoolDeactivated(
        uint256 indexed poolId,
        address indexed deactivatedBy
    );

    /// @notice Emitted when someone joins a pool using invitation code
    /// @param poolId The pool identifier
    /// @param member The address of the member who joined
    /// @param percentage The percentage they received
    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 percentage
    );

}