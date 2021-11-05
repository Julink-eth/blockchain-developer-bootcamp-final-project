// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinance} from "./VaultLongMaiFinance.sol";

contract LinkVaultLong is VaultLongMaiFinance {
    address LINK_COLLATERAL = 0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39;
    address MAI_LINK_VAULT = 0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72;

    constructor() VaultLongMaiFinance(LINK_COLLATERAL, MAI_LINK_VAULT) {}
}
