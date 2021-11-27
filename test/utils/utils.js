const { time } = require("@openzeppelin/test-helpers");
const sushiswapABI = require("../abis/sushiswap.json");
const addresses = require("../contractAdresses/addresses.json");
const erc20ABI = require("../abis/erc20.json");

require("dotenv").config();

const publicKey1 = process.env.TEST_WALLET_PUBLIC_KEY;
const privateKey1 = process.env.TEST_WALLET_PRIVATE_KEY;

//Some functions to make it easier to interact with external contracts sush as Routers to make swaps during the tests
module.exports = {
    getTokens: async (
        tokenAddress,
        maticToSpend,
        amountToGet,
        routerAddress = addresses.contractAddresses.SUSHISWAP
    ) => {
        const exchangeContract = new web3.eth.Contract(
            sushiswapABI,
            routerAddress
        );

        const encodedABI = exchangeContract.methods
            .swapETHForExactTokens(
                amountToGet,
                [addresses.tokenAddresses.WMATIC, tokenAddress],
                publicKey1,
                (await time.latest()) + 3600
            )
            .encodeABI();

        const gasEstimated = await estimateGas(
            publicKey1,
            routerAddress,
            encodedABI,
            maticToSpend
        );

        const tx = {
            from: publicKey1,
            gas: gasEstimated.gasLimit,
            gasPrice: gasEstimated.gasPrice,
            to: routerAddress,
            data: encodedABI,
            value: maticToSpend,
        };

        const signedTx = await web3.eth.accounts.signTransaction(
            tx,
            privateKey1
        );

        await web3.eth.sendSignedTransaction(
            signedTx.raw || signedTx.rawTransaction
        );
    },

    approveToken: async (tokenAddress, amountToApprove, spender) => {
        const erc20Contract = new web3.eth.Contract(erc20ABI, tokenAddress);

        const encodedABI = erc20Contract.methods
            .approve(spender, amountToApprove)
            .encodeABI();

        const gasEstimated = await estimateGas(
            publicKey1,
            tokenAddress,
            encodedABI
        );

        const tx = {
            from: publicKey1,
            gas: gasEstimated.gasLimit,
            gasPrice: gasEstimated.gasPrice,
            to: tokenAddress,
            data: encodedABI,
        };

        const signedTx = await web3.eth.accounts.signTransaction(
            tx,
            privateKey1
        );

        await web3.eth.sendSignedTransaction(
            signedTx.raw || signedTx.rawTransaction
        );
    },
    sendERC20: async (tokenAddress, amountToSend, to) => {
        const erc20Contract = new web3.eth.Contract(erc20ABI, tokenAddress);

        const encodedABI = erc20Contract.methods
            .transfer(to, amountToSend)
            .encodeABI();

        const gasEstimated = await estimateGas(
            publicKey1,
            tokenAddress,
            encodedABI
        );

        const tx = {
            from: publicKey1,
            gas: gasEstimated.gasLimit,
            gasPrice: gasEstimated.gasPrice,
            to: tokenAddress,
            data: encodedABI,
        };

        const signedTx = await web3.eth.accounts.signTransaction(
            tx,
            privateKey1
        );

        await web3.eth.sendSignedTransaction(
            signedTx.raw || signedTx.rawTransaction
        );
    },
};

const estimateGas = async (addrFrom, contractAddr, data, value = "0") => {
    const gasLimitEstimate = await web3.eth.estimateGas({
        from: addrFrom,
        data: data,
        to: contractAddr,
        value,
    });

    const gasLimit = gasLimitEstimate;
    const gasPriceEstimate = await web3.eth.getGasPrice();
    const gasPrice = web3.utils.toBN(gasPriceEstimate).toString();

    return { gasPrice, gasLimit };
};
