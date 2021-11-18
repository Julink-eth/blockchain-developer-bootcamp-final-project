// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
import {ILendingPoolAddressesProvider} from "./interfaces/Interfaces.sol";
import {IUniswapV2Router} from "./interfaces/Uniswap.sol";
import {IERC20StableCoin} from "./interfaces/MaiFinance.sol";
import {IVaultLongMaiFinance} from "./interfaces/IVaultLongMaiFinance.sol";

contract VaultLongMaiFinance is FlashLoanReceiverBase {
    using SafeERC20 for IERC20;

    //Using Aave's lending pool for the flash loan
    ILendingPoolAddressesProvider LENDING_POOL_PRODIVER =
        ILendingPoolAddressesProvider(
            0xd05e3E715d945B59290df0ae8eF85c1BdB684744
        );
    address USDC_ADDRESS = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address MAI_ADDRESS = 0xa3Fa99A148fA48D14Ed51d610c367C61876997F1;
    address WMATIC_ADDRESS = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;

    //Swaps are executed on Quickswap
    address QUICKSWAP_ROUTER = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    //The list of vault ids(Ids returned by Mai finance when creating the vault) owned by a user
    mapping(address => uint256[]) private vaults;
    //The address of the mai vault initialized in the constructor
    address public maiVault;
    //The collateral used in this vault
    address public collateral;

    /**
     Will check if the caller actually owns the vaultId passed in parameter
    */
    modifier ownsVault(uint256 vaultId, address sender) {
        getVaultIndex(vaultId, sender);
        _;
    }

    /**
     Will revert if amount is not bigger than 0
    */
    modifier positiveAmount(uint256 amount) {
        require(amount > 0, "POSITIVE_AMOUNT_REQUIRED");
        _;
    }

    event VaultCreated(uint256 vaultId);

    event WithdrawCollateral(uint256 vaultId, uint256 amount);

    event LongAsset(
        uint256 vaultId,
        uint256 longAmount,
        uint256 initialDeposit
    );

    event ReduceLong(uint256 vaultId, uint256 debtAmountToReduce);

    event ClaimRewards(uint256 amountClaimed, uint256 nextClaimableBlock);

    event Deposit(uint256 vaultId, uint256 amount);

    event Repay(uint256 vaultId, uint256 amount);

    event RewardAdded(uint256 reward);

    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _collateral, address _maiVault)
        FlashLoanReceiverBase(LENDING_POOL_PRODIVER)
    {
        maiVault = _maiVault;
        collateral = _collateral;
    }

    function createVault() external {
        //Will call MAI finance's createVault function
        //After the creation it will store the vaultId in the contract mapping the user's address
        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        uint256 vaultId = vault.createVault();

        vaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId);
    }

    /**
     Deposit funds from the user to the contract, then the contract deposit the funds to the chosen Mai vault
     */
    function deposit(uint256 vaultId, uint256 amount)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amount)
    {
        require(amount > 0, "AMOUNT_ZERO");
        IERC20(collateral).transferFrom(msg.sender, address(this), amount);
        depositInVault(vaultId, amount);

        emit Deposit(vaultId, amount);
    }

    /**
     Deposit the collateral from the contract to the Mai finance vault, this is only called after
     the user has deposited the funds in the contract
     */
    function depositInVault(uint256 vaultId, uint256 amount) private {
        //To save on gas we check that the deposit amont is bigger than 0
        if (amount > 0) {
            IERC20(collateral).approve(maiVault, amount);
            IERC20StableCoin(maiVault).depositCollateral(vaultId, amount);
        }
    }

    /**
     Withdraw the collateral amount from the Mai vault calling withdrawFromVault(),
     then sends the fund back to the user
     */
    function withdrawCollateral(uint256 vaultId, uint256 amount)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amount)
    {
        //First withdraw from mai's vault
        withdrawFromVault(vaultId, amount);
        //Then withdraw the amount of collateral from this contract to the user's wallet
        IERC20(collateral).approve(address(this), amount);
        IERC20(collateral).safeTransferFrom(address(this), msg.sender, amount);

        emit WithdrawCollateral(vaultId, amount);
    }

    /**
     Withdraw the collateral amount from the Mai vault to the contract, only called by the contract itself
     */
    function withdrawFromVault(uint256 vaultId, uint256 amount) private {
        IERC20StableCoin(maiVault).withdrawCollateral(vaultId, amount);
    }

    /**
     The functions borrow the required amount of USDC to buy the chosen amount of collateral to long,
     will repay the borrowed USDC by borrowing MAI from Mai finance's vault, the user ends up with a
     long position and a debt in MAI
     Credits to Abracadra finance for the idea
    */
    function longAsset(
        uint256 vaultId,
        uint256 longAmount,
        uint256 initialDeposit
    ) external ownsVault(vaultId, msg.sender) {
        //For each asset there a different maximum amount a user can leverage
        //We make sure the leverage amount is below the maximum
        require(
            initialDeposit > 0 &&
                ((longAmount + initialDeposit) * 100) / longAmount >=
                getMinimumCollateralPercentage(),
            "NOT_ENOUGH_COLLATERAL"
        );

        IERC20(collateral).safeTransferFrom(
            msg.sender,
            address(this),
            initialDeposit
        );

        //Flash loan the number required of USDC
        callFlashLoan(vaultId, longAmount, 0, initialDeposit);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset

        emit LongAsset(vaultId, longAmount, initialDeposit);
    }

    /**
     Reduce the long amount by doing another flash loan in USDC to buy the MAI required to repay the desired amount,
     the contract will then withdraw the required collateral to repay the USDC debt
    */
    function reduceLong(uint256 vaultId, uint256 debtAmountToReduce)
        external
        ownsVault(vaultId, msg.sender)
    {
        //Flash loan the number required of USDC, here the last argument is not used
        callFlashLoan(vaultId, debtAmountToReduce, 1, 0);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset

        emit ReduceLong(vaultId, debtAmountToReduce);
    }

    /**
     Borrow the required amount of MAI from the wanted Mai finance vault, only callable by
     the contract
     */
    function borrowMai(uint256 vaultId, uint256 amountToBorrow) private {
        IERC20StableCoin(maiVault).borrowToken(vaultId, amountToBorrow);
    }

    /**
     Repay the wanted amount of MAI from the user wallet to the chosen vault
     */
    function repay(uint256 vaultId, uint256 amountToRepay)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amountToRepay)
    {
        uint256 userDebt = IERC20StableCoin(maiVault).vaultDebt(vaultId);
        require(amountToRepay <= userDebt, "AMOUNT_TOO_BIG");
        IERC20(MAI_ADDRESS).safeTransferFrom(
            msg.sender,
            address(this),
            amountToRepay
        );
        repayDebt(vaultId, amountToRepay);

        emit Repay(vaultId, amountToRepay);
    }

    /**
     Repay the debt amount in MAI, only callable by
     the contract
     */
    function repayDebt(uint256 vaultId, uint256 amountToRepay) private {
        IERC20(MAI_ADDRESS).approve(maiVault, amountToRepay);
        IERC20StableCoin(maiVault).payBackToken(vaultId, amountToRepay);
    }

    /**
     Get all the vault Ids for the sender address
     */
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
        (, , uint8 operation, , ) = abi.decode(
            params,
            (uint256, address, uint8, uint256, uint256)
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
        // Approve the LendingPool contract allowance to *pull* the owed amount
        //The flashloan amount will be reimbursed at the end of this function
        IERC20(tokenFL).approve(address(LENDING_POOL), amountFLWithFees);

        return true;
    }

    function longOperation(
        uint256 amountFL,
        uint256 amountFLWithFees,
        bytes calldata params
    ) private {
        (
            uint256 vaultId,
            ,
            ,
            uint256 amountWanted,
            uint256 initialDeposit
        ) = abi.decode(params, (uint256, address, uint8, uint256, uint256));

        //Use borrowed USDC to swap for the longed collateral
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

        uint256 collateralTotal = amountWanted + initialDeposit;

        //Deposit all the collateral available for this user to MAI finance
        depositInVault(vaultId, collateralTotal);

        //Borrow the number of MAI needed to reimburse the flash loan + fees
        uint256 amountToBorrow = getAmountInMin(
            MAI_ADDRESS,
            USDC_ADDRESS,
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
            collateral,
            USDC_ADDRESS,
            amountFLWithFees
        );

        IERC20StableCoin(maiVault).withdrawCollateral(vaultId, amountInMax);

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
        uint8 operation,
        uint256 initialDeposit
    ) private {
        //Quote quickswap to know how much USDC we need to buy the right amount of collateral asset
        //We want to long an asset so we get the amount of USDC we need to get the desired amount of that asset
        uint256 amountInMin = getAmountInMin(
            USDC_ADDRESS,
            collateral,
            amountWanted
        );

        if (operation == 1) {
            //We want to repay the MAI debt so we get the amount of USDC we need to get the MAI desired to be repay
            amountInMin = getAmountInMin(
                USDC_ADDRESS,
                MAI_ADDRESS,
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
        //Parameter operation code (0 = LONG, 1 = REDUCE)
        bytes memory params = abi.encode(
            vaultId,
            msg.sender,
            operation,
            amountWanted,
            initialDeposit
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

    /**
     Get the minimum collateral percentage for this Mai vault type
     */
    function getMinimumCollateralPercentage() public view returns (uint256) {
        return IERC20StableCoin(maiVault)._minimumCollateralPercentage();
    }

    /**
     This function will give the multiplicator maximum one user can long an asset
     The result is given multiplied by 100 to keep 2 decimals precision, the caller needs to devide by 100
    */
    function getMultiplicatorMax100th() public view returns (uint256) {
        uint256 collateralThreshold = getMinimumCollateralPercentage() - 100;
        //The +1 is to keep a safety to handle the swap slippage that could occur
        //when longing an asset
        return 10000 / (collateralThreshold + 1);
    }

    /**
     This function will return the minimum amount out from a swap
     */
    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256) {
        address[] memory path;

        path = getPathSwap(_tokenIn, _tokenOut);

        uint256[] memory amountOutMins = IUniswapV2Router(QUICKSWAP_ROUTER)
            .getAmountsOut(_amountIn, path);
        return amountOutMins[path.length - 1];
    }

    /**
     This function will return the minimum amount in for a swap
     */
    function getAmountInMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountOut
    ) public view returns (uint256) {
        address[] memory path;

        path = getPathSwap(_tokenIn, _tokenOut);

        uint256[] memory amountInMins = IUniswapV2Router(QUICKSWAP_ROUTER)
            .getAmountsIn(_amountOut, path);
        return amountInMins[0];
    }

    /**
     Returns an estimate of MAI amount to borrow to create a new long
     */
    function getMAIDebtForAmount(uint256 amount) public view returns (uint256) {
        //path is an array of addresses.
        address[] memory path;

        path = new address[](5);
        path[0] = MAI_ADDRESS;
        path[1] = WMATIC_ADDRESS;
        path[2] = USDC_ADDRESS;
        path[3] = WMATIC_ADDRESS;
        path[4] = collateral;

        uint256[] memory amountInMins = IUniswapV2Router(QUICKSWAP_ROUTER)
            .getAmountsIn(amount, path);
        return amountInMins[0];
    }

    /**
     This will return the max amount of collateral it is possible to withdraw with the current debt
     */
    function getMaxWithdrawableCollateral(uint256 vaultId)
        public
        view
        returns (uint256)
    {
        IERC20StableCoin vault = IERC20StableCoin(maiVault);
        uint256 debt = vault.vaultDebt(vaultId);
        uint256 vautTotalCollateral = vault.vaultCollateral(vaultId);
        if (debt == 0) {
            return vautTotalCollateral;
        }
        uint256 mimumCollateralPercentage = getMinimumCollateralPercentage();
        uint256 currentCollateralPercentage = vault.checkCollateralPercentage(
            vaultId
        );
        uint256 collateralTotalValue = debt * currentCollateralPercentage;
        uint256 collateralUnitValue = collateralTotalValue /
            vautTotalCollateral;
        uint256 maxBorrowableUSDValue = collateralTotalValue /
            mimumCollateralPercentage;
        uint256 leftToBorrowUSDValue = maxBorrowableUSDValue - debt;
        uint256 withdrawableCollateralMax = (leftToBorrowUSDValue /
            collateralUnitValue) * mimumCollateralPercentage;

        return withdrawableCollateralMax;
    }

    /**
     Get the path for the 2 tokens passed in parameters, since we use Quickswap for the swaps,
     will go through WMATIC token to create the swap
    */
    function getPathSwap(address token1, address token2)
        public
        view
        returns (address[] memory)
    {
        if (token1 == WMATIC_ADDRESS || token2 == WMATIC_ADDRESS) {
            address[] memory path = new address[](2);
            path[0] = token1;
            path[1] = token2;

            return path;
        }

        address[] memory pathWMATIC = new address[](3);
        pathWMATIC[0] = token1;
        pathWMATIC[1] = WMATIC_ADDRESS;
        pathWMATIC[2] = token2;

        return pathWMATIC;
    }

    /**
     Get the vault index for the vault Id and sender address passed in parameters
     */
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
