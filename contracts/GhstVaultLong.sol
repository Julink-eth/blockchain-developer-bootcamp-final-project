// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract GhstVaultLong is VaultLongMaiFinanceBase {
    address constant collateralAddr =
        0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7;
    address constant vaultAddr = 0xF086dEdf6a89e7B16145b03a6CB0C0a9979F1433;
    uint256 constant startBlockRewards = 1637160627;

    constructor()
        VaultLongMaiFinanceBase(collateralAddr, vaultAddr, startBlockRewards)
    {}
}
