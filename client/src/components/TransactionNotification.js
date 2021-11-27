import React, { useEffect, useRef } from "react";
import { useAppContext } from "../AppContext";
import Text from "./styled/Text";
import Notification from "./Notification";
import MoonLoader from "react-spinners/MoonLoader";

const TransactionNotification = () => {
    const { txnStatus, setTxnStatus } = useAppContext();
    const handleOnCloseClick = () => setTxnStatus("NOT_SUBMITTED");
    const txnStatusRef = useRef(txnStatus);
    txnStatusRef.current = txnStatus;

    useEffect(() => {
        let mounted = true;
        mounted &&
            (txnStatus === "COMPLETE" || txnStatus === "ERROR") &&
            setTimeout(() => {
                if (txnStatusRef.current !== "LOADING") {
                    setTxnStatus("NOT_SUBMITTED");
                }
            }, 5000);
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [txnStatus]);

    const getMessage = () => {
        let headerText = "";
        switch (txnStatus) {
            case "LOADING":
                return (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <Text t4>Transaction pending</Text>
                        <MoonLoader
                            loading={true}
                            size={25}
                            css={{ marginLeft: 10 }}
                        />
                    </div>
                );

            case "COMPLETE":
                headerText = "Transaction completed!";
                break;
            case "ERROR":
                headerText = "An error occured";
                break;
            default:
                headerText = "An error occured";
                break;
        }

        return <Text t4>{headerText}</Text>;
    };

    return (
        <>
            {txnStatus !== "NOT_SUBMITTED" && (
                <Notification onClose={handleOnCloseClick}>
                    {getMessage()}
                </Notification>
            )}
        </>
    );
};

export default TransactionNotification;
