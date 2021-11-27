import React, { useEffect, useState } from "react";
import { useLongContract } from "../../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import Text from "../../components/styled/Text";
import { getLiquidationPrice, isNumberAccepted } from "../../utils/utils";
import InputWithButton from "../../components/InputWithButton";
import { formatUnits, parseUnits } from "@ethersproject/units";

const Withdraw = ({ userVault, vaultId, style }) => {
    const [amountToWithdraw, setAmountToWithdraw] = useState("0");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [liquidationPriceEstimate, setLiquidationPriceEstimate] =
        useState("");
    const { withdraw } = useLongContract(userVault);
    const handleWithdrawClick = () => {
        withdraw(vaultId, amountToWithdraw);
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            if (
                amountToWithdraw !== "" &&
                amountToWithdraw !== "0" &&
                userVault.vaults[vaultId].maxWithdrawableAmount !== "0"
            ) {
                setButtonDisabled(false);
            } else {
                setButtonDisabled(true);
            }
        }
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amountToWithdraw, userVault.vaults[vaultId].maxWithdrawableAmount]);

    const handleOnInputChange = async (amount) => {
        if (amount !== "" && isNumberAccepted(amount)) {
            const amountBN = bigNumberify(
                parseUnits(amount, userVault.decimals)
            );
            if (
                amountBN.lte(userVault.vaults[vaultId].maxWithdrawableAmount) &&
                amountBN.gt(0)
            ) {
                setAmountToWithdraw(amountBN.toString());
                getLiquiditionPriceEstimate(amountBN.toString());
            } else {
                setAmountToWithdraw("0");
            }
        } else {
            setAmountToWithdraw("0");
        }
    };

    const getLiquiditionPriceEstimate = async (amount) => {
        const newCollateral = bigNumberify(
            userVault.vaults[vaultId].maiDeposit
        ).sub(amount);

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
                <Text>Amount of collateral to withdraw :</Text>
                <InputWithButton
                    buttonLabel="Withdraw"
                    onClick={handleWithdrawClick}
                    onChange={handleOnInputChange}
                    typeInput="number"
                    disabled={buttonDisabled}
                    maxValue={formatUnits(
                        userVault.vaults[vaultId].maxWithdrawableAmount,
                        userVault.decimals
                    )}
                />
                {!buttonDisabled && (
                    <Text>
                        Estimated liquidation price : {liquidationPriceEstimate}
                    </Text>
                )}
            </div>
        </div>
    );
};

export default Withdraw;
