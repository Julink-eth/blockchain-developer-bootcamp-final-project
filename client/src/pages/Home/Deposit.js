import React, { useEffect, useState } from "react";
import { useLongContract } from "../../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import Text from "../../components/styled/Text";
import { getLiquidationPrice, isNumberAccepted } from "../../utils/utils";
import { formatUnits, parseUnits } from "@ethersproject/units";
import InputWithMax from "../../components/InputWithMax";
import { useERC20Contract } from "../../hooks/useERC20Contract";
import { ButtonAction } from "../../components/styled/Button";

const Deposit = ({ userVault, vaultId, style }) => {
    const [amount, setAmount] = useState("0");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [liquidationPriceEstimate, setLiquidationPriceEstimate] =
        useState("");
    const [actionButton, setActionButton] = useState("APPROVE");
    const { deposit } = useLongContract(userVault);
    const { approve } = useERC20Contract(userVault);
    const handleDepositClick = () => {
        deposit(vaultId, amount);
    };
    const handleApproveClick = () => {
        approve(amount);
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            if (
                amount !== "" &&
                amount !== "0" &&
                userVault.userWalletAmount !== "0"
            ) {
                setButtonDisabled(false);
            } else {
                setButtonDisabled(true);
            }
        }
        return () => {
            mounted = false;
        };
    }, [amount, userVault.userWalletAmount]);

    useEffect(() => {
        let mounted = true;
        const onAllowanceChange = (allowance) => {
            const amountToUseBN = bigNumberify(amount);
            const allowanceBN = bigNumberify(allowance);
            if (allowanceBN.lt(amountToUseBN)) {
                setActionButton("APPROVE");
            } else {
                setActionButton("DEPOSIT");
            }
        };
        mounted && onAllowanceChange(userVault.allowance);
        return () => {
            mounted = false;
        };
    }, [userVault.allowance, amount]);

    const handleOnInputChange = async (_amount) => {
        if (_amount !== "" && isNumberAccepted(_amount)) {
            const amountBN = bigNumberify(
                parseUnits(_amount, userVault.decimals)
            );
            if (amountBN.lte(userVault.userWalletAmount) && amountBN.gt(0)) {
                setAmount(amountBN.toString());
                getLiquiditionPriceEstimate(amountBN.toString());
            } else {
                setAmount("0");
            }
        } else {
            setAmount("0");
        }
    };

    const getLiquiditionPriceEstimate = async (amount) => {
        const newCollateral = bigNumberify(
            userVault.vaults[vaultId].maiDeposit
        ).add(amount);

        const result = getLiquidationPrice(
            userVault.vaults[vaultId].debt,
            newCollateral.toString(),
            userVault.minCollateralPercentage
        );
        setLiquidationPriceEstimate(result);
    };

    return (
        <div style={style}>
            <div
                style={{
                    display: "flex",
                    rowGap: 10,
                    flexDirection: "column",
                }}
            >
                <Text>Amount of collateral to add :</Text>
                <InputWithMax
                    onChange={handleOnInputChange}
                    typeInput="number"
                    maxValue={formatUnits(
                        userVault.userWalletAmount,
                        userVault.decimals
                    )}
                />

                {actionButton === "DEPOSIT" && (
                    <ButtonAction
                        disabled={buttonDisabled}
                        onClick={handleDepositClick}
                    >
                        Deposit {formatUnits(amount, userVault.decimals)}{" "}
                        {userVault.label}
                    </ButtonAction>
                )}

                {actionButton === "APPROVE" && (
                    <ButtonAction
                        disabled={buttonDisabled}
                        onClick={handleApproveClick}
                    >
                        Approve
                    </ButtonAction>
                )}
                {!buttonDisabled && (
                    <Text>
                        Estimated liquidation price : {liquidationPriceEstimate}
                    </Text>
                )}
            </div>
        </div>
    );
};

export default Deposit;
