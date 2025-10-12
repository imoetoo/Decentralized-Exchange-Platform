```bash
git clone https://github.com/ZMB000/SC4053-Project.git
cd SC4053-Project
```

Backend: (Under root folder: SC4053-PROJECT)

`npm install`

1. `npx hardhat node`

this starts the hardhat testing development software. Copy the account details onto mintTokenToAccount.js under testAccount

2. `npx hardhat ignition deploy ignition/modules/MockStablecoins.js --network localhost` (New terminal)

this runs the smart contract, and deploys it into the test blockchain. Record the addresses under mintTokenToAccount.js

3. `npx hardhat run scripts/mintTokensToAccount.js --network localhost`

this gets you the test tokens for USDC and USDT

Front-end: (Under dex-frontend folder, `cd dex-frontend` first)

1. env init (https://nodejs.org/en/download to install next.js)

```bash
npm install  
```

2. Front-end

```bash
npm run dev
```

**NOTE THAT FRONTEND AND BACKEND IS SEPERATED SO CD TO dex-frontend TO RUN FRONTEND**
**There will be two `package.json` and two `package-lock.json`**
**⚠️ Do not commit changes to `package.json` or `package-lock.json` if you haven't intentionally added, removed, or updated any dependencies.**
**(Small difference is possible, due to different version npm, name of local root folders and so on...)**