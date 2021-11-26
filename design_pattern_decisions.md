# Design patterns used

## Access Control Design Patterns

-   `Ownable` design pattern used in three functions: `claimRewardsFor()`, `updateRewardsBalance()` and `updatePeriodReward()`.
    `updateRewardsBalance()` and `updatePeriodReward()` are called only by the contract creator to update the reward airdrop for a specific period, i.e.
    `claimRewardsFor()` is onwned by the admin contract `HelperAdmin` and is called by the external function `claimRewards`, this is design that way so the user can claim the rewards from all the vault type he's part of in one transaction instead of doing one transaction by vault type.

## Inheritance and Interfaces

-   `HelperAdmin` and `VaultLongMaiFinanceBase` contracts inherits the OpenZeppelin `Ownable` contract to enable ownership for one managing user/party.
-   `VaultLongMaiFinanceBase` is an abstract contract and all the vault types such as `WethVaultLong`, `GhstVaultLong` etc... inherits from it.

## Inter-Contract Execution

-   `VaultLongMaiFinanceBase` make use extensivly of the Mai finance vaults contracts since this protocol is built on top of it i.e `IERC20StableCoin(maiVault).createVault()`, it also uses aave flash loans contracts.

## Upgradable Contracts

-   Only one variable is upgradable by the owner : `balanceRewardsByPeriod` which specify how much rewards are to be distributed for a specific period.
