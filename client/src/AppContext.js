import React, { createContext, useReducer } from "react";

const initialContext = {
    isWalletConnectionModalOpen: false,
    setWalletConnectModal: () => {},
    txnStatus: "NOT_SUBMITTED",
    setTxnStatus: () => {},
    userVaults: {
        link: {
            vaultAddr: "0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72",
            vaultIds: [],
        },
    },
    setUserVaults: () => {},
};

const appReducer = (state, { type, payload }) => {
    switch (type) {
        case "SET_WALLET_MODAL":
            return {
                ...state,
                isWalletConnectModalOpen: payload,
            };

        case "SET_TXN_STATUS":
            return {
                ...state,
                txnStatus: payload,
            };
        case "SET_USER_VAULTS_IDS":
            return {
                ...state,
                [payload.vaultName]: {
                    ...state[payload.vaultName],
                    vaultIds: payload.vautlIds,
                },
            };
        default:
            return state;
    }
};

const AppContext = createContext(initialContext);
export const useAppContext = () => React.useContext(AppContext);
export const AppContextProvider = ({ children }) => {
    const [store, dispatch] = useReducer(appReducer, initialContext);

    const contextValue = {
        isWalletConnectModalOpen: store.isWalletConnectModalOpen,
        setWalletConnectModal: (open) => {
            dispatch({ type: "SET_WALLET_MODAL", payload: open });
        },
        txnStatus: store.txnStatus,
        setTxnStatus: (status) => {
            dispatch({ type: "SET_TXN_STATUS", payload: status });
        },
        userVaults: store.userVaults,
        setUserVaults: (vaultName, vaultIds) => {
            dispatch({
                type: "SET_USER_VAULTS_IDS",
                payload: { vaultName, vaultIds },
            });
        },
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
