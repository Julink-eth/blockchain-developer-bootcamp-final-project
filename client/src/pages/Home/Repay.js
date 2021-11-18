import React, { useEffect, useState } from "react";
import { useLongContract } from "../../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import Text from "../../components/styled/Text";
import { getLiquidationPrice, isNumberAccepted } from "../../utils/utils";
import { formatUnits, parseUnits } from "@ethersproject/units";
import InputWithMax from "../../components/InputWithMax";
import { useERC20Contract } from "../../hooks/useERC20Contract";
import { ButtonAction } from "../../components/styled/Button";
import tokenAddresses from "../../constants/tokenAddresses.json";
import { useAppContext } from "../../AppContext";

const Repay = ({ userVault, vaultId, style }) => {
    const [amount, setAmount] = useState("0");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [liquidationPriceEstimate, setLiquidationPriceEstimate] =
        useState("");
    const [actionButton, setActionButton] = useState("APPROVE");
    const { maiBalance, maiAllowance } = useAppContext();
    const { repay } = useLongContract(userVault);
    const { approve } = useERC20Contract(userVault, tokenAddresses.MAI);
    const handleRepayClick = () => {
        repay(vaultId, amount);
    };
    const handleApproveClick = () => {
        approve(amount);
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            if (amount !== "" && amount !== "0" && maiBalance !== "0") {
                setButtonDisabled(false);
            } else {
                setButtonDisabled(true);
            }
        }
        return () => {
            mounted = false;
        };
    }, [amount, maiBalance]);

    useEffect(() => {
        let mounted = true;
        const onAllowanceChange = (allowance) => {
            const amountToUseBN = bigNumberify(amount);
            const allowanceBN = bigNumberify(allowance);
            if (allowanceBN.lt(amountToUseBN)) {
                setActionButton("APPROVE");
            } else {
                setActionButton("REPAY");
            }
        };
        mounted && onAllowanceChange(maiAllowance);
        return () => {
            mounted = false;
        };
    }, [maiAllowance, amount]);

    const handleOnInputChange = async (_amount) => {
        if (_amount !== "" && isNumberAccepted(_amount)) {
            const amountBN = bigNumberify(parseUnits(_amount, 18));
            if (
                amountBN.lte(maiBalance) &&
                amountBN.gt(0) &&
                amountBN.lte(userVault.vaults[vaultId].debt)
            ) {
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
        const newDebt = bigNumberify(userVault.vaults[vaultId].debt).sub(
            amount
        );

        const result = getLiquidationPrice(
            newDebt,
            userVault.vaults[vaultId].maiDeposit,
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
                <Text>Amount of MAI to repay :</Text>
                <InputWithMax
                    onChange={handleOnInputChange}
                    typeInput="number"
                    maxValue={formatUnits(maiBalance, userVault.decimals)}
                />

                {actionButton === "REPAY" && (
                    <ButtonAction
                        disabled={buttonDisabled}
                        onClick={handleRepayClick}
                    >
                        Repay {formatUnits(amount, 18)} MAI
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

export default Repay;
