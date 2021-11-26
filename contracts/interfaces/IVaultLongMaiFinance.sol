// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IVaultLongMaiFinance {
    function claimRewardsFor(address user) external;

    function updateRewardsBalance(uint256 periodBlockStart, uint256 amount)
        external;

    function claimableRewards(address user) external view returns (uint256);
}
