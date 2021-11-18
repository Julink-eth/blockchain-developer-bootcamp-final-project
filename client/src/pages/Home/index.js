import React from "react";
import { useWeb3React } from "@web3-react/core";
import VaultTypeCard from "./VaultTypeCard";
import { useAppContext } from "../../AppContext";

const Home = () => {
    const { active } = useWeb3React();
    const { userVaults } = useAppContext();

    return (
        <div
            style={{
                display: "flex",
                rowGap: 30,
                flexDirection: "column",
            }}
        >
            {active &&
                userVaults.map((userVault) => {
                    return (
                        <VaultTypeCard
                            userVault={userVault}
                            key={userVault.index}
                        />
                    );
                })}
        </div>
    );
};

export default Home;
