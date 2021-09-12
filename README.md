Consensys Final Project Idea

I have been following the project Adamant on polygon for a while, it's a yield farming aggregator that helps "farmers" to auto compound their yields.
I have also been following the flywheel curve/convex on Ethereum and I have been thinking about doing a convex like protocol for adamant.
It seems like pretty complex for a first project since convex is complex but I believe I can focus on 3 vaults only and limit the options a user has to start with.

The goal of this project would be to allow the user to auto sell his ADDYS/WMATIC rewards that adamant gives for depositing in the supported vaults for more underlying assets of the vault's LP pair.
Also it would allow to join the funds of the users wanting to lock addy and get the max APR boost on the supported vaults for bigger amounts.


Here is the workflow :

1 - On the UI the user is presented with 3 different vaults :
Basic Locked ADDY
ADDY/ETH vault
USDC/DAI vault (Gravity)
2 - The user can choose to lock his ADDY tokens for 4 years in the basic locked vault, by doing so he will get ADDY/WMATIC rewards, the ADDY rewards will be automatically vested (This is a manual step in Adamant), and the wmatic rewards will be automatically sold for USDC, once a vesting period will be over the ADDY will be sold for USDC.
3 - The user can choose to deposit into the vault ETH/ADDY, the protocol will auto claim the rewards(ADDY) = vesting period, it will auto sell the wmatic from the vesting into more ETH/ADDY and will auto deposit the vested ADDY, once a period is over, into more ETH/ADDY.
For this vault a locking period can be chosen for boosted rewards but for simplicity here the user will only be able to deposit without locking his funds.
4 - The user can choose to deposit into the vault USDC/DAI, the protocol will do the same as for the vault ETH/ADDY but instead will compound in USDC/DAI.
5 - The user will be able to withdraw his funds(Unless they are locked in the locked vault and the locking period is not over), when the user asks to withdraw his funds he will have the option to wait for 3 days and avoid a 0.5% fee or take a 0.5% fee and withdraw immediately. If the first option is chosen the auto compounding will be stopped.

Note : If a boosted vault(USDC/DAI here) has not reached the max capacity (depending on the number of ADDY locked in the contract) the boost will be applied for every user that deposited even if they have not deposited in the ADDY locked contract.
If a boosted vault has reached capacity, only the users that have deposited in the ADDY locked vault will get the boosted rewards proportionally to their deposit.

There are way more things that can be done like :
-Give the option to the user to take the 50% penalty and auto sell all the rewards for stable coins or auto sell the rewards when the vesting period is over.
-Add all the available pools on Adamant

TLDR : This project would be useful for users to optimize theirs rewards on Adamant and make it more like an "auto pilot" instead of having to claim daily + sell + stake, that would take down the number of transactions a user has to do by a decent amount, making the most of Adamant.

