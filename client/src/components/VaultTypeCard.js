import React from "react";
import Card from "./Card";
import { ButtonAction, ButtonCommon } from "./styled/Button";
import Text from "./styled/Text";
import { useWeb3React } from "@web3-react/core";
import UserVault from "./UserVault";
import { useState } from "react";
import { useEffect } from "react";
import { useERC20Contract } from "../hooks/useERC20Contract";
import { useLongContract } from "../hooks/useLongContract";
import { formatUnits } from "@ethersproject/units";

const VaultTypeCard = ({ userVault }) => {
    const { active } = useWeb3React();
    const { fetchTokenBalance, fetchTokenAllowance } =
        useERC20Contract(userVault);
    const { fetchVaultIds, createVault } = useLongContract(userVault);
    const handleCreateVault = () => createVault();

    const [vaultIdSelected, setVaultIdSelected] = useState(undefined);

    useEffect(() => {
        let mounted = true;
        const refrechInfo = () => {
            fetchTokenBalance();
            fetchVaultIds();
            fetchTokenAllowance();
        };
        mounted && active && refrechInfo();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const selectVault = (vaultId) => {
        setVaultIdSelected(vaultId);
    };

    return (
        <Card>
            <Text>{userVault.label}</Text>
            <ButtonAction onClick={() => handleCreateVault()}>
                Create new vault
            </ButtonAction>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "20px",
                }}
            >
                {userVault.vaultIds.map((vaultId) => {
                    return (
                        <ButtonCommon
                            onClick={() => selectVault(vaultId)}
                            key={vaultId}
                        >
                            #{vaultId}
                        </ButtonCommon>
                    );
                })}
            </div>
            <Text>
                User balance :
                {userVault.userWalletAmount &&
                    formatUnits(userVault.userWalletAmount, userVault.decimals)}
            </Text>
            {vaultIdSelected && (
                <UserVault
                    userVault={userVault}
                    vaultId={vaultIdSelected}
                    style={{ marginTop: 20 }}
                />
            )}
        </Card>
    );
};

export default VaultTypeCard;
