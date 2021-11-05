import styled from "styled-components";
import { colors } from "../../theme";

export const ButtonCommon = styled.button`
    background-color: ${colors.darkBlue};
    color: ${colors.lightGray};
    padding: 10px;
    border-radius: 10px;
    border-style: none;
    cursor: pointer;
    &:hover {
        background-color: ${colors.lightBlue};
    }

    &:disabled {
        background-color: ${colors.lightBlue};
    }
`;

export const ButtonAction = styled(ButtonCommon)`
    background-color: ${colors.green};
    &:hover {
        background-color: ${colors.lightGreen};
    }

    &:disabled {
        background-color: ${colors.lightGreen};
    }
`;
