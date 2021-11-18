// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract GhstVaultLong is VaultLongMaiFinanceBase {
    address COLLATERAL_ADDRESS = 0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7;
    address VAULT_ADDRESS = 0xF086dEdf6a89e7B16145b03a6CB0C0a9979F1433;

    constructor() VaultLongMaiFinanceBase(COLLATERAL_ADDRESS, VAULT_ADDRESS) {}
}
