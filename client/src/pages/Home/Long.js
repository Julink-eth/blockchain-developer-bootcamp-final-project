import React, { useEffect, useState } from "react";
import { useLongContract } from "../../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import Slider from "../../components/Slider";
import { ButtonAction } from "../../components/styled/Button";
import Text from "../../components/styled/Text";
import { getLiquidationPrice, isNumberAccepted } from "../../utils/utils";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useERC20Contract } from "../../hooks/useERC20Contract";
import InputWithMax from "../../components/InputWithMax";

const Long = ({ userVault, vaultId, style }) => {
    const [multiplicator, setMultiplicator] = useState(1.01);
    const [collateralAmountToUse, setCollateralAmountToUse] = useState("");
    const [amountToLong, setAmountToLong] = useState("0");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [liquidationPriceEstimate, setLiquidationPriceEstimate] =
        useState("");
    const [actionButton, setActionButton] = useState("APPROVE");
    const { long, fetchDebtForAmount } = useLongContract(userVault);
    const { approve } = useERC20Contract(userVault);
    const handleApproveClick = () => {
        approve(collateralAmountToUse);
    };
    const handleOnLongClick = () =>
        long(vaultId, amountToLong, collateralAmountToUse);

    useEffect(() => {
        let mounted = true;
        mounted &&
            getLiquiditionPriceEstimate(amountToLong, collateralAmountToUse);
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vaultId, collateralAmountToUse, amountToLong]);

    useEffect(() => {
        let mounted = true;
        const amountToUseBN = bigNumberify(collateralAmountToUse);
        mounted && amountToUseBN.gt(0)
            ? setButtonDisabled(false)
            : setButtonDisabled(true);
        return () => {
            mounted = false;
        };
    }, [userVault.userWalletAmount, collateralAmountToUse]);

    useEffect(() => {
        let mounted = true;
        const onAllowanceChange = (allowance) => {
            const collateralAmountToUseBN = bigNumberify(collateralAmountToUse);
            const allowanceBN = bigNumberify(allowance);
            if (allowanceBN.lt(collateralAmountToUseBN)) {
                setActionButton("APPROVE");
            } else {
                setActionButton("LONG");
            }
        };
        mounted && onAllowanceChange(userVault.allowance);
        return () => {
            mounted = false;
        };
    }, [userVault.allowance, collateralAmountToUse]);

    const handleOnSliderChange = (newValue) => {
        setMultiplicator(newValue);
        const amountToUseBN = bigNumberify(collateralAmountToUse);
        if (amountToUseBN.gt(0)) {
            const toLong = getAmountToLong(collateralAmountToUse, newValue);
            setAmountToLong(toLong);
        }
    };

    const getAmountToLong = (amountToUse, _multiplicator) => {
        const amountToUseBN = bigNumberify(amountToUse);
        if (amountToUseBN.gt(0)) {
            const multiplicator100th = Math.trunc(_multiplicator * 100);
            const multipliedBN = amountToUseBN.mul(multiplicator100th).div(100);
            const toLongBN = multipliedBN.sub(amountToUseBN);
            return toLongBN.toString();
        }
        return "";
    };

    const getLiquiditionPriceEstimate = async (amount, amountToUse) => {
        const amountToUseBN = bigNumberify(amountToUse);
        if (amountToUseBN.gt(0)) {
            const debtAdded = await fetchDebtForAmount(amount);
            const debtToal = bigNumberify(debtAdded).add(
                userVault.vaults[vaultId].debt
            );
            const totalCollateral = amountToUseBN
                .add(bigNumberify(amount))
                .add(userVault.vaults[vaultId].maiDeposit);

            const result = getLiquidationPrice(
                debtToal.toString(),
                totalCollateral.toString(),
                userVault.minCollateralPercentage
            );
            setLiquidationPriceEstimate(result);
        }
    };

    const handleCollateralToUseChange = async (amount) => {
        if (amount !== "" && isNumberAccepted(amount)) {
            const amountToUse = parseUnits(
                amount,
                userVault.decimals
            ).toString();

            const amountBN = bigNumberify(amountToUse);
            if (
                amountBN.gt(bigNumberify(userVault.userWalletAmount)) ||
                amountBN.lte(0)
            ) {
                setButtonDisabled(true);
            } else {
                const toLong = getAmountToLong(amountToUse, multiplicator);
                setCollateralAmountToUse(amountToUse);
                setAmountToLong(toLong);
                setButtonDisabled(false);
            }
        } else {
            setButtonDisabled(true);
        }
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
                <Text>Amount of your {userVault.label} to long :</Text>
                <InputWithMax
                    typeInput="number"
                    onChange={handleCollateralToUseChange}
                    maxValue={formatUnits(
                        userVault.userWalletAmount,
                        userVault.decimals
                    )}
                />
                <Text>Long multiplier :</Text>
                <Slider
                    onChange={handleOnSliderChange}
                    prefixMinMax="X"
                    min={1.01}
                    max={userVault.multiplicatorMax}
                    step={0.01}
                />
                {actionButton === "LONG" && (
                    <ButtonAction
                        disabled={buttonDisabled}
                        onClick={handleOnLongClick}
                    >
                        Long X{multiplicator}
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

export default Long;
