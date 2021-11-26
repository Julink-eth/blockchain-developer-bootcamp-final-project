// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {VaultLongMaiFinanceBase} from "./VaultLongMaiFinanceBase.sol";

contract WethVaultLong is VaultLongMaiFinanceBase {
    constructor(
        address collateralAddr,
        address vaultAddr,
        uint256 periodStartRewards,
        address aaveLendingPoolAddr,
        address _usdcAddr,
        address _maiAddr,
        address _wmaticAddr,
        address _qiAddr,
        address _quickswapRouterAddr
    )
        VaultLongMaiFinanceBase(
            collateralAddr,
            vaultAddr,
            periodStartRewards,
            aaveLendingPoolAddr,
            _usdcAddr,
            _maiAddr,
            _wmaticAddr,
            _qiAddr,
            _quickswapRouterAddr
        )
    {}
}
