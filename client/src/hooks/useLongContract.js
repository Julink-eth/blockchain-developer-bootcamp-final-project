import { useContract } from "./useContract";
import IERC20_STABLECOIN_ABI from "../contracts/IERC20StableCoin.json";
import useIsValidNetwork from "../hooks/useIsValidNetwork";
import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../AppContext";
import { getConfirmationsCount, getLiquidationPrice } from "../utils/utils";
import { useERC20Contract } from "./useERC20Contract";

export const useLongContract = (userVault) => {
    const { account, chainId } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const { fetchTokenAllowance, fetchTokenBalance, fetchMaiBalance } =
        useERC20Contract(userVault);
    const vaultJson = require("../contracts/" + userVault.jsonName);
    const deployedNetwork = vaultJson.networks[chainId];
    const longContract = useContract(deployedNetwork.address, vaultJson.abi);
    const maiContract = useContract(
        userVault.maiVaultAddress,
        IERC20_STABLECOIN_ABI.abi
    );

    const {
        setTxnStatus,
        setVaultIds,
        setVault,
        setMultiplicatorMax,
        setMinCollateralPercentage,
    } = useAppContext();

    const createVault = async () => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.createVault();
                await txn.wait(getConfirmationsCount(chainId));
                await fetchVaultIds();
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const fetchVaultIds = async () => {
        const results = await longContract.getUserVaultList();
        const vaultIds = results.map((result) => {
            return result.toString();
        });
        setVaultIds(userVault.index, vaultIds);
    };

    const fetchVault = async (vaultId) => {
        const maiDeposit = await maiContract.vaultCollateral(vaultId);
        const debt = await maiContract.vaultDebt(vaultId);
        let liquidationPriceStr = getLiquidationPrice(
            debt,
            maiDeposit,
            userVault.minCollateralPercentage
        );
        const maxWithdrawableAmount =
            await longContract.getMaxWithdrawableCollateral(vaultId);

        setVault(userVault.index, vaultId, {
            maiDeposit: maiDeposit.toString(),
            debt: debt.toString(),
            liquidationPrice: liquidationPriceStr,
            maxWithdrawableAmount: maxWithdrawableAmount.toString(),
        });
    };

    const fetchMaxMultiplicator = async () => {
        const result = await longContract.getMultiplicatorMax100th();
        const resultFloat = parseFloat(result.toString());
        setMultiplicatorMax(userVault.index, resultFloat / 100);
    };

    const fetchMinimumCollateralPercentage = async () => {
        const result = await longContract.getMinimumCollateralPercentage();
        setMinCollateralPercentage(userVault.index, result);
    };

    const fetchDebtForAmount = async (amount) => {
        const result = await longContract.getMAIDebtForAmount(amount);
        return result.toString();
    };

    const fetchAmountMin = async (tokanIn, tokenOut, amountOut) => {
        const result = await longContract.getAmountInMin(
            tokanIn,
            tokenOut,
            amountOut
        );
        return result.toString();
    };

    const fetchMaxWithdrawableCollateral = async (vaultId) => {
        const result = await longContract.getMaxWithdrawableCollateral(vaultId);
        return result.toString();
    };

    const long = async (vaultId, amount, collateralAmountToUse) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.longAsset(
                    vaultId,
                    amount,
                    collateralAmountToUse
                );
                await txn.wait(getConfirmationsCount(chainId));
                fetchVault(vaultId);
                fetchTokenBalance();
                fetchTokenAllowance();
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const reduce = async (vaultId, debtToRepay) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.reduceLong(vaultId, debtToRepay);
                await txn.wait(getConfirmationsCount(chainId));
                fetchVault(vaultId);
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const withdraw = async (vaultId, amount) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.withdrawCollateral(
                    vaultId,
                    amount
                );
                await txn.wait(getConfirmationsCount(chainId));
                fetchVault(vaultId);
                fetchTokenBalance();
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const deposit = async (vaultId, amount) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.deposit(vaultId, amount);
                await txn.wait(getConfirmationsCount(chainId));
                fetchVault(vaultId);
                fetchTokenBalance();
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    const repay = async (vaultId, amount) => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.repay(vaultId, amount);
                await txn.wait(getConfirmationsCount(chainId));
                fetchVault(vaultId);
                fetchTokenBalance();
                fetchMaiBalance();
                setTxnStatus("COMPLETE");
            } catch (error) {
                console.error(error);
                setTxnStatus("ERROR");
            }
        }
    };

    return {
        createVault,
        fetchVaultIds,
        fetchVault,
        fetchMaxMultiplicator,
        long,
        fetchMinimumCollateralPercentage,
        fetchDebtForAmount,
        reduce,
        fetchAmountMin,
        fetchMaxWithdrawableCollateral,
        withdraw,
        deposit,
        repay,
    };
};
