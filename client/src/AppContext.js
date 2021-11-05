import React, { createContext, useReducer } from "react";
import update from "immutability-helper";
import vaultsInfo from "./constants/vaultsInfo.json";

const initialContext = {
    isWalletConnectionModalOpen: false,
    setWalletConnectModal: () => {},
    txnStatus: "NOT_SUBMITTED",
    setTxnStatus: () => {},
    userVaults: vaultsInfo.vaultTypes,
    setVaultIds: () => {},
    addVaultId: () => {},
    setUserWalletCollateralAmount: () => {},
    setAllowance: () => {},
    setVault: () => {},
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
            return update(state, {
                userVaults: {
                    [payload.indexVaultType]: {
                        vaultIds: { $set: payload.vaultIds },
                    },
                },
            });
        case "ADD_USER_VAULT_ID":
            return update(state, {
                userVaults: {
                    [payload.indexVaultType]: {
                        vaultIds: { $push: payload.vaultId },
                    },
                },
            });
        case "SET_USER_WALLET_COLLATERAL_AMOUNT":
            return update(state, {
                userVaults: {
                    [payload.indexVaultType]: {
                        userWalletAmount: { $set: payload.amount },
                    },
                },
            });
        case "SET_ALLOWANCE":
            return update(state, {
                userVaults: {
                    [payload.indexVaultType]: {
                        allowance: { $set: payload.amount },
                    },
                },
            });
        case "SET_VAULT":
            return update(state, {
                userVaults: {
                    [payload.indexVaultType]: {
                        vaults: {
                            [payload.vaultId]: { $set: payload.vault },
                        },
                    },
                },
            });
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
        setVaultIds: (indexVaultType, vaultIds) => {
            dispatch({
                type: "SET_USER_VAULTS_IDS",
                payload: { indexVaultType, vaultIds },
            });
        },
        addVaultId: (indexVaultType, vaultId) => {
            dispatch({
                type: "ADD_USER_VAULT_ID",
                payload: { indexVaultType, vaultId },
            });
        },
        setUserWalletCollateralAmount: (indexVaultType, amount) => {
            dispatch({
                type: "SET_USER_WALLET_COLLATERAL_AMOUNT",
                payload: { indexVaultType, amount },
            });
        },
        setAllowance: (indexVaultType, amount) => {
            dispatch({
                type: "SET_ALLOWANCE",
                payload: { indexVaultType, amount },
            });
        },
        setVault: (indexVaultType, vaultId, vault) => {
            dispatch({
                type: "SET_VAULT",
                payload: { indexVaultType, vaultId, vault },
            });
        },
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
