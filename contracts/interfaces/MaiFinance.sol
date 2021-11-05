// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20StableCoin {
    function depositCollateral(uint256 vaultID, uint256 amount) external;

    function borrowToken(uint256 vaultID, uint256 amount) external;

    function _minimumCollateralPercentage() external view returns (uint256);

    function vaultDebt(uint256 vaultId) external view returns (uint256);

    function payBackToken(uint256 vaultID, uint256 amount) external;

    function withdrawCollateral(uint256 vaultID, uint256 amount) external;

    function createVault() external returns (uint256);
}
