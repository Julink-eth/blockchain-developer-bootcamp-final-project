// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract LinkVaultLong is VaultLongMaiFinanceBase {
    address COLLATERAL_ADDRESS = 0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39;
    address VAULT_ADDRESS = 0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72;

    constructor() VaultLongMaiFinanceBase(COLLATERAL_ADDRESS, VAULT_ADDRESS) {}
}
