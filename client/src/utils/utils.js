import { bigNumberify } from "ethers/utils/bignumber";

export const getLiquidationPrice = (
    debt,
    collateral,
    minCollateralPercantage
) => {
    if (bigNumberify(collateral) > 0) {
        const liquidationPrice = bigNumberify(debt)
            .mul(minCollateralPercantage)
            .div(bigNumberify(collateral));
        const liquidationPriceFloat = parseFloat(liquidationPrice) / 100;
        return liquidationPriceFloat.toString();
    }

    return "0";
};

export const isNumberAccepted = (number) => {
    const regex = new RegExp("^[0-9]*[.,]?[0-9]*$");
    return regex.test(number);
};

export const getConfirmationsCount = (chainId) => {
    return chainId === 1337 ? 1 : 2;
};

export const shortenAddress = (address, num = 3) => {
    if (!address) return "";
    return (
        !!address &&
        `${address.substring(0, num + 2)}...${address.substring(
            address.length - num - 1
        )}`
    );
};
