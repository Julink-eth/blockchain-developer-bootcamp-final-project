// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FlashLoanReceiverBase} from "./FlashLoanReceiverBase.sol";
import {ILendingPoolAddressesProvider} from "./interfaces/ILendingPoolAddressesProvider.sol";
import {IUniswapV2Router} from "./interfaces/Uniswap.sol";
import {IERC20StableCoin} from "./interfaces/IERC20StableCoin.sol";
import {IVaultLongMaiFinance} from "./interfaces/IVaultLongMaiFinance.sol";

/**
 @title Abstract contract inherited by all the vault contracts
 @author Julien Fontanel
 @notice Allows to interact with the Mai finance vaults in an easier way to long collateral assets
 @dev Will have to optimize the swaps when making the flash loan + check for slippage
 */
abstract contract VaultLongMaiFinanceBase is FlashLoanReceiverBase, Ownable {
    using SafeERC20 for IERC20;

    //Tokens addresses used to make swaps
    address usdcAddr;
    address maiAddr;
    address wmaticAddr;

    //Reward token by Mai Finance
    address qiAddr;

    //Swaps are executed on Quickswap
    address quickswapRouterAddr;

    //The list of vault ids(Ids returned by Mai finance when creating the vault) owned by a user
    mapping(address => uint256[]) private vaults;
    //The address of the mai vault type initialized in the constructor
    address public maiVault;
    //The collateral address used in this vault
    address public collateral;

    //This keeps track of the user debt by period
    mapping(address => mapping(uint256 => uint256)) public userDebtByPeriod;
    //The current user debt
    mapping(address => uint256) public userDebt;
    //The last time a user has been updated
    mapping(address => uint256) public lastUserUpdate;
    //The last period start a user has been updated
    mapping(address => uint256) public currentUserPeriodStart;
    //This will keep track of the total debt by period
    mapping(uint256 => uint256) public totalDebtByPeriod;
    //This will keep track of Qi received by the contract by period to be shared to the users
    mapping(uint256 => uint256) public balanceRewardsByPeriod;
    //Current total debt
    uint256 public totalDebt = 0;
    //Last time update
    uint256 public lastTimeUpdate = 0;
    //The number of blocks a period lasts
    uint256 public constant blocksByPeriod = 7 days;
    //Allow to know if a user has already claimed its reward for a specific period
    mapping(address => uint256) public userLastClaimPeriodStart;
    //Start time for the current period
    uint256 public currentPeriodStart;

    /**
     @notice Checks if the caller actually owns the vaultId passed in parameter
     @param vaultId uint256 the vaultId to check
     @param sender address The user to check
    */
    modifier ownsVault(uint256 vaultId, address sender) {
        require(userOwnsVault(vaultId, sender), "USER_NOT_OWNER");
        _;
    }

    /**
     @notice Revert if amount equals to 0
    */
    modifier positiveAmount(uint256 amount) {
        require(amount > 0, "POSITIVE_AMOUNT_REQUIRED");
        _;
    }

    event VaultCreated(uint256 vaultId);

    event WithdrawCollateral(uint256 vaultId, uint256 amount);

    event Deposit(uint256 vaultId, uint256 amount);

    event Repay(uint256 vaultId, uint256 amount);

    event LongAsset(
        uint256 vaultId,
        uint256 longAmount,
        uint256 initialDeposit
    );

    event ReduceLong(uint256 vaultId, uint256 debtAmountToReduce);

    event ClaimRewardsFor(address indexed user, uint256 claimed);

    /**
     @notice When a new vault is created, it needs to add its collateral address, the vault type address in Mai finance
     and the period start at which it starts getting rewards from Mai Finance
     @param _collateral address The collateral address
     @param _maiVault address The vault type address on Mai Finance
     @param _periodStart uint256 The time at which the contract start earning rewards from Mai Finance (In seconds unix time)
     @param aaveLendingPoolAddr address The lending pool address to make the flash loan
     @param _usdcAddr address the USDC token address
     @param _maiAddr address the MAI token address
     @param _wmaticAddr address the WMATIC token address
     @param _qiAddr address the QI token address
     @param _quickswapRouterAddr address the Quickswap router address to make the swaps
     */
    constructor(
        address _collateral,
        address _maiVault,
        uint256 _periodStart,
        address aaveLendingPoolAddr,
        address _usdcAddr,
        address _maiAddr,
        address _wmaticAddr,
        address _qiAddr,
        address _quickswapRouterAddr
    )
        FlashLoanReceiverBase(
            ILendingPoolAddressesProvider(aaveLendingPoolAddr)
        )
    {
        maiVault = _maiVault;
        collateral = _collateral;
        currentPeriodStart = _periodStart;
        usdcAddr = _usdcAddr;
        maiAddr = _maiAddr;
        wmaticAddr = _wmaticAddr;
        qiAddr = _qiAddr;
        quickswapRouterAddr = _quickswapRouterAddr;
        lastTimeUpdate = block.timestamp;
    }

    /**
     @notice Create a new vault in Mai finance protocol for the sender
     */
    function createVault() external {
        //After the creation stores the vaultId in the contract mapping the user's address
        uint256 vaultId = IERC20StableCoin(maiVault).createVault();

        vaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId);
    }

    /**
     @notice Deposits funds from the user to the contract, then the contract deposit the funds to the chosen Mai vault
     @param vaultId uint256 The vaultId where to deposit the funds
     @param amount uint256 the amount to deposit
     */
    function deposit(uint256 vaultId, uint256 amount)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amount)
    {
        require(amount > 0, "AMOUNT_ZERO");

        IERC20(collateral).safeTransferFrom(msg.sender, address(this), amount);
        depositInVault(vaultId, amount);

        emit Deposit(vaultId, amount);
    }

    /**
     @notice Deposit the collateral from the contract to the Mai finance vault, this is only called after
     the user has deposited the funds into the contract
     @param vaultId uint256 The vaultId where to deposit the funds
     @param amount uint256 the amount to deposit
     */
    function depositInVault(uint256 vaultId, uint256 amount) private {
        //To save on gas we check that the deposit amont is not 0
        if (amount > 0) {
            IERC20(collateral).safeIncreaseAllowance(maiVault, amount);
            IERC20StableCoin(maiVault).depositCollateral(vaultId, amount);
        }
    }

    /**
     @notice Withdraw the collateral amount from the Mai vault calling withdrawFromVault(),
     then sends the fund back to the user
     @param vaultId uint256 The vaultId from where to withdraw the funds
     @param amount uint256 the amount to withdraw
     */
    function withdrawCollateral(uint256 vaultId, uint256 amount)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amount)
    {
        //First withdraw from mai's vault
        withdrawFromVault(vaultId, amount);
        //Then transfer the amount of collateral from this contract to the user's wallet
        IERC20(collateral).safeIncreaseAllowance(address(this), amount);
        IERC20(collateral).safeTransferFrom(address(this), msg.sender, amount);

        emit WithdrawCollateral(vaultId, amount);
    }

    /**
     @notice Withdraw the collateral amount from the Mai vault to the contract, only called by the contract itself
     @param vaultId uint256 The vaultId from where to withdraw the funds
     @param amount uint256 the amount to withdraw
     */
    function withdrawFromVault(uint256 vaultId, uint256 amount) private {
        IERC20StableCoin(maiVault).withdrawCollateral(vaultId, amount);
    }

    /**
     @notice Borrows the required amount of USDC to buy the chosen amount of collateral to long,
     will repay the borrowed USDC by borrowing MAI from Mai finance's vault, the user ends up with a
     long position on the vault's collateral and a debt in MAI
     Credits to Abracadra finance for the idea
     @param vaultId uint256 The vault Id where the user wants to create the long
     @param longAmount uint256 The amount to long
     @param initialDeposit uint256 The intial deposit
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

        uint256 userDebtBefore = IERC20StableCoin(maiVault).vaultDebt(vaultId);

        IERC20(collateral).safeTransferFrom(
            msg.sender,
            address(this),
            initialDeposit
        );

        //Flash loan the number required of USDC
        callFlashLoan(vaultId, longAmount, 0, initialDeposit);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset

        //We keep track of the user debt for the airdropped rewards from Mai finance
        uint256 userDebtAfter = IERC20StableCoin(maiVault).vaultDebt(vaultId);
        updateRewards(msg.sender, userDebtAfter - userDebtBefore, true);

        emit LongAsset(vaultId, longAmount, initialDeposit);
    }

    /**
     @notice Reduce the long amount by doing another flash loan in USDC to buy the MAI required to repay the desired amount,
     the contract will then withdraw the required collateral to repay the USDC debt
     @param vaultId uint256 The vault Id where the user wants to reduce the long
     @param debtAmountToReduce The debt amount to reduce (In MAI)
    */
    function reduceLong(uint256 vaultId, uint256 debtAmountToReduce)
        external
        ownsVault(vaultId, msg.sender)
    {
        //We keep track of the user debt for the airdropped rewards from Mai finance
        updateRewards(msg.sender, debtAmountToReduce, false);

        //Flash loan the number required of USDC, here the last argument is not used
        callFlashLoan(vaultId, debtAmountToReduce, 1, 0);
        //The next operations happen in the function "executeOperation" which is called by
        //callFlashLoan once the asset the contract has received the loaned asset

        emit ReduceLong(vaultId, debtAmountToReduce);
    }

    /**
     @notice Borrows the required amount of MAI from the wanted Mai finance vault, only callable by
     the contract
     @param vaultId uint256 the vault Id where to borrow from
     @param amountToBorrow uint256 the amount of MAI to borrow
     */
    function borrowMai(uint256 vaultId, uint256 amountToBorrow) private {
        IERC20StableCoin(maiVault).borrowToken(vaultId, amountToBorrow);
    }

    /**
     @notice Repay the wanted amount of MAI from the user wallet to the chosen vault
     @param vaultId uint256 The vault Id to repay
     @param amountToRepay The amount of MAI to repay
     */
    function repay(uint256 vaultId, uint256 amountToRepay)
        external
        ownsVault(vaultId, msg.sender)
        positiveAmount(amountToRepay)
    {
        //We make sure the amount is not larger than the debt itself
        uint256 _userDebt = IERC20StableCoin(maiVault).vaultDebt(vaultId);
        require(amountToRepay <= _userDebt, "AMOUNT_TOO_BIG");

        IERC20(maiAddr).safeTransferFrom(
            msg.sender,
            address(this),
            amountToRepay
        );
        repayDebt(vaultId, amountToRepay);

        //We keep track of the user debt for the airdropped rewards from Mai finance
        uint256 userDebtAfter = IERC20StableCoin(maiVault).vaultDebt(vaultId);
        updateRewards(msg.sender, _userDebt - userDebtAfter, false);

        emit Repay(vaultId, amountToRepay);
    }

    /**
     @notice Repay the debt amount in MAI, only callable by
     the contract
     @param vaultId uint256 The vault Id to repay
     @param amountToRepay The amount of MAI to repay
     */
    function repayDebt(uint256 vaultId, uint256 amountToRepay) private {
        IERC20(maiAddr).safeIncreaseAllowance(maiVault, amountToRepay);
        IERC20StableCoin(maiVault).payBackToken(vaultId, amountToRepay);
    }

    /**
     @notice Get all the vault Ids for the sender address
     @return vaults uint256[] The list of vault Ids
     */
    function getUserVaultList() public view returns (uint256[] memory) {
        //Return the list of vaults the user has created
        return vaults[msg.sender];
    }

    /**
     @notice This is called after the contract has received the flash loaned amount
     @param assets address[] The list of asset addresses borrowed
     @param amounts uint256[] The list of amount borrowed for each asset
     @param premiums uint256[] The list of amount in fees for each borrowed asset
     @param initiator address The address that intiated the flash loan (not used here)
     @param params bytes params sent by the caller 
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        //vaultId, amount, operation, initialDeposit
        (, uint8 operation, , ) = abi.decode(
            params,
            (uint256, uint8, uint256, uint256)
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
        //Approve the LendingPool contract allowance to *pull* the owed amount
        //The flashloan amount will be reimbursed at the end of this function
        IERC20(tokenFL).safeIncreaseAllowance(
            address(LENDING_POOL),
            amountFLWithFees
        );

        return true;
    }

    /**
     @notice Swap the borrowed USDC for more collateral, deposit the USDC to Mai Finance, borrow enough MAI to repay
     the USDC debt from the flash loan
     @param amountFL uint256 The amount of borrowed USDC from the flash loan
     @param amountFLWithFees uint256 The amount of USDC borrowed + the fees
     @param params bytes The parameters sent by the caller
     */
    function longOperation(
        uint256 amountFL,
        uint256 amountFLWithFees,
        bytes calldata params
    ) private {
        (uint256 vaultId, , uint256 amountWanted, uint256 initialDeposit) = abi
            .decode(params, (uint256, uint8, uint256, uint256));

        //Use borrowed USDC to swap for the longed collateral
        IERC20(usdcAddr).safeIncreaseAllowance(quickswapRouterAddr, amountFL);
        uint256[] memory amountsResult = IUniswapV2Router(quickswapRouterAddr)
            .swapTokensForExactTokens(
                amountWanted,
                amountFL,
                getPathSwap(usdcAddr, collateral),
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
            maiAddr,
            usdcAddr,
            amountFLWithFees
        );
        borrowMai(vaultId, amountToBorrow);

        //SWAP MAI for USDC
        IERC20(maiAddr).safeIncreaseAllowance(
            quickswapRouterAddr,
            amountToBorrow
        );
        amountsResult = IUniswapV2Router(quickswapRouterAddr)
            .swapTokensForExactTokens(
                amountFLWithFees,
                amountToBorrow,
                getPathSwap(maiAddr, usdcAddr),
                address(this),
                block.timestamp
            );

        //Repay part of the debt if we have MAI leftover
        repayDebt(vaultId, amountToBorrow - amountsResult[0]);
    }

    /**
     @notice Swap the borrowed USDC for more MAI, repay the debt in Mai Finance, withdraw collateral from the Mai Finance vault,
     swap the collareal to USDC to repay the flash loan + fees
     @param amountFL uint256 The amount of borrowed USDC from the flash loan
     @param amountFLWithFees uint256 The amount of USDC borrowed + the fees
     @param params bytes The parameters sent by the caller
     */
    function reduceOperation(
        uint256 amountFL,
        uint256 amountFLWithFees,
        bytes calldata params
    ) private {
        (uint256 vaultId, , uint256 amountWanted, ) = abi.decode(
            params,
            (uint256, uint8, uint256, uint256)
        );

        //Use borrowed USDC to swap for MAI to repay the debt on MAI finance
        IERC20(usdcAddr).safeIncreaseAllowance(quickswapRouterAddr, amountFL);
        uint256[] memory amountsResult = IUniswapV2Router(quickswapRouterAddr)
            .swapTokensForExactTokens(
                amountWanted,
                amountFL,
                getPathSwap(usdcAddr, maiAddr),
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
            usdcAddr,
            amountFLWithFees
        );

        IERC20StableCoin(maiVault).withdrawCollateral(vaultId, amountInMax);

        //Swap the collateral for USDC to repay the loan + premium
        IERC20(collateral).safeIncreaseAllowance(
            quickswapRouterAddr,
            amountInMax
        );
        amountsResult = IUniswapV2Router(quickswapRouterAddr)
            .swapTokensForExactTokens(
                amountFLWithFees,
                amountInMax,
                getPathSwap(collateral, usdcAddr),
                address(this),
                block.timestamp
            );

        //Deposit back the collateral left over
        depositInVault(vaultId, amountInMax - amountsResult[0]);
    }

    /**
     @notice Flash loan using aave lending pool to be able to long or reduce a collateral in one transaction
     @param vaultId uint256 The vault Id where we want to long/reduce the collateral
     @param amountWanted uint256 The amount to long/reduce
     @param operation uint8 The operation to execute after the flash loan (0 = Long / 1 = Reduce)
     @param initialDeposit uint256 The initial deposit to create the long (not used when reducing)
    */
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
            usdcAddr,
            collateral,
            amountWanted
        );

        if (operation == 1) {
            //We want to repay the MAI debt so we get the amount of USDC we need to get the MAI desired to be repay
            amountInMin = getAmountInMin(usdcAddr, maiAddr, amountWanted);
        }

        address receiverAddress = address(this);
        address[] memory assets = new address[](1);
        assets[0] = usdcAddr;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountInMin;
        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);
        //Parameter operation code (0 = LONG, 1 = REDUCE)
        bytes memory params = abi.encode(
            vaultId,
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
     @notice Get the minimum collateral percentage for this Mai vault type
     @return uint256 The minimum collateral percentage 
     */
    function getMinimumCollateralPercentage() public view returns (uint256) {
        return IERC20StableCoin(maiVault)._minimumCollateralPercentage();
    }

    /**
     @notice Returns the multiplicator maximum one user can long an asset
     The result is given multiplied by 100 to keep 2 decimals precision, the caller needs to devide by 100
     @return uint256 The maximum multiplicator
    */
    function getMultiplicatorMax100th() public view returns (uint256) {
        uint256 collateralThreshold = getMinimumCollateralPercentage() - 100;
        //The +1 is to keep a safety to handle the swap slippage that could occur
        //when longing an asset, so technically it's 99% of the maximum that is returned
        return 10000 / (collateralThreshold + 1);
    }

    /**
     @notice Returns the minimum amount out from a swap
     @param _tokenIn address The token address in
     @param _tokenOut address The token address out
     @param _amountIn uint256 The amount in
     */
    function getAmountOutMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256) {
        address[] memory path;

        path = getPathSwap(_tokenIn, _tokenOut);

        uint256[] memory amountOutMins = IUniswapV2Router(quickswapRouterAddr)
            .getAmountsOut(_amountIn, path);
        return amountOutMins[path.length - 1];
    }

    /**
     @notice Returns the minimum amount in from a swap
     @param _tokenIn address The token address in
     @param _tokenOut address The token address out
     @param _amountOut uint256 The amount out
     */
    function getAmountInMin(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountOut
    ) public view returns (uint256) {
        address[] memory path;

        path = getPathSwap(_tokenIn, _tokenOut);

        uint256[] memory amountInMins = IUniswapV2Router(quickswapRouterAddr)
            .getAmountsIn(_amountOut, path);
        return amountInMins[0];
    }

    /**
     @notice Returns an estimate of MAI amount to borrow to create a new long
     @param amount uint256 The amount of collateral to long
     @return uint256 The amount of MAI to borrow to create the long
     */
    function getMAIDebtForAmount(uint256 amount) public view returns (uint256) {
        //path is an array of addresses.
        address[] memory path;

        //We go through USDC since the flash loan is executed with USDC
        path = new address[](5);
        path[0] = maiAddr;
        path[1] = wmaticAddr;
        path[2] = usdcAddr;
        path[3] = wmaticAddr;
        path[4] = collateral;

        uint256[] memory amountInMins = IUniswapV2Router(quickswapRouterAddr)
            .getAmountsIn(amount, path);
        return amountInMins[0];
    }

    /**
     @notice Return the max amount of collateral it is possible to withdraw with the current debt
     @param vaultId uint256 The vault Id to check
     @return uint256 the max amount to withdraw
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
     @notice Get the path for the 2 tokens passed in parameters, since we use Quickswap for the swaps,
     will go through WMATIC token to create the swap
     @param token1 addres The token address in
     @param token2 addres The token address out
     @return address[] The path
    */
    function getPathSwap(address token1, address token2)
        public
        view
        returns (address[] memory)
    {
        if (token1 == wmaticAddr || token2 == wmaticAddr) {
            address[] memory path = new address[](2);
            path[0] = token1;
            path[1] = token2;

            return path;
        }

        address[] memory pathWMATIC = new address[](3);
        pathWMATIC[0] = token1;
        pathWMATIC[1] = wmaticAddr;
        pathWMATIC[2] = token2;

        return pathWMATIC;
    }

    /**
     @notice Check if the sener owns the vault Id passed in parameter
     @param vaultId uint256 The vault Id to check
     @param sender address The sender to check
     @return bool True is the sender owns this vault Id
                  False is the sender does not own this vault Id
     */
    function userOwnsVault(uint256 vaultId, address sender)
        public
        view
        returns (bool)
    {
        uint256[] memory userVaults = vaults[sender];
        for (uint256 i = 0; i < userVaults.length; i++) {
            if (userVaults[i] == vaultId) {
                return true;
            }
        }

        return false;
    }

    //Rewards functions

    /**
     @notice Claims the pending reward for a user for a specific vault, the rewards are coming from the weekly distribution
     from Mai finance in Qi rewards, a user will be able to claim only once a week
     @param user address The user to claim the rewards for
     @dev This is onlyOwner because it's supposed to be called by the admin contract only `HelperAdmin`
     */
    function claimRewardsFor(address user) external onlyOwner {
        //We update the rewards variable
        updateRewards(user, 0, true);

        //We start from the previous period
        uint256 toClaim = 0;
        while (userLastClaimPeriodStart[user] < currentPeriodStart) {
            if (totalDebtByPeriod[userLastClaimPeriodStart[user]] > 0) {
                uint256 claimablePercentage = (userDebtByPeriod[user][
                    userLastClaimPeriodStart[user]
                ] * 1e18) / totalDebtByPeriod[userLastClaimPeriodStart[user]];
                uint256 _claimableRewards = (balanceRewardsByPeriod[
                    userLastClaimPeriodStart[user]
                ] * claimablePercentage) / 1e18;
                toClaim += _claimableRewards;
            }
            userLastClaimPeriodStart[user] += blocksByPeriod;
        }

        if (toClaim > 0) {
            IERC20(qiAddr).approve(address(this), toClaim);
            IERC20(qiAddr).transferFrom(address(this), user, toClaim);
        }

        emit ClaimRewardsFor(user, toClaim);
    }

    /**
     @notice Returns the amount of rewards a user can claim
     @param user address The user to check
     @return uint256 The amount of rewards claimable for this user
     */
    function claimableRewards(address user) external view returns (uint256) {
        uint256 claimable = 0;
        if (currentUserPeriodStart[user] > 0) {
            uint256 _currentUserBlockStart = userLastClaimPeriodStart[user];
            while (_currentUserBlockStart < currentPeriodStart) {
                if (totalDebtByPeriod[_currentUserBlockStart] > 0) {
                    uint256 periodBlockStart = _currentUserBlockStart;
                    uint256 periodBlockEnd = periodBlockStart + blocksByPeriod;
                    uint256 countFrom = periodBlockStart > lastUserUpdate[user]
                        ? periodBlockStart
                        : lastUserUpdate[user];
                    uint256 claimablePercentage = ((userDebtByPeriod[user][
                        _currentUserBlockStart
                    ] + userDebt[user] * (periodBlockEnd - countFrom)) * 1e18) /
                        totalDebtByPeriod[_currentUserBlockStart];
                    uint256 _claimableRewards = (balanceRewardsByPeriod[
                        _currentUserBlockStart
                    ] * claimablePercentage) / 1e18;
                    claimable += _claimableRewards;
                }
                _currentUserBlockStart += blocksByPeriod;
            }
        }
        return claimable;
    }

    /**
     @notice Everytime the debt for a user changes, the reward calculation updates since 
     those are based on the user debt every second for each period
     @param user address The user to update
     @param debtDiff uint256 The difference compare to the previous user debt
     @param positive bool True if it adds more debt 
                          False if it remove debt
     */
    function updateRewards(
        address user,
        uint256 debtDiff,
        bool positive
    ) private {
        //Update period et user debt based on the debts up until this timestamp
        updatePeriods();
        updateUserPeriods(user);

        uint256 periodsSinceLastPeriodUpdate = (block.timestamp -
            currentPeriodStart) / blocksByPeriod;

        //Update the time updates
        currentPeriodStart += blocksByPeriod * periodsSinceLastPeriodUpdate;
        currentUserPeriodStart[user] +=
            blocksByPeriod *
            periodsSinceLastPeriodUpdate;
        lastTimeUpdate = block.timestamp;
        lastUserUpdate[user] = block.timestamp;

        //Update the current total debt and user current debt
        if (positive) {
            totalDebt += debtDiff;
            userDebt[user] += debtDiff;
        } else {
            totalDebt -= debtDiff;
            userDebt[user] -= debtDiff;
        }
    }

    /**
     @notice Update the periods debts
     */
    function updatePeriods() private {
        uint256 periodsSinceLastPeriodUpdate = (block.timestamp -
            currentPeriodStart) / blocksByPeriod;
        for (uint256 i = 0; i <= periodsSinceLastPeriodUpdate; i++) {
            uint256 periodBlockStart = currentPeriodStart +
                (i * blocksByPeriod);
            uint256 periodBlockEnd = block.timestamp <=
                periodBlockStart + blocksByPeriod
                ? block.timestamp
                : periodBlockStart + blocksByPeriod;
            if (lastTimeUpdate <= periodBlockEnd) {
                uint256 countFrom = periodBlockStart > lastTimeUpdate
                    ? periodBlockStart
                    : lastTimeUpdate;
                uint256 countTo = block.timestamp > periodBlockEnd
                    ? periodBlockEnd
                    : block.timestamp;
                totalDebtByPeriod[periodBlockStart] +=
                    totalDebt *
                    (countTo - countFrom);
            }
        }
    }

    /**
     @notice Update the periods debts for a user
     @param user address The user to update
     */
    function updateUserPeriods(address user) private {
        if (currentUserPeriodStart[user] == 0) {
            currentUserPeriodStart[user] = currentPeriodStart;
        }
        if (userLastClaimPeriodStart[user] == 0) {
            userLastClaimPeriodStart[user] = currentPeriodStart;
        }
        if (lastUserUpdate[user] == 0) {
            lastUserUpdate[user] = block.timestamp;
        }
        uint256 periodsSinceLastPeriodUpdate = (block.timestamp -
            currentUserPeriodStart[user]) / blocksByPeriod;
        for (uint256 i = 0; i <= periodsSinceLastPeriodUpdate; i++) {
            uint256 periodBlockStart = currentUserPeriodStart[user] +
                (i * blocksByPeriod);
            uint256 periodBlockEnd = block.timestamp <=
                periodBlockStart + blocksByPeriod
                ? block.timestamp
                : periodBlockStart + blocksByPeriod;
            if (lastUserUpdate[user] <= periodBlockEnd) {
                uint256 countFrom = periodBlockStart > lastUserUpdate[user]
                    ? periodBlockStart
                    : lastUserUpdate[user];
                uint256 countTo = block.timestamp > periodBlockEnd
                    ? periodBlockEnd
                    : block.timestamp;
                userDebtByPeriod[user][periodBlockStart] +=
                    userDebt[user] *
                    (countTo - countFrom);
            }
        }
    }

    /**
     @notice Function called by an external script that will update the number of rewards
     which the contract gets by period to be then shared by the users
     @param periodTimetart uint256 The period for which the rewards amount is updated
     @param amount unit256 The amount to update
     @dev This is only called by the contract's owner `HelperAdmin` which is itself called the protocol's owner
     */
    function updateRewardsBalance(uint256 periodTimetart, uint256 amount)
        external
        onlyOwner
    {
        balanceRewardsByPeriod[periodTimetart] = amount;
    }
}
