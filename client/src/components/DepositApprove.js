import React, { useEffect, useState } from "react";
import InputWithButton from "./InputWithButton";
import { useLongContract } from "../hooks/useLongContract";
import { bigNumberify } from "ethers/utils/bignumber";
import { parseUnits } from "@ethersproject/units";
import { useERC20Contract } from "../hooks/useERC20Contract";
import { useAppContext } from "../AppContext";

const DepositApprove = ({ userVault, vaultId, style }) => {
    const [depositValue, setDepositValue] = useState(undefined);
    const [depositLabel, setDepositLabel] = useState("Deposit");
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const { deposit } = useLongContract(userVault);
    const { approve } = useERC20Contract(userVault);
    const { txnStatus } = useAppContext();

    useEffect(() => {
        let mounted = true;
        mounted && handleDepositOnChange(depositValue);
        return () => {
            mounted = false;
        };
    }, [userVault.allowance]);

    const handleClick = async () => {
        depositLabel === "Deposit"
            ? await deposit(vaultId, depositValue)
            : await approve(depositValue);
        if (txnStatus === "COMPLETE") {
            setDepositLabel("Deposit");
        }
    };

    const handleDepositOnChange = (newValue) => {
        if (newValue) {
            const userBalance = bigNumberify(userVault.userWalletAmount);
            const newValueWei = parseUnits(newValue, userVault.decimals);
            if (userBalance.gte(newValueWei)) {
                const allowanceBN = bigNumberify(userVault.allowance);
                if (allowanceBN.lt(newValueWei)) {
                    setDepositLabel("Approve");
                } else {
                    setDepositLabel("Deposit");
                }
                setDepositValue(newValue);
                setButtonDisabled(false);
            } else {
                setButtonDisabled(true);
            }
        } else {
            setButtonDisabled(true);
        }
    };

    return (
        <InputWithButton
            buttonLabel={depositLabel}
            onClick={handleClick}
            onChange={handleDepositOnChange}
            disabled={buttonDisabled}
        />
    );
};

export default DepositApprove;
