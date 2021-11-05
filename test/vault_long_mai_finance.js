const addresses = require("./contractAdresses/addresses.json");
const utils = require("./utils/utils");
const Web3 = require("web3");
const BN = require("bn.js");
const erc20ABI = require("./abis/erc20.json");
const maiVaultABI = require("./abis/maiVault.json");

const LinkVaultLong = artifacts.require("LinkVaultLong");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("LinkVaultLong", function (accounts) {
    const currentProvider = web3.currentProvider;
    web3 = new Web3(currentProvider);

    const amountBase = web3.utils.toWei("0.001");
    const amountToLong = web3.utils.toWei("0.0023");

    it("should assert true", async function () {
        await LinkVaultLong.deployed();
        return assert.isTrue(true);
    });

    it("should be able to create a vault", async function () {
        const contract = await LinkVaultLong.deployed();
        const result = await contract.createVault();
        return assert.isTrue(result !== undefined);
    });

    it("should have more than 0 vault in MAI finance's contract", async function () {
        const contract = await LinkVaultLong.deployed();
        const maiVaultAddr = await contract.maiVault();
        await contract.createVault();
        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const balance = await maiContract.methods
            .balanceOf(contract.address)
            .call();
        return assert.isTrue(balance !== "0");
    });

    it("should be able to return vaults for sender", async function () {
        const contract = await LinkVaultLong.deployed();
        const results = await contract.getUserVaultList();
        return assert.isTrue(results.length > 0);
    });

    it("should be able to deposit funds to the vault", async function () {
        //First swap some token for some link and approve our contracts to spend the token
        const amountToDeposit = amountBase;
        const amountToGet = web3.utils
            .toBN(amountBase)
            .mul(new BN(10))
            .toString();
        const allowance = web3.utils
            .toBN(amountToGet)
            .mul(new BN(10))
            .toString();

        await utils.approveToken(
            addresses.tokenAddresses.WMATIC,
            allowance,
            addresses.contractAddresses.SUSHISWAP
        );

        await utils.getTokens(
            addresses.tokenAddresses.LINK,
            web3.utils.toWei("1"),
            amountToGet
        );

        //Then create a Vault and deposit the token acquired in the vault created
        const contract = await LinkVaultLong.deployed();

        await utils.approveToken(
            addresses.tokenAddresses.LINK,
            allowance,
            contract.address
        );

        const results = await contract.getUserVaultList();
        const firstVaultId = results[0].toString();

        await contract.depositCollateral(firstVaultId, amountToDeposit);

        //Deposit a second time to check if the amount adds up
        await contract.depositCollateral(firstVaultId, amountToDeposit);

        //Get the final amount after the 2 deposits
        const currentDeposit = await contract.getUserDeposit(
            accounts[0],
            firstVaultId
        );

        const depositToCheck = web3.utils
            .toBN(amountToDeposit)
            .mul(new BN(2))
            .toString();

        return assert.isTrue(currentDeposit.toString() === depositToCheck);
    });

    it("should not be able to withdraw more collateral than the user deposited", async function () {
        const contract = await LinkVaultLong.deployed();
        const results = await contract.getUserVaultList();
        const firstVaultId = results[0].toString();
        const amountToWithdraw = web3.utils.toWei("1");

        try {
            await contract.withdrawCollateral(firstVaultId, amountToWithdraw);
        } catch (err) {
            return assert.isTrue(err.reason === "AMOUNT_INSUFFICIENT");
        }

        return assert.isTrue(false);
    });

    it("should be able to withdraw collateral", async function () {
        const contract = await LinkVaultLong.deployed();
        const results = await contract.getUserVaultList();
        const firstVaultId = results[0].toString();
        const linkAddress = await contract.collateral();
        const erc20Contract = new web3.eth.Contract(erc20ABI, linkAddress);

        const balanceUserBefore = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceBeforeBN = web3.utils.toBN(balanceUserBefore.toString());

        const beforeWithdraw = await contract.getUserDeposit(
            accounts[0],
            firstVaultId
        );

        await contract.withdrawCollateral(firstVaultId, amountBase);

        const afterWithdraw = await contract.getUserDeposit(
            accounts[0],
            firstVaultId
        );

        const balanceUserAfter = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceAfterBN = web3.utils.toBN(balanceUserAfter.toString());
        const expected = balanceBeforeBN.add(web3.utils.toBN(amountBase));

        return assert.isTrue(
            afterWithdraw < beforeWithdraw &&
                balanceAfterBN.toString() === expected.toString()
        );
    });

    it("should be able to long an asset on a specific vault", async function () {
        const contract = await LinkVaultLong.deployed();
        const maiVaultAddr = await contract.maiVault();
        const vaultList = await contract.getUserVaultList();
        const firstVaultId = vaultList[0].toString();

        await contract.longAsset(firstVaultId, amountToLong);

        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const collateralInMai = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();

        const toCheck = web3.utils.toBN(amountBase);

        const collateralInMaiBN = web3.utils.toBN(collateralInMai);

        return assert.isTrue(collateralInMaiBN > toCheck);
    });

    it("should be able to reduce by 50% the open long on a specific vault", async function () {
        const contract = await LinkVaultLong.deployed();
        const maiVaultAddr = await contract.maiVault();
        const vaultList = await contract.getUserVaultList();
        const firstVaultId = vaultList[0].toString();

        //First get the debt amount
        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const debtAmount = await maiContract.methods
            .vaultDebt(firstVaultId)
            .call();
        const debtAmountBN = web3.utils.toBN(debtAmount);

        //We only want to repay half of the debt
        const amountDebtToReduce = debtAmountBN.div(new BN(2)).toString();

        await contract.reduceLong(firstVaultId, amountDebtToReduce);

        const newDebtAmount = await maiContract.methods
            .vaultDebt(firstVaultId)
            .call();

        const newDebtAmountBN = web3.utils.toBN(newDebtAmount);

        //We check if the new debt amount if smaller than the previous debt amount
        return assert.isTrue(debtAmountBN > newDebtAmountBN);
    });

    it("should be able to repay the full amount of debt and then withdraw the collateral from Mai finance", async function () {
        const contract = await LinkVaultLong.deployed();
        const maiVaultAddr = await contract.maiVault();
        const vaultList = await contract.getUserVaultList();
        const firstVaultId = vaultList[0].toString();

        //First get the debt amount
        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const debtAmount = await maiContract.methods
            .vaultDebt(firstVaultId)
            .call();
        const debtAmountBN = web3.utils.toBN(debtAmount);

        //Close the long by reducing to debt amount to 0
        await contract.reduceLong(firstVaultId, debtAmountBN.toString());

        //Withdraw the full collateral from the mai vault
        const collateralInMai = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();

        await contract.withdrawFromVault(
            firstVaultId,
            collateralInMai.toString()
        );

        //Check user deposit in the contract
        const userDeposit = await contract.getUserDeposit(
            accounts[0],
            firstVaultId
        );

        return assert.isTrue(userDeposit == collateralInMai);
    });
});
