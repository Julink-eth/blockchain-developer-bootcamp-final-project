import React from "react";
import Text from "./styled/Text";
import Card from "./styled/Card";
import MetamaskConnectButton from "./MetamaskConnectButton";
import ClaimButton from "./ClaimButton";

const Header = () => {
    return (
        <>
            <Card
                style={{
                    justifyContent: "space-between",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Text t3>Mai Finance Helper</Text>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 10,
                    }}
                >
                    <ClaimButton />
                    <MetamaskConnectButton />
                </div>
            </Card>
        </>
    );
};

export default Header;
