START:

1. `run npx hardhat node`

this starts the hardhat testing development software. Copy the  account details onto mintTokenToAccount.js under testAccount

2. `npx hardhat ignition deploy ignition/modules/MockStablecoins.js --network localhost`

this runs the smart contract, and deploys it into the test blockchain. Record the addresses under mintTokenToAccount.js

3. `npx hardhat run scripts/mintTokensToAccount.js --network localhost`

this gets you the test tokens for USDC and USDT
