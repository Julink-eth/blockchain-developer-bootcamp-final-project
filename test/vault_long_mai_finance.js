const VaultLongMaiFinance = artifacts.require("VaultLongMaiFinance");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("VaultLongMaiFinance", function (/* accounts */) {
    const linkVaultMAI = "0x61167073E31b1DAd85a3E531211c7B8F1E5cAE72";

    it("should assert true", async function () {
        await VaultLongMaiFinance.deployed();
        return assert.isTrue(true);
    });

    it("should be able to create a vault", async function () {
        const contract = await VaultLongMaiFinance.deployed();
        const result = await contract.createVault(linkVaultMAI);
        return assert.isTrue(result !== undefined);
    });

    it("should have more than 0 vault in MAI finance's contract", async function () {
        const contract = await VaultLongMaiFinance.deployed();
        await contract.createVault(linkVaultMAI);
        const balanceOfABI = [
            {
                constant: true,
                inputs: [
                    { internalType: "address", name: "owner", type: "address" },
                ],
                name: "balanceOf",
                outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                ],
                payable: false,
                stateMutability: "view",
                type: "function",
            },
        ];
        const maiContract = new web3.eth.Contract(balanceOfABI, linkVaultMAI);
        const balance = await maiContract.methods
            .balanceOf(contract.address)
            .call();
        return assert.isTrue(balance !== "0");
    });

    it("should be able to return vaults for sender", async function () {
        const toBN = web3.utils.toBN;
        const contract = await VaultLongMaiFinance.deployed();
        const results = await contract.getUserVaultList(linkVaultMAI);
        results.forEach((result) => {
            console.log(result.toString());
        });
        return assert.isTrue(true);
    });
});
