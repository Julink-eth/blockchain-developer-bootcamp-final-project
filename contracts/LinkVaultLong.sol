// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract LinkVaultLong is VaultLongMaiFinanceBase {
    address constant collateralAddr =
        0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39;
    address constant vaultAddr = 0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72;
    uint256 constant startBlockRewards = 1637160627;

    constructor()
        VaultLongMaiFinanceBase(collateralAddr, vaultAddr, startBlockRewards)
    {}
}
