Consensys Final Project Idea

I really like the project https://app.mai.finance/ and especially the fact that one can borrow their stablecoin (MAI) at a 0% rate against different accepted assets.
It allows someone to do a lot of different things with their borrowed stable coin but what I like the most about this, is the fact that you can long your asset pretty easily (And right now you also get paid for borrowing).  
The only issue with this process is that it can be a lot of steps for the user :

1-Create vault  
2-Deposit asset A as collateral  
3-Borrow MAI with desired HF (Health Factor)  
4-Buy A with borrowed MAI  
5-Deposit A for more collateral  
6-Repeat 3,4,5 as many times as you want/can (Depending on your risk tolerance)

So my idea would be to allow a user to automate this process in one click by letting him choose how many loops and what percentage of the initial he would like to risk, that would also make it a lot easier to withdraw as the withdrawing is pretty much all the steps above but reverse.  
Of course once this is implemented this can be improved with things like auto health factor management for example.

Here is the workflow :

1 - On the first page the user is presented with all the assets available to use as collateral on https://app.mai.finance/ :  
2 - The user select the collateral he wants to long  
3 - After the selection a new interface is presented to the user where he can choose how many tokens of the selected asset he wants to use as collateral  
4 - Then the user can choose what percentage of the collateral deposited can be use to long the same asset  
5 - Then he can choose his leverage for the long (Which will trigger the number of loops to do with the steps 3,4,5 described above)  
6 - The interface should display the liquidation price once all the parameters have been selected  
7 - The user can choose to reduce his leverage or stop the long (This will trigger loops of the steps 3,4,5 described above in a reverse order)  
8 - The user ends up with more or less collateral depending on the price appreciation of the longed asset.
