import React, { useState } from "react";
import Card, { CardHeader } from "./styled/Card";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";
import PropTypes from "prop-types";

const ExpandableCard = ({
    contentStyle,
    expandable,
    defaultExpand,
    headerContent,
    children,
}) => {
    const [expanded, setExpanded] = useState(defaultExpand);

    const expand = () => {
        if (expandable) {
            expanded ? setExpanded(false) : setExpanded(true);
        }
    };
    return (
        <div>
            <CardHeader onClick={expand} expandable={expandable}>
                {headerContent}
                <MdOutlineExpandMore
                    size={40}
                    display={expandable && !expanded ? "block" : "none"}
                />
                <MdOutlineExpandLess
                    size={40}
                    display={expandable && expanded ? "block" : "none"}
                />
            </CardHeader>
            {expanded && <Card style={contentStyle}>{children}</Card>}
        </div>
    );
};

ExpandableCard.propTypes = {
    expandable: PropTypes.bool,
    defaultExpand: PropTypes.bool,
};

ExpandableCard.defaultProps = {
    expandable: true,
    defaultExpand: false,
};

export default ExpandableCard;
