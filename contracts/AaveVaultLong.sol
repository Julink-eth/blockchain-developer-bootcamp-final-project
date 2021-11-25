// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract AaveVaultLong is VaultLongMaiFinanceBase {
    address constant collateralAddr =
        0xD6DF932A45C0f255f85145f286eA0b292B21C90B;
    address constant vaultAddr = 0x87ee36f780ae843A78D5735867bc1c13792b7b11;
    uint256 constant startBlockRewards = 1637160627;

    constructor()
        VaultLongMaiFinanceBase(collateralAddr, vaultAddr, startBlockRewards)
    {}
}
