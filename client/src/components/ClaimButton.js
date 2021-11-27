import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ButtonAction } from "./styled/Button";
import { useAppContext } from "../AppContext";
import HELPER_ADMIN from "../contracts/HelperAdmin.json";
import { ethers } from "ethers";
import { formatUnits } from "@ethersproject/units";

const ClaimButton = () => {
    const [claimableRewards, setClaimableRewards] = useState("0");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const { active, chainId, account, library } = useWeb3React();
    const { userVaults } = useAppContext();

    useEffect(() => {
        let mounted = true;

        const getRewardsTotal = async () => {
            const vaultAddresses = getVaultAddresses();
            const deployedNetwork = HELPER_ADMIN.networks[chainId];
            const helperContract = new ethers.Contract(
                deployedNetwork.address,
                HELPER_ADMIN.abi,
                library.getSigner(account)
            );
            const rewardsTotal = await helperContract.claimableRewards(
                vaultAddresses
            );

            setClaimableRewards(rewardsTotal.toString());
        };

        mounted && active && getRewardsTotal();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            if (claimableRewards === "0") {
                setButtonDisabled(true);
            } else {
                setButtonDisabled(false);
            }
        }

        return () => {
            mounted = false;
        };
    }, [claimableRewards]);

    const getVaultAddresses = () => {
        const vaultAddresses = userVaults.map((userVault) => {
            const vaultJson = require("../contracts/" + userVault.jsonName);
            const deployedNetwork = vaultJson.networks[chainId];
            return deployedNetwork.address;
        });

        return vaultAddresses;
    };

    const claimAllRewards = async () => {
        const vaultAddresses = getVaultAddresses();
        const deployedNetwork = HELPER_ADMIN.networks[chainId];
        const helperContract = new ethers.Contract(
            deployedNetwork.address,
            HELPER_ADMIN.abi,
            library.getSigner(account)
        );
        await helperContract.claimRewards(vaultAddresses);

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
