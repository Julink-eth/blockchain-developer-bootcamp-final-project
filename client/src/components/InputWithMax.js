import React, { useState } from "react";
import PropTypes from "prop-types";
import { ButtonCommon } from "./styled/Button";
import { Input } from "./styled/Input";

const InputWithMax = ({
    onClickMax,
    style,
    onChange,
    disabled,
    typeInput,
    maxValue,
}) => {
    const [value, setValue] = useState("0.0");
    return (
        <div style={style}>
            <div
                style={{
                    display: "flex",
                }}
            >
                <Input
                    onChange={(event) => {
                        setValue(event.target.value);
                        onChange(event.target.value);
                    }}
                    type={typeInput}
                    style={{ flex: 1, paddingRight: 50 }}
                    value={value}
                />
                <ButtonCommon
                    onClick={() => {
                        setValue(maxValue);
                        onChange(maxValue);
                        onClickMax(value);
                    }}
                    disabled={disabled}
                    style={{ marginLeft: -50 }}
                >
                    MAX
                </ButtonCommon>
            </div>
        </div>
    );
};

InputWithMax.propTypes = {
    onClickMax: PropTypes.func,
    maxValue: PropTypes.string,
};

InputWithMax.defaultProps = {
    onClickMax: () => {},
    maxValue: "0",
};

export default InputWithMax;
