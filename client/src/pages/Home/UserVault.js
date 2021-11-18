import React, { useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import Text from "../../components/styled/Text";
import { useLongContract } from "../../hooks/useLongContract";
import { formatUnits } from "@ethersproject/units";
import Long from "./Long";
import Reduce from "./Reduce";
import Withdraw from "./Withdraw";
import Deposit from "./Deposit";
import Repay from "./Repay";

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
                    rowGap: 15,
                    flexDirection: "column",
                }}
            >
                <Text>Vault ID : #{vaultId}</Text>
                {userVault.vaults[vaultId] && (
                    <>
                        <Text>
                            Collateral deposited :
                            {formatUnits(
                                userVault.vaults[vaultId].maiDeposit,
                                userVault.decimals
                            )}{" "}
                            {userVault.label}
                        </Text>
                        <Text>
                            Debt amount :
                            {formatUnits(
                                userVault.vaults[vaultId].debt,
                                userVault.decimals
                            )}{" "}
                            MAI
                        </Text>
                        {userVault.vaults[vaultId].liquidationPrice && (
                            <Text>
                                Liquidation Price :
                                {userVault.vaults[vaultId].liquidationPrice} USD
                            </Text>
                        )}
                    </>
                )}

                {userVault.vaults[vaultId] && (
                    <Tabs>
                        <TabList style={{ borderBottom: 0, marginBottom: 20 }}>
                            <Tab>
                                <Text>Long</Text>
                            </Tab>
                            <Tab>
                                <Text>Reduce</Text>
                            </Tab>
                            <Tab>
                                <Text>Deposit collateral</Text>
                            </Tab>
                            <Tab>
                                <Text>Repay debt</Text>
                            </Tab>
                            <Tab>
                                <Text>Withdraw</Text>
                            </Tab>
                        </TabList>

                        <TabPanel>
                            <Long userVault={userVault} vaultId={vaultId} />
                        </TabPanel>
                        <TabPanel>
                            <Reduce userVault={userVault} vaultId={vaultId} />
                        </TabPanel>
                        <TabPanel>
                            <Deposit userVault={userVault} vaultId={vaultId} />
                        </TabPanel>
                        <TabPanel>
                            <Repay userVault={userVault} vaultId={vaultId} />
                        </TabPanel>
                        <TabPanel>
                            <Withdraw userVault={userVault} vaultId={vaultId} />
                        </TabPanel>
                    </Tabs>
                )}
            </div>
        </div>
    );
};

export default UserVault;
