const LinkVaultLong = artifacts.require("LinkVaultLong.sol");
const WethVaultLong = artifacts.require("WethVaultLong.sol");

module.exports = function (deployer) {
    deployer.deploy(LinkVaultLong);
    deployer.deploy(WethVaultLong);
};
