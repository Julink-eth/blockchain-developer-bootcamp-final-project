import styled from "styled-components";
import { colors, textSizes } from "../../theme";

export const Input = styled.input`
    padding: 5px;
    border-radius: 10px;
    border-width: 1px;
    border-color: ${colors.gray};
    font-size: ${textSizes.t3};
    font-family: "Inter custom,sans-serif";
`;
