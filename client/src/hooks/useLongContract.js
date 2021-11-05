import { useContract } from "./useContract";
import LONG_CONTRACT_ABI from "../contracts/VaultLongMaiFinance.json";
import IERC20_STABLECOIN_ABI from "../contracts/IERC20StableCoin.json";
import useIsValidNetwork from "../hooks/useIsValidNetwork";
import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../AppContext";
import { parseUnits } from "@ethersproject/units";
import { useERC20Contract } from "./useERC20Contract";

export const useLongContract = (userVault) => {
    const { account, chainId } = useWeb3React();
    const { isValidNetwork } = useIsValidNetwork();
    const { fetchTokenBalance } = useERC20Contract(userVault);
    const vaultJson = require("../contracts/" + userVault.jsonName);
    const deployedNetwork = vaultJson.networks[chainId];
    const longContract = useContract(
        deployedNetwork.address,
        LONG_CONTRACT_ABI.abi
    );
    const maiContract = useContract(
        userVault.maiVaultAddress,
        IERC20_STABLECOIN_ABI.abi
    );

    const { setTxnStatus, setVaultIds, setVault } = useAppContext();

    const createVault = async () => {
        if (account && isValidNetwork) {
            try {
                setTxnStatus("LOADING");
                const txn = await longContract.createVault();
                await txn.wait(1);
                await fetchVaultIds();
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
                const txn = await longContract.depositCollateral(
                    vaultId,
                    parseUnits(amount, userVault.decimals)
                );
                await txn.wait(1);
                fetchTokenBalance();
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
        const userDeposit = await longContract.getUserDeposit(account, vaultId);
        const maiDeposit = await maiContract.methods
            .vaultCollateral(vaultId)
            .call();
        setVault(userVault.index, vaultId, {
            deposit: userDeposit.toString(),
            maiDeposit: maiDeposit.toString(),
        });
    };

    return {
        createVault,
        deposit,
        fetchVaultIds,
        fetchVault,
    };
};
