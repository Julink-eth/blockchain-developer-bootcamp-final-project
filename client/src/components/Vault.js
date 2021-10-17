import React from "react";
import styled from "styled-components";
import Button from "react-bootstrap/Button";
import { useWeb3React } from "@web3-react/core";
import Card from "./Card";
import { ethers } from "ethers";
import VaultLongMaiFinance from "../contracts/VaultLongMaiFinance.json";
import { useAppContext } from "../AppContext";

const CreateVaultButton = styled(Button).attrs({ variant: "outline-dark" })``;

//This component is ovbsiouly far from finished I only wanted to showcase the interaction with my contract
//Will only work on a chain forking polygon mainnet since it uses Mai Finance contract on polygon
const Vault = () => {
    const { library, chainId } = useWeb3React();
    const { setUserVaults, userVaults } = useAppContext();

    const createVault = async () => {
        try {
            const deployedNetwork = VaultLongMaiFinance.networks[chainId];
            const instance = new ethers.Contract(
                deployedNetwork.address,
                VaultLongMaiFinance.abi,
                library.getSigner()
            );

            const result = await instance.createVault(
                userVaults.link.vaultAddr
            );
            const { events } = await result.wait();
            let iface = new ethers.utils.Interface(VaultLongMaiFinance.abi);
            let logs = events.map((event) => iface.parseLog(event));
            const log = logs.find(
                (log) => log !== null && log.name === "VaultCreated"
            );
            console.log("log", log);
            const newVaultId = log.values.vaultId.toString();
            const newVaultids = userVaults.link.vaultIds;
            newVaultids.push(newVaultId);
            setUserVaults("link", newVaultids);
            alert("Vault " + newVaultId + " created!");
        } catch (error) {
            alert(
                "En error occured while getting your vaults, check console for details."
            );
            console.error(error);
        }
    };

    return (
        <Card style={{ width: 350 }}>
            <CreateVaultButton
                onClick={() => {
                    createVault();
                }}
            >
                Create Vault
            </CreateVaultButton>
        </Card>
    );
};

export default Vault;
