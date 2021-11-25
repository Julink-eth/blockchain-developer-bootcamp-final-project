const LinkVaultLong = artifacts.require("LinkVaultLong.sol");
const WethVaultLong = artifacts.require("WethVaultLong.sol");
const WbtcVaultLong = artifacts.require("WbtcVaultLong.sol");
const AaveVaultLong = artifacts.require("AaveVaultLong.sol");
const GhstVaultLong = artifacts.require("GhstVaultLong.sol");
const HelperAdmin = artifacts.require("HelperAdmin.sol");

module.exports = async function (deployer) {
    await deployer.deploy(LinkVaultLong);
    await deployer.deploy(WethVaultLong);
    await deployer.deploy(WbtcVaultLong);
    await deployer.deploy(AaveVaultLong);
    await deployer.deploy(GhstVaultLong);
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
