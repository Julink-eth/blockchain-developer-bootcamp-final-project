import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ButtonAction } from "./styled/Button";
import { useAppContext } from "../AppContext";
import { bigNumberify } from "ethers/utils/bignumber";
import LONG_CONTRACT_ABI from "../contracts/VaultLongMaiFinance.json";
import { ethers } from "ethers";
import { formatUnits } from "@ethersproject/units";

//NOT USED YET
const ClaimButton = () => {
    const [claimableRewards, setClaimableRewards] = useState("0");
    const [claimableVaultIndexes, setClaimableVaultIndexes] = useState([]);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const { active, chainId, account, library } = useWeb3React();
    const { userVaults } = useAppContext();

    useEffect(() => {
        let mounted = true;

        const getRewardsTotal = async () => {
            let rewardsTotal = bigNumberify("0");
            const _claimableVaultIndexes = [];
            const promises = userVaults.map(async (userVault) => {
                const vaultJson = require("../contracts/" + userVault.jsonName);
                const deployedNetwork = vaultJson.networks[chainId];
                const vaultContract = new ethers.Contract(
                    deployedNetwork.address,
                    LONG_CONTRACT_ABI.abi,
                    library.getSigner(account)
                );
                const vaultRewards = await vaultContract.claimableRewards(
                    account
                );
                rewardsTotal = rewardsTotal.add(vaultRewards);
                const claimable = await vaultContract.senderCanClaimRewards(
                    account
                );
                if (claimable) {
                    _claimableVaultIndexes.push(userVault.index);
                }
            });
            await Promise.all(promises);
            setClaimableRewards(rewardsTotal.toString());
            setClaimableVaultIndexes(_claimableVaultIndexes);
        };

        mounted && active && getRewardsTotal();

        return () => {
            mounted = false;
        };
    }, [active]);

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            if (
                claimableVaultIndexes.length === 0 ||
                claimableRewards === "0"
            ) {
                setButtonDisabled(true);
            } else {
                setButtonDisabled(false);
            }
        }

        return () => {
            mounted = false;
        };
    }, [claimableRewards, claimableVaultIndexes]);

    const claimAllRewards = async () => {
        let newClaimableVaultIndexes = claimableVaultIndexes;
        const promises = claimableVaultIndexes.map(async (vaultIndex) => {
            const vaultJson = require("../contracts/" +
                userVaults[vaultIndex].jsonName);
            const deployedNetwork = vaultJson.networks[chainId];
            const vaultContract = new ethers.Contract(
                deployedNetwork.address,
                LONG_CONTRACT_ABI.abi,
                library.getSigner(account)
            );
            await vaultContract.claimRewards();
            newClaimableVaultIndexes.shift();
        });

        await Promise.all(promises);
        setClaimableVaultIndexes(newClaimableVaultIndexes);
        setClaimableRewards("0");
    };

    return (
        <>
            {active && (
                <ButtonAction
                    onClick={() => claimAllRewards()}
                    disabled={buttonDisabled}
                >
                    Claim {formatUnits(claimableRewards, 18)} QI
                </ButtonAction>
            )}
        </>
    );
};

export default ClaimButton;
