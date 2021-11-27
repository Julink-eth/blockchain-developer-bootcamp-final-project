const LinkVaultLong = artifacts.require("LinkVaultLong.sol");
const WethVaultLong = artifacts.require("WethVaultLong.sol");
const WbtcVaultLong = artifacts.require("WbtcVaultLong.sol");
const AaveVaultLong = artifacts.require("AaveVaultLong.sol");
const GhstVaultLong = artifacts.require("GhstVaultLong.sol");
const HelperAdmin = artifacts.require("HelperAdmin.sol");

module.exports = async function (deployer, network) {
    let collateralAddr = {
        link: {
            development: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
            polygonMainnet: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
        },
        weth: {
            development: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            polygonMainnet: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        },
        wbtc: {
            development: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
            polygonMainnet: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
        },
        aave: {
            development: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
            polygonMainnet: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
        },
        ghst: {
            development: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
            polygonMainnet: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        },
    };
    let vaultAddr = {
        link: {
            development: "0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72",
            polygonMainnet: "0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72",
        },
        weth: {
            development: "0x3fd939B017b31eaADF9ae50C7fF7Fa5c0661d47C",
            polygonMainnet: "0x3fd939B017b31eaADF9ae50C7fF7Fa5c0661d47C",
        },
        wbtc: {
            development: "0x37131aEDd3da288467B6EBe9A77C523A700E6Ca1",
            polygonMainnet: "0x37131aEDd3da288467B6EBe9A77C523A700E6Ca1",
        },
        aave: {
            development: "0x87ee36f780ae843A78D5735867bc1c13792b7b11",
            polygonMainnet: "0x87ee36f780ae843A78D5735867bc1c13792b7b11",
        },
        ghst: {
            development: "0xF086dEdf6a89e7B16145b03a6CB0C0a9979F1433",
            polygonMainnet: "0xF086dEdf6a89e7B16145b03a6CB0C0a9979F1433",
        },
    };
    let periodStartRewards = "1637733600";
    let aaveLendingPoolAddr = {
        development: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
        polygonMainnet: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
    };
    let _usdcAddr = {
        development: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        polygonMainnet: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    };
    let _maiAddr = {
        development: "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1",
        polygonMainnet: "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1",
    };
    let _wmaticAddr = {
        development: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        polygonMainnet: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    };
    let _qiAddr = {
        development: "0x580A84C73811E1839F75d86d75d88cCa0c241fF4",
        polygonMainnet: "0x580A84C73811E1839F75d86d75d88cCa0c241fF4",
    };
    let _quickswapRouterAddr = {
        development: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        polygonMainnet: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    };

    await deployer.deploy(
        LinkVaultLong,
        collateralAddr.link[network],
        vaultAddr.link[network],
        periodStartRewards,
        aaveLendingPoolAddr[network],
        _usdcAddr[network],
        _maiAddr[network],
        _wmaticAddr[network],
        _qiAddr[network],
        _quickswapRouterAddr[network]
    );
    await deployer.deploy(
        WethVaultLong,
        collateralAddr.weth[network],
        vaultAddr.weth[network],
        periodStartRewards,
        aaveLendingPoolAddr[network],
        _usdcAddr[network],
        _maiAddr[network],
        _wmaticAddr[network],
        _qiAddr[network],
        _quickswapRouterAddr[network]
    );
    await deployer.deploy(
        WbtcVaultLong,
        collateralAddr.wbtc[network],
        vaultAddr.wbtc[network],
        periodStartRewards,
        aaveLendingPoolAddr[network],
        _usdcAddr[network],
        _maiAddr[network],
        _wmaticAddr[network],
        _qiAddr[network],
        _quickswapRouterAddr[network]
    );
    await deployer.deploy(
        AaveVaultLong,
        collateralAddr.aave[network],
        vaultAddr.aave[network],
        periodStartRewards,
        aaveLendingPoolAddr[network],
        _usdcAddr[network],
        _maiAddr[network],
        _wmaticAddr[network],
        _qiAddr[network],
        _quickswapRouterAddr[network]
    );
    await deployer.deploy(
        GhstVaultLong,
        collateralAddr.ghst[network],
        vaultAddr.ghst[network],
        periodStartRewards,
        aaveLendingPoolAddr[network],
        _usdcAddr[network],
        _maiAddr[network],
        _wmaticAddr[network],
        _qiAddr[network],
        _quickswapRouterAddr[network]
    );

    await deployer.deploy(HelperAdmin);

    //We transfer the ownership of the vaults to the admin contract
    const helperInstance = await HelperAdmin.deployed();
    const linkVaultInstance = await LinkVaultLong.deployed();
    const WethVaultInstance = await WethVaultLong.deployed();
    const WbtcVaultInstance = await WbtcVaultLong.deployed();
    const AaveVaultInstance = await AaveVaultLong.deployed();
    const GhstVaultInstance = await GhstVaultLong.deployed();
    await linkVaultInstance.transferOwnership(helperInstance.address);
    await WethVaultInstance.transferOwnership(helperInstance.address);
    await WbtcVaultInstance.transferOwnership(helperInstance.address);
    await AaveVaultInstance.transferOwnership(helperInstance.address);
    await GhstVaultInstance.transferOwnership(helperInstance.address);
};
