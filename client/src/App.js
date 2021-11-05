import React from "react";

import { ethers } from "ethers";
import { Web3ReactProvider } from "@web3-react/core";
import { Route } from "react-router-dom";
import MetamaskConnectButton from "./components/MetamaskConnectButton";
import { AppContextProvider } from "./AppContext";
import Home from "./pages/Home";

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
                        rowGap: 40,
                        flexDirection: "column",
                    }}
                >
                    <MetamaskConnectButton />
                    <Route exact path="/" component={Home} />
                </div>
            </Web3ReactProvider>
        </AppContextProvider>
    );
};

export default App;
