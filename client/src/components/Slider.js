import React from "react";
import { SliderStyled } from "./styled/SliderSyled";
import PropTypes from "prop-types";

const Slider = ({ min, max, step, onChange, style, prefixMinMax }) => {
    return (
        <div style={style}>
            <SliderStyled
                type="range"
                list="tickmarks"
                step={step}
                min={min}
                max={max}
                defaultValue={min}
                onChange={(event) => onChange(event.target.value)}
            />
            <datalist
                id="tickmarks"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "red",
                }}
            >
                <option value={min} label={prefixMinMax + "" + min}></option>
                <option value={max} label={prefixMinMax + "" + max}></option>
            </datalist>
        </div>
    );
};

Slider.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    prefixMinMax: PropTypes.string,
};

Slider.defaultProps = {
    min: 1,
    max: 4,
    step: 0.1,
    prefixMinMax: "",
};

export default Slider;
