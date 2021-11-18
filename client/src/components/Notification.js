import React from "react";
import { ButtonCommon } from "./styled/Button";
import {
    NotificationContent,
    NotificationStyled,
} from "./styled/NotificationStyled";

const Notification = ({ children, onClose }) => {
    return (
        <NotificationStyled>
            <NotificationContent>
                <div></div>
                {children}
                <ButtonCommon onClick={() => onClose()}>Close</ButtonCommon>
            </NotificationContent>
        </NotificationStyled>
    );
};

export default Notification;
