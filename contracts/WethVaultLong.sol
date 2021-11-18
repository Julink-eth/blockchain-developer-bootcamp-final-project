// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinance} from "./VaultLongMaiFinance.sol";

contract WethVaultLong is VaultLongMaiFinance {
    address WETH_COLLATERAL = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address MAI_WETH_VAULT = 0x3fd939B017b31eaADF9ae50C7fF7Fa5c0661d47C;

    constructor() VaultLongMaiFinance(WETH_COLLATERAL, MAI_WETH_VAULT) {}
}
