// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
import {ILendingPoolAddressesProvider} from "./interfaces/Interfaces.sol";
import {IUniswapV2Router} from "./interfaces/Uniswap.sol";
import {IERC20StableCoin} from "./interfaces/MaiFinance.sol";

contract VaultLongMaiFinance is FlashLoanReceiverBase {
    using SafeERC20 for IERC20;

    //Using Aave's lending pool
    ILendingPoolAddressesProvider LENDING_POOL_PRODIVER =
        ILendingPoolAddressesProvider(
            0xd05e3E715d945B59290df0ae8eF85c1BdB684744
        );
    address USDC_ADDRESS = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address MAI_ADDRESS = 0xa3Fa99A148fA48D14Ed51d610c367C61876997F1;

    //Swaps are executed on Quickswap
    address QUICKSWAP_ROUTER = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    //The list of vault ids owned by a user
    mapping(address => uint256[]) private vaults;
    //The list of MAI finance vaults addresses supported
    address public maiVault;
    //The collateral used
    address public collateral;
    //The list of current deposits in the contract for a user by vault Ids
    mapping(address => mapping(uint256 => uint256)) public deposits;

    modifier ownsVault(uint256 vaultId, address sender) {
        //Will check if the caller actually owns the vaultId passed in parameter
        getVaultIndex(vaultId, sender);
        _;
    }

    modifier hasCollateral(uint256 vaultId, uint256 amount) {
        //Will check if the caller has collateral
        uint256 amountCollateral = deposits[msg.sender][vaultId];
        require(amountCollateral >= amount, "AMOUNT_INSUFFICIENT");
        _;
    }

    event VaultCreated(uint256 vaultId);

    event DepositInVault(uint256 vaultId, uint256 amount);

    event BorrowMai(uint256 vaultId, uint256 amount);

    event DepositCollateral(uint256 vaultId, uint256 amount);

    event WithdrawCollateral(uint256 vaultId, uint256 amount);

    constructor(address _collateral, address _maiVault)
        FlashLoanReceiverBase(LENDING_POOL_PRODIVER)
    {
        maiVault = _maiVault;
        collateral = _collateral;
    }

    function createVault() public {
        //Will call MAI finance's createVault function
        //After the creation it will store the vaultId in the contract mapping the user's address
        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        uint256 vaultId = vault.createVault();

        vaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId);
    }

    function depositInVault(uint256 vaultId, uint256 amount) private {
        //Will get the funds from the user's wallet then will call MAI finance's deposit function
        if (amount > 0) {
            IERC20(collateral).approve(maiVault, amount);
            IERC20StableCoin vault = IERC20StableCoin(maiVault);
            vault.depositCollateral(vaultId, amount);

            emit DepositInVault(vaultId, amount);
        }
    }

    function depositCollateral(uint256 vaultId, uint256 amount)
        external
        ownsVault(vaultId, msg.sender)
    {
        //Deposit collateral in the contract (Not yet in Mai finance)
        require(amount > 0);
        IERC20 collateralContract = IERC20(collateral);
        collateralContract.safeTransferFrom(msg.sender, address(this), amount);
        addDeposit(msg.sender, vaultId, amount);

        emit DepositCollateral(vaultId, amount);
    }

    function withdrawFromVault(uint256 vaultId, uint256 amount)
        public
        ownsVault(vaultId, msg.sender)
    {
        //Will call MAI finance's withdraw function and then will send the funds to the user
        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        vault.withdrawCollateral(vaultId, amount);
        addDeposit(msg.sender, vaultId, amount);
    }

    function withdrawCollateral(uint256 vaultId, uint256 amount)
        public
        ownsVault(vaultId, msg.sender)
        hasCollateral(vaultId, amount)
    {
        //Will withdraw the amount of collateral from this contract to the user's wallet
        IERC20(collateral).approve(address(this), amount);
        IERC20(collateral).safeTransferFrom(address(this), msg.sender, amount);
        removeDeposit(msg.sender, vaultId, amount);

        emit WithdrawCollateral(vaultId, amount);
    }

    function removeDeposit(
        address sender,
        uint256 vaultId,
        uint256 amount
    ) private {
        deposits[sender][vaultId] -= amount;
    }

    function addDeposit(
        address sender,
        uint256 vaultId,
        uint256 amount
    ) private {
        deposits[sender][vaultId] += amount;
    }

    function longAsset(uint256 vaultId, uint256 longAmount)
        public
        ownsVault(vaultId, msg.sender)
    {
        //Will create/modify a leverage position using a flash loan (Thanks Abracadra finance for the idea)

        uint256 currentUserCollateral = getUserDeposit(msg.sender, vaultId);
        uint256 maxCollateral = 200 - getMinimumCollateralPercentage();

        //For each asset there a different maximum amount a user can leverage
        //We make sure the leverage passed is below the maximum
        require(
            (longAmount * 100) / (longAmount + currentUserCollateral) <
                maxCollateral,
            "NOT_ENOUGH_COLLATERAL"
        );

        //Flash loan the number required of USDC
        callFlashLoan(vaultId, longAmount, 0);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset
    }

    function reduceLong(uint256 vaultId, uint256 debtAmountToReduce)
        public
        ownsVault(vaultId, msg.sender)
    {
        //Will reduce/close a leverage position using a flash loan (Thanks Abracadra finance for the idea)

        //Flash loan the number required of USDC
        callFlashLoan(vaultId, debtAmountToReduce, 1);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset
    }

    function borrowMai(uint256 vaultId, uint256 amountToBorrow) private {
        //Will call MAI finance's borrow function in the vault chosen
        require(amountToBorrow > 0);

        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        vault.borrowToken(vaultId, amountToBorrow);

        emit BorrowMai(vaultId, amountToBorrow);
    }

    function repayDebt(uint256 vaultId, uint256 amountToRepay) private {
        if (amountToRepay > 0) {
            //Well call MAI finance's repay function to repay the user's debt in its MAI finance's vault

            IERC20(MAI_ADDRESS).approve(maiVault, amountToRepay);

            IERC20StableCoin vault = IERC20StableCoin(maiVault);
            vault.payBackToken(vaultId, amountToRepay);
        }
    }

    function getUserVaultList() public view returns (uint256[] memory) {
        //Return the list of vaults the user has created
        return vaults[msg.sender];
    }

    /**
        This function is called after the contract has received the flash loaned amount
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        (, , uint8 operation, ) = abi.decode(
            params,
            (uint256, address, uint8, uint256)
        );
        //
        // This contract now has the funds requested.
        //
        uint256 amountFL = amounts[0];
        uint256 amountFLWithFees = amounts[0] + premiums[0];
        address tokenFL = assets[0];

        if (operation == 0) {
            longOperation(amountFL, amountFLWithFees, params);
        } else if (operation == 1) {
            reduceOperation(amountFL, amountFLWithFees, params);
        }
        // Approve the LendingPool contract allowance to *pull* the owed amount //The flashloan amount will be reimbursed at the end of this function
        IERC20(tokenFL).approve(address(LENDING_POOL), amountFLWithFees);

        return true;
    }

    function longOperation(
        uint256 amountFL,
        uint256 amountFLWithFees,
        bytes calldata params
    ) private {
        (uint256 vaultId, address sender, , uint256 amountWanted) = abi.decode(
            params,
            (uint256, address, uint8, uint256)
        );

        //Use borrowed USDC to swap for the longed asset
        IERC20(USDC_ADDRESS).approve(QUICKSWAP_ROUTER, amountFL);
        uint256[] memory amountsResult = IUniswapV2Router(QUICKSWAP_ROUTER)
            .swapTokensForExactTokens(
                amountWanted,
                amountFL,
                getPathSwap(USDC_ADDRESS, collateral),
                address(this),
                block.timestamp
            );

        //If we have some USDC left over
        amountFLWithFees -= (amountFL - amountsResult[0]);

        uint256 collateralTotal = amountWanted +
            getUserDeposit(sender, vaultId);

        //Deposit all the link available for this user to MAI finance
        depositInVault(vaultId, collateralTotal);

        //Update user deposit in this contract, we use all the available collateral for this vault
        removeDeposit(sender, vaultId, getUserDeposit(sender, vaultId));

        //Borrow the number of MAI needed to reimburse the flash loan + fees
        uint256 amountToBorrow = getAmountInMin(
            USDC_ADDRESS,
            MAI_ADDRESS,
            amountFLWithFees
        );
        borrowMai(vaultId, amountToBorrow);

        //SWAP MAI for USDC
        IERC20(MAI_ADDRESS).approve(QUICKSWAP_ROUTER, amountToBorrow);
        amountsResult = IUniswapV2Router(QUICKSWAP_ROUTER)
            .swapTokensForExactTokens(
                amountFLWithFees,
                amountToBorrow,
                getPathSwap(MAI_ADDRESS, USDC_ADDRESS),
                address(this),
                block.timestamp
            );

        //Repay part of the debt if we have MAI leftover
        repayDebt(vaultId, amountToBorrow - amountsResult[0]);
    }

    function reduceOperation(
        uint256 amountFL,
        uint256 amountFLWithFees,
        bytes calldata params
    ) private {
        (uint256 vaultId, , , uint256 amountWanted) = abi.decode(
            params,
            (uint256, address, uint8, uint256)
        );

        //Use borrowed USDC to swap for MAI to repay the debt on MAI finance
        IERC20(USDC_ADDRESS).approve(QUICKSWAP_ROUTER, amountFL);
        uint256[] memory amountsResult = IUniswapV2Router(QUICKSWAP_ROUTER)
            .swapTokensForExactTokens(
                amountWanted,
                amountFL,
                getPathSwap(USDC_ADDRESS, MAI_ADDRESS),
                address(this),
                block.timestamp
            );

        //If we have some USDC left over
        amountFLWithFees -= (amountFL - amountsResult[0]);

        //Repay the debt with the MAI received
        repayDebt(vaultId, amountsResult[amountsResult.length - 1]);

        //Withdraw required collateral from the vault to repay the flash loan
        uint256 amountInMax = getAmountInMin(
            USDC_ADDRESS,
            collateral,
            amountFLWithFees
        );

        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        vault.withdrawCollateral(vaultId, amountInMax);

        //Swap the collateral for USDC to repay the loan + premium
        IERC20(collateral).approve(QUICKSWAP_ROUTER, amountInMax);
        amountsResult = IUniswapV2Router(QUICKSWAP_ROUTER)
            .swapTokensForExactTokens(
                amountFLWithFees,
                amountInMax,
                getPathSwap(collateral, USDC_ADDRESS),
                address(this),
                block.timestamp
            );

        //Deposit back the collateral left over
        depositInVault(vaultId, amountInMax - amountsResult[0]);
    }

    //Flash loan using Aave
    function callFlashLoan(
        uint256 vaultId,
        uint256 amountWanted,
        uint8 operation
    ) internal {
        //Quote quickswap to know how much USDC we need to buy the right number of collateral asset
        //We want to long an asset so we get the amount of USDC we need to get the desired amount of that asset
        uint256 amountInMin = getAmountInMin(
            collateral,
            USDC_ADDRESS,
            amountWanted
        );

        if (operation == 1) {
            //We want to repay the MAI debt so we get the amount of USDC we need to get the MAI desired to be repay
            amountInMin = getAmountInMin(
                MAI_ADDRESS,
                USDC_ADDRESS,
                amountWanted
            );
        }

        address receiverAddress = address(this);
        address[] memory assets = new address[](1);
        assets[0] = USDC_ADDRESS;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountInMin;
        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);
        //Last parameter is operation code (0 = LONG, 1 = REDUCE)
        bytes memory params = abi.encode(
            vaultId,
            msg.sender,
            operation,
            amountWanted
        );
        uint16 referralCode = 0;
        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    //HELPERS view/pure functions

    function getMinimumCollateralPercentage() public view returns (uint256) {
        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        return vault._minimumCollateralPercentage();
    }

    //this function will return the minimum amount from a swap
    //input the 3 parameters below and it will return the minimum amount out
    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) internal view returns (uint256) {
        //path is an array of addresses.
        address[] memory path;

        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        uint256[] memory amountOutMins = IUniswapV2Router(QUICKSWAP_ROUTER)
            .getAmountsOut(_amountIn, path);
        return amountOutMins[path.length - 1];
    }

    //this function will return the minimum amount for a swap
    //input the 3 parameters below and it will return the minimum amount in
    function getAmountInMin(
        address _tokenOut,
        address _tokenIn,
        uint256 _amountOut
    ) internal view returns (uint256) {
        //path is an array of addresses.
        address[] memory path;

        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        uint256[] memory amountInMins = IUniswapV2Router(QUICKSWAP_ROUTER)
            .getAmountsIn(_amountOut, path);
        return amountInMins[0];
    }

    function getUserDeposit(address userAddress, uint256 vaultId)
        public
        view
        returns (uint256)
    {
        return deposits[userAddress][vaultId];
    }

    function getPathSwap(address token1, address token2)
        internal
        pure
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;

        return path;
    }

    function getVaultIndex(uint256 vaultId, address sender)
        private
        view
        returns (uint256)
    {
        uint256[] memory userVaults = vaults[sender];
        for (uint256 i = 0; i < userVaults.length; i++) {
            if (userVaults[i] == vaultId) {
                return i;
            }
        }

        //If this user does not own this vaultId revert transaction
        revert("USER_NOT_OWNER");
    }
}
