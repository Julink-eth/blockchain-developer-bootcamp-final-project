// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

contract VaultLongMaiFinance {
    mapping(address => mapping(address => uint256[])) private vaults;

    modifier ownsVault(uint256 vaultId) {
        //Will check if the caller actually owns the vaultId passed in parameter
        _;
    }

    event VaultCreated(uint256 vaultId);

    constructor() {}

    function createVault(address vaultAddress) public {
        //Will call MAI finance's createVault function
        //After the creation it will store the vaultId in the contract mapping the user's address
        bytes memory payload = abi.encodeWithSignature("createVault()");
        (bool success, bytes memory returnData) = address(vaultAddress).call(
            payload
        );

        require(success);

        uint256 vaultId = abi.decode(returnData, (uint256));
        vaults[msg.sender][vaultAddress].push(vaultId);

        emit VaultCreated(vaultId);
    }

    function depositInVault(uint256 vaultId) public payable ownsVault(vaultId) {
        //Will get the funds from the user's wallet then will call MAI finance's deposit function
    }

    function withdrawFromVault(uint256 vaultId, uint256 amountToWithdraw)
        public
        ownsVault(vaultId)
    {
        //Will call MAI finance's withdraw function and then will send the funds to the user
    }

    function longAsset(
        uint256 vaultId,
        uint8 collateralAmountToUse,
        uint256 leverageLoops
    ) public ownsVault(vaultId) {
        //Will create/modify a leverage position borrowing MAI -> Selling MAI for more Collateral -> Borrowing more MAI etc...
        //As many times as the parameter @leverageLoops
    }

    function borrowMai(uint256 vaultId, uint256 amountToBorrow)
        internal
        ownsVault(vaultId)
    {
        //Will call MAI finance's borrow function in the vault chosen
    }

    function repayDebt(uint256 vaultId, uint256 amountToRepay)
        public
        ownsVault(vaultId)
    {
        //Well call MAI finance's repay function to repay the user's debt in its MAI finance's vault
    }

    function getUserVaultList(address vaultAddress)
        public
        view
        returns (uint256[] memory)
    {
        //Return the list of vaults the user has created
        return vaults[msg.sender][vaultAddress];
    }
}
