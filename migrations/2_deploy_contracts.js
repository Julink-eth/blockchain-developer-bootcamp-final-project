const VaultLongMaiFinance = artifacts.require("VaultLongMaiFinance");

module.exports = function (deployer) {
    deployer.deploy(VaultLongMaiFinance);
};
