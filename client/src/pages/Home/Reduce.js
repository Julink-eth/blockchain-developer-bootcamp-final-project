import React, { useEffect, useState } from "react";
import { useLongContract } from "../../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import Text from "../../components/styled/Text";
import { getLiquidationPrice, isNumberAccepted } from "../../utils/utils";
import InputWithButton from "../../components/InputWithButton";
import { formatUnits, parseUnits } from "@ethersproject/units";
import tokenAddresses from "../../constants/tokenAddresses.json";

const Reduce = ({ userVault, vaultId, style }) => {
    const [amountToReduce, setAmountToReduce] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [liquidationPriceEstimate, setLiquidationPriceEstimate] =
        useState("");
    const { reduce, fetchAmountMin } = useLongContract(userVault);
    const handleOnReduceClick = () => {
        reduce(vaultId, amountToReduce);
    };

    useEffect(() => {
        let mounted = true;
        const debtBN = bigNumberify(userVault.vaults[vaultId].debt);
        mounted &&
        amountToReduce !== "" &&
        amountToReduce !== "0" &&
        debtBN.gt(0)
            ? setButtonDisabled(false)
            : setButtonDisabled(true);
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userVault.vaults[vaultId].debt, amountToReduce]);

    const handleOnInputChange = (amount) => {
        if (amount !== "" && isNumberAccepted(amount)) {
            const amountBN = bigNumberify(
                parseUnits(amount, userVault.decimals)
            );
            if (
                amountBN.lte(userVault.vaults[vaultId].debt) &&
                amountBN.gt(0)
            ) {
                setAmountToReduce(amountBN.toString());
                getLiquiditionPriceEstimate(amountBN.toString());
            } else {
                setAmountToReduce("0");
            }
        } else {
            setAmountToReduce("0");
        }
    };

    const getLiquiditionPriceEstimate = async (amount) => {
        const debtToal = bigNumberify(userVault.vaults[vaultId].debt).sub(
            amount
        );

        const collateralToUse = await fetchAmountMin(
            userVault.tokenAddress,
            tokenAddresses.MAI,
            amount
        );

        const newCollateral = bigNumberify(
            userVault.vaults[vaultId].maiDeposit
        ).sub(collateralToUse);

        const result = getLiquidationPrice(
            debtToal.toString(),
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
                <Text>Amount of debt to reduce :</Text>
                <InputWithButton
                    buttonLabel="Reduce"
                    onClick={handleOnReduceClick}
                    onChange={handleOnInputChange}
                    typeInput="number"
                    disabled={buttonDisabled}
                    maxValue={formatUnits(
                        userVault.vaults[vaultId].debt,
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

export default Reduce;
