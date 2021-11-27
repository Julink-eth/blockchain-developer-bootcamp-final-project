import React, { useEffect } from "react";
import { useAppContext } from "../AppContext";
import { GlobalErrorStyled } from "./styled/NotificationStyled";
import Text from "./styled/Text";

const GlobalError = () => {
    const { contentError, setContentError } = useAppContext();

    useEffect(() => {
        if (contentError) {
            setTimeout(() => {
                setContentError("");
            }, 5000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentError]);

    if (!contentError) {
        return null;
    }
    return (
        <GlobalErrorStyled fluid>
            <Text>{contentError}</Text>
        </GlobalErrorStyled>
    );
};

export default GlobalError;
