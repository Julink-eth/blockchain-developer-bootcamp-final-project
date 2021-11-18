import styled from "styled-components";
import { colors, textSizes } from "../../theme";

export const ButtonCommon = styled.button`
    background-color: ${colors.darkBlue};
    color: ${colors.lightGray};
    padding: 10px;
    border-radius: 10px;
    border-style: none;
    cursor: pointer;
    font-family: Inter custom, sans-serif;
    font-size: ${textSizes.t5};
    &:hover {
        background-color: ${colors.lightBlue};
    }

    &:disabled {
        background-color: ${colors.lightBlue};
        cursor: unset;
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

export const ButtonAlert = styled(ButtonCommon)`
    background-color: ${colors.red};
    &:hover {
        background-color: ${colors.lightRed};
    }

    &:disabled {
        background-color: ${colors.lightRed};
    }
`;
