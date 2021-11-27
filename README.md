# Final project - Mai Finance Helper

## Deployed version url:

https://sharkam.github.io/blockchain-developer-bootcamp-final-project/

Warning! this front end uses the contracts deployed on polygon mainnet.
I deployed on polygon mainnet because this dapp relies extensively on external contracts (Mai finance) and those contracts
are only deployed on mainnet from I was able to gather from the QiDAO team.
You can test out the whole protocol locally forking the polygon mainnet though (See next instructions).

## How to run this project locally:

### Prerequisites

-   Node.js >= v12.22.5
-   Truffle and Ganache
-   Npm
-   `git checkout main`

### Contracts

-   Run `npm install` in project root to install Truffle build and smart contract dependencies
-   Run local testnet on port `7545` with network id setup to 1337 forking the polygon mainnet(I used alchemy api for the fork, you'll need an API Key for polygon mainnet) :
-   `ganache-cli --fork https://polygon-mainnet.g.alchemy.com/v2/[YOUR-API] -p 7545 --networkId 1337` (You can get an API key at https://dashboard.alchemyapi.io/)
-   `truffle test`
-   `development` network id is 1337, remember to change it in Metamask as well!

## Environment variables to run `truffle test` in your local .env file

You need to add the public/private keys from the first account generated by ganache in your .env, those are needed to execute swaps on Quickswap.

```
TEST_WALLET_PUBLIC_KEY=
TEST_WALLET_PRIVATE_KEY=
```

### Frontend

-   `cd client`
-   `npm install`
-   `npm start`
-   Open `http://localhost:3000`

### Test the UI with the LINK vault

-   `truffle migrate`
-   `truffle test` : The tests ends with some link in the wallet accounts[0] generated by ganache, you'll need to use the same address for your tests on the Frontend.
-   `cd client && npm start`
-   Open local UI from `http://localhost:3000`
-   Make sure your Metamask localhost network is on port `7545` and chain id is `1337`.
-   Import the first address generated by ganache in your metamask using the private key shown by ganache.
-   If you get `TXRejectedError` when sending a transaction, reset your Metamask account from Advanced settings.
-   When you open the link vault you should see a link balance, it has been added when executing the tests.
-   You can then start by creating a vault and longing some link

## Screencast link

https://www.youtube.com/watch?v=zlxAGToX7yk

## Public Ethereum wallet for certification:

`0xb52b4bd16D32e84Fa74f8CC46F4B6546a095bBc4`

## Project description

This project is built on top of https://app.mai.finance/.
It allows a user to borrow stable coins(MAI) against a chosen collateral asset at a 0% rate + gain weekly rewards for borrowing.
This also allows someone to long an asset, the only problem with longing an asset using this method is that it is a tedious task :

1-Create vault  
2-Deposit asset A as collateral  
3-Borrow MAI with desired HF (Health Factor)  
4-Buy A with borrowed MAI  
5-Deposit A for more collateral  
6-Repeat 3,4,5 as many times as you want/can (Depending on your risk tolerance)

This project aims to allow a user to automate this process in one click by letting him choose his leverage and what percentage of the initial he would like to risk, this also makes it a lot easier to withdraw as the withdrawing part is pretty much all the steps above but in a reverse order.

## Workflow

1 - On the first page the user is presented with some of the assets available to use as collateral on https://app.mai.finance/
2 - The user connects to the Web site using his Metamask
3 - The user select the collateral he wants to long  
4 - The user creates a vault for this collateral (Those are MAI finance vaults)
5 - After creating a vault, the user can choose how many tokens of the selected asset he wants to use as collateral  
6 - Then he can choose his leverage for the long
7 - The interface display the liquidation price once all the parameters have been selected  
8 - The user can choose to reduce his leverage or stop the long by repaying the full debt amount
9 - The user ends up with more or less collateral depending on the price appreciation of the longed asset

## Scheduled workflow for rewards

1. Run scheduled contract weekly to update the amount of rewards available (Manually for now, to be implemented with chainlink keepers)
2. The user will see his amount of rewards claimable once it has been updated in the contract
3. If the amount is bigger than 0, the user can click on the claim button

## Directory structure

-   `client`: Project's React frontend.
-   `contracts`: Smart contracts, only can be tested locally with a polygon mainnet fork since a lot of mandatory contracts are only deployed on polygon mainnet.
-   `migrations`: Migration files for deploying contracts in `contracts` directory.
-   `test`: Tests for smart contracts.

## TODO features

-   Give the choice to the user to automatically stake his Qi rewards in Mai finance
-   Give the choice to the user to withdraw the Mai finance NFT vault to get the ownership
-   Add missing vault types
-   Optimize how to swap the assets for the flash loan
-   Add chainlink keepers to automate the update of the variable `balanceRewardsByPeriod`