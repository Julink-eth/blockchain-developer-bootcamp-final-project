// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract WethVaultLong is VaultLongMaiFinanceBase {
    address COLLATERAL_ADDRESS = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address VAULT_ADDRESS = 0x3fd939B017b31eaADF9ae50C7fF7Fa5c0661d47C;

    constructor() VaultLongMaiFinanceBase(COLLATERAL_ADDRESS, VAULT_ADDRESS) {}
}
