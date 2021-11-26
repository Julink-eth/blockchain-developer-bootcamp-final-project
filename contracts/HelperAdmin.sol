// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IVaultLongMaiFinance} from "./interfaces/IVaultLongMaiFinance.sol";

/**
 @title Contract administrator for all the vault contracts
 @author Julien Fontanel
 @notice Allows the owner to change variables in the vault contracts + allow to claim/check rewards in one transaction for a user
 @dev updatePeriodReward() will be called using chainlink keepers
 */
contract HelperAdmin is Ownable {
    constructor() {}

    /**
     @notice Claims all the rewards available for the user calling for all the vaults passed as parameter
     @param vaultAddresses addresses[] the vault addresses from which it claims the rewards
    */
    function claimRewards(address[] memory vaultAddresses) external {
        for (uint256 i = 0; i < vaultAddresses.length; i++) {
            IVaultLongMaiFinance(vaultAddresses[i]).claimRewardsFor(msg.sender);
        }
    }

    /**
     @notice Allow the onwer to update the rewards balance of a period to be shared among the users
     @param vaultAddress address The vault to update
     @param periodBlockStart uint256 the period to update (The period start is in seconds as we use block.timestamp)
     @param amount uint256 The amount to update
     @dev To be called using chainlink keepers
     */
    function updatePeriodReward(
        address vaultAddress,
        uint256 periodBlockStart,
        uint256 amount
    ) external onlyOwner {
        IVaultLongMaiFinance(vaultAddress).updateRewardsBalance(
            periodBlockStart,
            amount
        );
    }

    /**
     @notice Get the claimable rewards for all the contracts passed as parameter
     @param vaultAddresses addresses[] the vault addresses for which to check the rewards avaiable for the sender
     */
    function claimableRewards(address[] memory vaultAddresses)
        external
        view
        returns (uint256)
    {
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < vaultAddresses.length; i++) {
            totalRewards += IVaultLongMaiFinance(vaultAddresses[i])
                .claimableRewards(msg.sender);
        }

        return totalRewards;
    }
}
