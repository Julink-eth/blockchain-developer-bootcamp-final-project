// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IVaultLongMaiFinance} from "./interfaces/IVaultLongMaiFinance.sol";

contract HelperAdmin is Ownable {
    constructor() {}

    /**
     Will claim all the rewards available for the user calling for all the vaults
     passed as parameter
    */
    function claimRewards(address[] memory vaultAddresses) external {
        for (uint256 i = 0; i < vaultAddresses.length; i++) {
            IVaultLongMaiFinance(vaultAddresses[i]).claimRewardsFor(msg.sender);
        }
    }

    /**
     Allow the onwer to update the rewards balance of a period to be shared among the users
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
     Get the claimable rewards for all the contracts passed as parameter
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
