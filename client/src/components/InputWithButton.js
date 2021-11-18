import React, { useState } from "react";
import InputWithMax from "./InputWithMax";
import { ButtonAction } from "./styled/Button";

const InputWithButton = ({
    onClick,
    buttonLabel,
    style,
    onChange,
    disabled,
    typeInput,
    maxValue,
}) => {
    const [value, setValue] = useState(undefined);
    return (
        <div style={style}>
            <div
                style={{
                    display: "flex",
                    rowGap: 10,
                    flexDirection: "column",
                }}
            >
                <InputWithMax
                    onChange={(newValue) => {
                        setValue(newValue);
                        onChange(newValue);
                    }}
                    type={typeInput}
                    maxValue={maxValue}
                />
                <ButtonAction
                    onClick={() => {
                        onClick(value);
                    }}
                    disabled={disabled}
                >
                    {buttonLabel}
                </ButtonAction>
            </div>
        </div>
    );
};

export default InputWithButton;
