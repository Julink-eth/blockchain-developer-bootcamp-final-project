import React from "react";

import { ethers } from "ethers";
import { Web3ReactProvider } from "@web3-react/core";
import Vault from "./components/Vault";
import UserVaults from "./components/UserVaults";
import MetamaskConnectButton from "./components/MetamaskConnectButton";
import { AppContextProvider } from "./AppContext";

function getLibrary(provider) {
    return new ethers.providers.Web3Provider(provider);
}

const App = () => {
    return (
        <AppContextProvider>
            <Web3ReactProvider getLibrary={getLibrary}>
                <div
                    style={{
                        display: "flex",
                        height: 500,
                        rowGap: 40,
                        flexDirection: "column",
                        minHeight: 100,
                    }}
                >
                    <MetamaskConnectButton />
                    <Vault />
                    <UserVaults />
                </div>
            </Web3ReactProvider>
        </AppContextProvider>
    );
};

export default App;
