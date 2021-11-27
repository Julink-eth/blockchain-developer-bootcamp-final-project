import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import MMLogo from "../static/metamask-logo.svg";
import Text from "./styled/Text";
import { injected } from "../connectors";
import { shortenAddress } from "../utils/utils";
import { ButtonAction, ButtonAlert } from "./styled/Button";
import { useAppContext } from "../AppContext";

const MetamaskLogo = styled.img.attrs({
    src: MMLogo,
})`
    height: 40px;
`;

const pageState = {
    LOADING: "LOADING",
    READY: "READY",
};

const MetamaskConnectButton = () => {
    const { setContentError } = useAppContext();
    const { activate, active, account, deactivate } = useWeb3React();
    const [status, setStatus] = useState(pageState.LOADING);

    useEffect(() => {
        let mounted = true;
        const tryActivate = async () => {
            await activate(injected, () => {
                setStatus(pageState.READY);
            });
            setStatus(pageState.READY);
        };
        mounted && tryActivate();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === pageState.READY && !active) {
        return (
            <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                <ButtonAction
                    onClick={() => {
                        if (!window.ethereum) {
                            setContentError(
                                "Looks like you don't have Metamask, you'll need it to use this app."
                            );
                            return;
                        }
                        activate(injected, (e) => {
                            if (e instanceof UnsupportedChainIdError) {
                                setContentError(
                                    "Only Polygon mainnet is supported."
                                );
                            }
                        });
                    }}
                >
                    Connect
                </ButtonAction>
                <Text
                    uppercase
                    color="green"
                    t3
                    lineHeight="40px"
                    className="mx-2"
                >
                    Metamask
                </Text>
                <MetamaskLogo />
            </div>
        );
    }

    return (
        <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <ButtonAlert onClick={deactivate}>
                {active ? "Log Out" : "Not Connected"}
            </ButtonAlert>
            <Text uppercase color="green" t3 lineHeight="40px" className="mx-4">
                {shortenAddress(account)}
            </Text>
            <MetamaskLogo />
        </div>
    );
};

export default MetamaskConnectButton;
