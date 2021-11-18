import React from "react";
import styled from "styled-components";
import { useWeb3React } from "@web3-react/core";
import MMLogo from "../static/metamask-logo.svg";
import Text from "./styled/Text";
import { injected } from "../connectors";
import { shortenAddress } from "../utils/shortenAddress";
import { ButtonAction, ButtonAlert } from "./styled/Button";

const MetamaskLogo = styled.img.attrs({
    src: MMLogo,
})`
    height: 40px;
`;

const MetamaskConnectButton = () => {
    const { activate, active, account, deactivate } = useWeb3React();

    if (active) {
        return (
            <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                <ButtonAlert onClick={deactivate}>Log Out</ButtonAlert>
                <Text
                    uppercase
                    color="green"
                    t3
                    lineHeight="40px"
                    className="mx-4"
                >
                    {shortenAddress(account)}
                </Text>
                <MetamaskLogo />
            </div>
        );
    }

    return (
        <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <ButtonAction onClick={() => activate(injected)}>
                Connect
            </ButtonAction>
            <Text uppercase color="green" t3 lineHeight="40px" className="mx-2">
                Metamask
            </Text>
            <MetamaskLogo />
        </div>
    );
};

export default MetamaskConnectButton;
