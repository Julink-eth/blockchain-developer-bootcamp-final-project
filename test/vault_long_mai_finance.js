const { time } = require("@openzeppelin/test-helpers");
const addresses = require("./contractAdresses/addresses.json");
const utils = require("./utils/utils");
const Web3 = require("web3");
const BN = require("bn.js");
const erc20ABI = require("./abis/erc20.json");
const maiVaultABI = require("./abis/maiVault.json");

const LinkVaultLong = artifacts.require("LinkVaultLong");
const HelperAdmin = artifacts.require("HelperAdmin");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("LinkVaultLong", function (accounts) {
    const currentProvider = web3.currentProvider;
    web3 = new Web3(currentProvider);

    const amountBase = web3.utils.toWei("0.001");
    //Long x1.3
    const amountToLong = web3.utils.toWei("0.0013");

    it("should assert true if the contract is deployed", async function () {
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

    it("should be able to long an asset on a specific vault", async function () {
        //First swap some token for some link and approve our contracts to spend the token
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

        const contract = await LinkVaultLong.deployed();

        await utils.approveToken(
            addresses.tokenAddresses.LINK,
            allowance,
            contract.address
        );

        await contract.createVault();
        const maiVaultAddr = await contract.maiVault();
        const vaultList = await contract.getUserVaultList();
        const firstVaultId = vaultList[0].toString();

        await contract.longAsset(firstVaultId, amountToLong, amountBase);

        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const collateralInMai = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();

        const toCheck = web3.utils
            .toBN(amountToLong)
            .add(web3.utils.toBN(amountBase));

        const collateralInMaiBN = web3.utils.toBN(collateralInMai);

        return assert.isTrue(
            collateralInMaiBN.toString() === toCheck.toString()
        );
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

    it("should be able to claim rewards and update the reward balance in the contract", async function () {
        const contract = await LinkVaultLong.deployed();
        const helperAdminInstance = await HelperAdmin.deployed();
        const erc20Contract = new web3.eth.Contract(
            erc20ABI,
            addresses.tokenAddresses.QI
        );

        //Send Qi to the contract (Simulate an airdrop from Mai Finance)
        const allowance = web3.utils.toWei("1");
        await utils.approveToken(
            addresses.tokenAddresses.WMATIC,
            allowance,
            addresses.contractAddresses.QUICKSWAP
        );

        await utils.getTokens(
            addresses.tokenAddresses.QI,
            allowance,
            allowance,
            addresses.contractAddresses.QUICKSWAP
        );

        await utils.sendERC20(
            addresses.tokenAddresses.QI,
            allowance,
            contract.address
        );

        const currentPeriodStart = await contract.currentPeriodStart();

        await helperAdminInstance.updatePeriodReward(
            contract.address,
            currentPeriodStart.toString(),
            allowance
        );

        const balanceQiBefore = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();

        //Simulate a week since the user can only claim only a week after it enters the protocol
        await time.increaseTo(
            (await time.latest()).add(time.duration.weeks(1))
        );

        await helperAdminInstance.claimRewards([contract.address]);

        const balanceQiAfter = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();

        const expected = web3.utils
            .toBN(balanceQiAfter)
            .sub(web3.utils.toBN(balanceQiBefore));

        //The user is supposed to get all the rewards since he's the only one with a debt
        return assert.isTrue(expected.toString() === allowance.toString());
    });

    it("should be able to repay the full debt amount", async function () {
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

        //Get the MAI to repay the debt
        const allowance = web3.utils.toWei("11");
        await utils.approveToken(
            addresses.tokenAddresses.WMATIC,
            allowance,
            addresses.contractAddresses.QUICKSWAP
        );

        await utils.getTokens(
            addresses.tokenAddresses.MAI,
            web3.utils.toWei("11"),
            debtAmountBN.toString(),
            addresses.contractAddresses.QUICKSWAP
        );

        await utils.approveToken(
            addresses.tokenAddresses.MAI,
            debtAmountBN.toString(),
            contract.address
        );

        //Close the long by reducing to debt amount to 0
        await contract.repay(firstVaultId, debtAmountBN.toString());

        const newDebtAmount = await maiContract.methods
            .vaultDebt(firstVaultId)
            .call();

        return assert.isTrue(newDebtAmount.toString() == "0");
    });

    it("should be able to withdraw collateral", async function () {
        const contract = await LinkVaultLong.deployed();
        const results = await contract.getUserVaultList();
        const firstVaultId = results[0].toString();
        const linkAddress = await contract.collateral();
        const erc20Contract = new web3.eth.Contract(erc20ABI, linkAddress);
        const maiVaultAddr = await contract.maiVault();
        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const collateralInMai = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();

        const balanceUserBefore = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceBeforeBN = web3.utils.toBN(balanceUserBefore.toString());

        await contract.withdrawCollateral(
            firstVaultId,
            collateralInMai.toString()
        );

        const balanceUserAfter = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceAfterBN = web3.utils.toBN(balanceUserAfter.toString());
        const expected = balanceBeforeBN.add(
            web3.utils.toBN(collateralInMai.toString())
        );

        return assert.isTrue(balanceAfterBN.toString() === expected.toString());
    });

    it("should be able to deposit collateral", async function () {
        const contract = await LinkVaultLong.deployed();
        const results = await contract.getUserVaultList();
        const firstVaultId = results[0].toString();
        const linkAddress = await contract.collateral();
        const erc20Contract = new web3.eth.Contract(erc20ABI, linkAddress);
        const maiVaultAddr = await contract.maiVault();
        const maiContract = new web3.eth.Contract(maiVaultABI, maiVaultAddr);
        const collateralInMaiBefore = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();
        const collateralInMaiBeforeBN = web3.utils.toBN(
            collateralInMaiBefore.toString()
        );

        const balanceUserBefore = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceBeforeBN = web3.utils.toBN(balanceUserBefore.toString());

        const toDeposit = web3.utils.toWei("0.00001");
        await contract.deposit(firstVaultId, toDeposit);

        const balanceUserAfter = await erc20Contract.methods
            .balanceOf(accounts[0])
            .call();
        const balanceAfterBN = web3.utils.toBN(balanceUserAfter.toString());
        const expected = balanceBeforeBN.sub(web3.utils.toBN(toDeposit));

        const collateralInMaiAfter = await maiContract.methods
            .vaultCollateral(firstVaultId)
            .call();
        const expected2 = collateralInMaiBeforeBN.add(
            web3.utils.toBN(toDeposit)
        );

        return assert.isTrue(
            balanceAfterBN.toString() === expected.toString() &&
                collateralInMaiAfter.toString() === expected2.toString()
        );
    });

    it("should not be able to update the reward balances directly in the vault contract", async function () {
        const contract = await LinkVaultLong.deployed();

        let message = "";
        try {
            await contract.updateRewardsBalance("1638338400", "10000000000");
        } catch (error) {
            message = error.reason;
        }

        return assert.isTrue(message === "Ownable: caller is not the owner");
    });
});
