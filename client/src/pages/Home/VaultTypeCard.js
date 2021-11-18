import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { ButtonAction, ButtonCommon } from "../../components/styled/Button";
import Text from "../../components/styled/Text";
import { useWeb3React } from "@web3-react/core";
import UserVault from "./UserVault";
import { useERC20Contract } from "../../hooks/useERC20Contract";
import { useLongContract } from "../../hooks/useLongContract";
import { formatUnits } from "@ethersproject/units";
import ExpandableCard from "../../components/ExpandableCard";

const VaultTypeCard = ({ userVault }) => {
    const { active } = useWeb3React();
    const {
        fetchTokenBalance,
        fetchTokenAllowance,
        fetchMaiBalance,
        fetchMaiUserAllowance,
    } = useERC20Contract(userVault);
    const {
        fetchVaultIds,
        createVault,
        fetchMaxMultiplicator,
        fetchMinimumCollateralPercentage,
    } = useLongContract(userVault);
    const handleCreateVault = (event) => {
        event.stopPropagation();
        createVault();
    };

    const [vaultIdSelected, setVaultIdSelected] = useState(undefined);

    useEffect(() => {
        let mounted = true;
        const refrechInfo = () => {
            fetchTokenBalance();
            fetchVaultIds();
            fetchTokenAllowance();
            fetchMaxMultiplicator();
            fetchMinimumCollateralPercentage();
            fetchMaiBalance();
            fetchMaiUserAllowance();
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
        <>
            <ExpandableCard
                contentStyle={{ paddingTop: 0 }}
                headerContent={
                    <div
                        style={{
                            width: "100%",
                            justifyContent: "space-between",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <Text>{userVault.label}</Text>
                        <ButtonAction
                            onClick={(event) => handleCreateVault(event)}
                        >
                            Create new vault
                        </ButtonAction>
                    </div>
                }
            >
                <Text>
                    Your {userVault.label} balance :
                    {userVault.userWalletAmount &&
                        formatUnits(
                            userVault.userWalletAmount,
                            userVault.decimals
                        )}
                </Text>
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
                                Vault #{vaultId}
                            </ButtonCommon>
                        );
                    })}
                </div>

                {vaultIdSelected && (
                    <UserVault
                        userVault={userVault}
                        vaultId={vaultIdSelected}
                        style={{ marginTop: 20 }}
                    />
                )}
            </ExpandableCard>
        </>
    );
};

export default VaultTypeCard;
