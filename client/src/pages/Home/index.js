import React from "react";
import { useWeb3React } from "@web3-react/core";
import VaultTypeCard from "../../components/VaultTypeCard";
import { useAppContext } from "../../AppContext";

const Home = () => {
    const { active } = useWeb3React();
    const { userVaults } = useAppContext();

    return (
        <>
            {active &&
                userVaults.map((userVault) => {
                    return (
                        <VaultTypeCard
                            userVault={userVault}
                            key={userVault.index}
                        />
                    );
                })}
        </>
    );
};

export default Home;
