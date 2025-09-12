// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IDistributorErrors
 * @notice Interface defining all custom errors used by the Distributor contract
 * @dev Custom errors provide more gas-efficient error handling compared to require strings
 */
interface IDistributorErrors {
    /// @notice Thrown when trying to access a pool that doesn't exist
    error PoolNotFound(uint256 poolId);
    
    /// @notice Thrown when caller is not a member of the pool
    error NotPoolMember(address caller, uint256 poolId);
    
    /// @notice Thrown when caller is not the creator of the pool
    error NotPoolCreator(address caller, uint256 poolId);
    
    /// @notice Thrown when total member percentages exceed 100%
    error InvalidTotalPercentage(uint256 totalPercentage);
    
    /// @notice Thrown when individual percentage is zero or too high
    error InvalidMemberPercentage(uint256 percentage);
    
    /// @notice Thrown when trying to withdraw more than available balance
    error InsufficientBalance(uint256 requested, uint256 available);
    
    /// @notice Thrown when donation amount is zero
    error InvalidDonationAmount();
    
    /// @notice Thrown when withdrawal amount is zero
    error InvalidWithdrawalAmount();
    
    /// @notice Thrown when trying to operate on an inactive pool
    error PoolInactive(uint256 poolId);
    
    /// @notice Thrown when arrays have mismatched lengths
    error ArrayLengthMismatch();
    
    /// @notice Thrown when pool title is empty
    error EmptyTitle();
    
    /// @notice Thrown when USDC transfer fails
    error TransferFailed();

    /// @notice Thrown when creator percentage is zero
    error InvalidCreatorPercentage();
    
    /// @notice Thrown when invitation code is incorrect
    error InvalidInvitationCode();
    
    /// @notice Thrown when trying to join a slot that doesn't have invitation code
    error NoInvitationCodeForSlot();
    
    /// @notice Thrown when member is already in the pool
    error MemberAlreadyInPool();
    
    /// @notice Thrown when trying to join a slot that's already filled
    error SlotAlreadyFilled();
}