import React from "react";

import { ethers } from "ethers";
import { Web3ReactProvider } from "@web3-react/core";
import { Route } from "react-router-dom";
import { AppContextProvider } from "./AppContext";
import Home from "./pages/Home";
import TransactionNotification from "./components/TransactionNotification";
import Header from "./components/Header";

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
                        rowGap: 30,
                        flexDirection: "column",
                        alignItems: "center",
                        margin: -8,
                    }}
                >
                    <TransactionNotification />
                    <Header />
                    <div
                        style={{
                            maxWidth: 900,
                            width: "100%",
                        }}
                    >
                        <Route path="/" component={Home} />
                    </div>
                </div>
            </Web3ReactProvider>
        </AppContextProvider>
    );
};

export default App;
