import styled from "styled-components";
import { colors } from "../../theme";

export const NotificationStyled = styled.div`
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 9999;
`;

export const NotificationContent = styled.div`
    background-color: ${colors.lightBlue};
    display: flex;
    flex-direction: row;
    margin: 20px;
    justify-content: space-between;
    align-items: center;
    border-radius: 10px;
    padding: 10px;
`;

export const GlobalErrorStyled = styled.div`
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 9999;
    background-color: ${colors.red};
    padding: 10px;
    text-align: center;
`;
