const LinkVaultLong = artifacts.require("LinkVaultLong.sol");
const WethVaultLong = artifacts.require("WethVaultLong.sol");
const WbtcVaultLong = artifacts.require("WbtcVaultLong.sol");
const AaveVaultLong = artifacts.require("AaveVaultLong.sol");
const GhstVaultLong = artifacts.require("GhstVaultLong.sol");

module.exports = function (deployer) {
    deployer.deploy(LinkVaultLong);
    deployer.deploy(WethVaultLong);
    deployer.deploy(WbtcVaultLong);
    deployer.deploy(AaveVaultLong);
    deployer.deploy(GhstVaultLong);
};
