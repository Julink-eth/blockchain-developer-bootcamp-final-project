import { useContract } from "./useContract";
import IERC20_ABI from "../contracts/IERC20.json";
import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../AppContext";
import useIsValidNetwork from "../hooks/useIsValidNetwork";
import { parseUnits } from "@ethersproject/units";

export const useERC20Contract = (userVault) => {
    const { account, chainId } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const tokenContract = useContract(userVault.tokenAddress, IERC20_ABI.abi);
    const vaultJson = require("../contracts/" + userVault.jsonName);
    const deployedNetwork = vaultJson.networks[chainId];
    const longContractAddress = deployedNetwork.address;
    const { setUserWalletCollateralAmount, setAllowance, setTxnStatus } =
        useAppContext();

    const fetchTokenBalance = async () => {
        const tokenBalance = await tokenContract.balanceOf(account);
        setUserWalletCollateralAmount(userVault.index, tokenBalance.toString());
    };

    const approve = async (amount) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await tokenContract.approve(
                    longContractAddress,
                    parseUnits(amount, userVault.decimals)
                );
                await txn.wait(1);
                fetchTokenAllowance();
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
    };
};
