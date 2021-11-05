import React, { useState } from "react";
import { ButtonAction } from "./styled/Button";
import { Input } from "./styled/Input";

const InputWithButton = ({
    onClick,
    buttonLabel,
    style,
    onChange,
    disabled,
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
                <Input
                    onChange={(event) => {
                        setValue(event.target.value);
                        onChange(event.target.value);
                    }}
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
