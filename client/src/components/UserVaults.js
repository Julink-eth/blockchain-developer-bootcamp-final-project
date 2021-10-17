import React, { useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import Text from "./Text";
import Card from "./Card";
import { ethers } from "ethers";
import VaultLongMaiFinance from "../contracts/VaultLongMaiFinance.json";
import { useAppContext } from "../AppContext";

//This component is ovbsiouly far from finished I only wanted to showcase the interaction with my contract
//Will only work on a chain forking polygon mainnet since it uses Mai Finance contract on polygon
const UserVaults = () => {
    const { library, active, chainId } = useWeb3React();
    const { userVaults, setUserVaults } = useAppContext();

    useEffect(() => {
        let mounted = true;
        const getUserVaults = async () => {
            const deployedNetwork = VaultLongMaiFinance.networks[chainId];
            const instance = new ethers.Contract(
                deployedNetwork.address,
                VaultLongMaiFinance.abi,
                library.getSigner()
            );

            const results = await instance.getUserVaultList(
                userVaults.link.vaultAddr
            );
            let newVaultIds = userVaults.link.vaultIds;
            newVaultIds.length = 0;
            newVaultIds = results.map((result) => {
                newVaultIds.push(result.toString());
            });

            setUserVaults("link", newVaultIds);
        };

        try {
            mounted && active && getUserVaults();
            if (!active) {
                let newVaultIds = userVaults.link.vaultIds;
                newVaultIds.length = 0;
                setUserVaults("link", newVaultIds);
            }
        } catch (error) {
            alert(
                "En error occured while getting your vaults, check console for details."
            );
            console.error(error);
        }

        return () => {
            mounted = false;
        };
    }, [active]);

    const displayUserVaults = () => {
        return userVaults.link.vaultIds.map((vaultId) => {
            return vaultId.toString() + "\t";
        });
    };

    return (
        <Card style={{ width: 350 }}>
            <>
                <Text>User vault Ids : {displayUserVaults()}</Text>
            </>
        </Card>
    );
};

export default UserVaults;
