import { useContract } from "./useContract";
import IERC20_ABI from "../contracts/IERC20.json";
import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../AppContext";
import useIsValidNetwork from "../hooks/useIsValidNetwork";
import tokenAddresses from "../constants/tokenAddresses.json";
import { getConfirmationsCount } from "../utils/utils";

export const useERC20Contract = (
    userVault,
    tokenAddress = userVault.tokenAddress
) => {
    const { account, chainId } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const tokenContract = useContract(tokenAddress, IERC20_ABI.abi);
    const maiContract = useContract(tokenAddresses.MAI, IERC20_ABI.abi);
    const vaultJson = require("../contracts/" + userVault.jsonName);
    const deployedNetwork = vaultJson.networks[chainId];
    const longContractAddress = deployedNetwork.address;
    const {
        setUserWalletCollateralAmount,
        setAllowance,
        setTxnStatus,
        setMaiBalance,
        setMaiAllowance,
    } = useAppContext();

    const fetchTokenBalance = async () => {
        const tokenBalance = await tokenContract.balanceOf(account);
        setUserWalletCollateralAmount(userVault.index, tokenBalance.toString());
    };

    const fetchMaiBalance = async () => {
        const tokenBalance = await maiContract.balanceOf(account);
        setMaiBalance(tokenBalance.toString());
    };

    const fetchMaiUserAllowance = async () => {
        const tokenAllowance = await maiContract.allowance(
            account,
            longContractAddress
        );
        setMaiAllowance(tokenAllowance.toString());
    };

    const approve = async (amount) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await tokenContract.approve(
                    longContractAddress,
                    amount
                );
                await txn.wait(getConfirmationsCount(chainId));
                if (tokenAddress === tokenAddresses.MAI) {
                    fetchMaiUserAllowance();
                } else {
                    fetchTokenAllowance();
                }
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const fetchTokenAllowance = async () => {
        const tokenAllowance = await tokenContract.allowance(
            account,
            longContractAddress
        );
        setAllowance(userVault.index, tokenAllowance.toString());
    };

    return {
        fetchTokenBalance,
        fetchTokenAllowance,
        approve,
        fetchMaiBalance,
        fetchMaiUserAllowance,
    };
};
