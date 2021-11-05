import { useMemo } from "react";
import { ethers } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import { useWeb3React } from "@web3-react/core";

export function useContract(contractAddress, ABI) {
    if (contractAddress === AddressZero) {
        throw Error(
            `Invalid 'contractAddress' parameter '${contractAddress}'.`
        );
    }

    const { library, account } = useWeb3React();

    const signerOrProvider = account ? library.getSigner(account) : library;

    return useMemo(() => {
        return new ethers.Contract(contractAddress, ABI, signerOrProvider);
    }, [contractAddress, ABI, signerOrProvider]);
}
