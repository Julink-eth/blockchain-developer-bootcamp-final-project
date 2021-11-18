// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract WbtcVaultLong is VaultLongMaiFinanceBase {
    address COLLATERAL_ADDRESS = 0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6;
    address VAULT_ADDRESS = 0x37131aEDd3da288467B6EBe9A77C523A700E6Ca1;

    constructor() VaultLongMaiFinanceBase(COLLATERAL_ADDRESS, VAULT_ADDRESS) {}
}
