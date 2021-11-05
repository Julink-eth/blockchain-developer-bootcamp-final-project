import React, { useEffect } from "react";
import Text from "./styled/Text";
import DepositApprove from "./DepositApprove";
import { useLongContract } from "../hooks/useLongContract";
import { formatUnits } from "@ethersproject/units";

const UserVault = ({ userVault, vaultId, style }) => {
    const { fetchVault } = useLongContract(userVault);

    useEffect(() => {
        let mounted = true;
        const refrechInfo = () => {
            fetchVault(vaultId);
        };
        mounted && refrechInfo();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vaultId]);

    return (
        <div style={style}>
            <div
                style={{
                    display: "flex",
                    rowGap: 10,
                    flexDirection: "column",
                }}
            >
                <Text>Vault ID : #{vaultId}</Text>
                <Text>
                    User deposit :
                    {userVault.vaults[vaultId] &&
                        formatUnits(
                            userVault.vaults[vaultId].deposit,
                            userVault.decimals
                        )}
                </Text>
                <Text>
                    User deposit in Mai finance :
                    {userVault.vaults[vaultId] &&
                        formatUnits(
                            userVault.vaults[vaultId].maiDeposit,
                            userVault.decimals
                        )}
                </Text>
                <DepositApprove userVault={userVault} vaultId={vaultId} />
            </div>
        </div>
    );
};

export default UserVault;
