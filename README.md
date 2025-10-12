Backend:

1. `npx hardhat node`

this starts the hardhat testing development software. Copy the  account details onto mintTokenToAccount.js under testAccount

2. `npx hardhat ignition deploy ignition/modules/MockStablecoins.js --network localhost` (New terminal)

this runs the smart contract, and deploys it into the test blockchain. Record the addresses under mintTokenToAccount.js

3. `npx hardhat run scripts/mintTokensToAccount.js --network localhost`

this gets you the test tokens for USDC and USDT

Front-end:

1. Clone the repo

```bash
git clone https://github.com/ZMB000/SC4053-Project.git
cd SC4053-Project
```

2. env init (https://nodejs.org/en/download to install next.js)

```bash
npm install 
```

3. Front-end

```bash
npm run dev
```
