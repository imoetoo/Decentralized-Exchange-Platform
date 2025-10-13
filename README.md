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

## Testing (seedOrders.js)

```bash
# In your terminal under the root folder (SC4053-Project)

# As I added new dependencies so need to update
npm install 
# Start the local blockchain host -port 6666
npm run node
# Mock coin deployment
npm run deploy:mock
# Dex contract deployment
npm run deploy:dex
# Then you will find the contracts and coins address under ./ignition/deployments/deployed_addresses.json
# I have written a ./scripts/address.js so it should automatic capture the address
# If works ok no need to manually inpu address

# GIVE USDC AND USDT to alice and bob; ether.getSigners() function is used to get the info for alice and bob
# First two auto generated accounts using "npm run node"
npm run mint

# Run the testing file
npm run seed
```

## TODOs (DDL: End of Week 12)

##### Week 9 and Week 10

1. 2 Bonus parts in the project description (Bonus 1 cancelation is done, left Bonus 2 and Bonus 3)
2. Deploy on the Ethereum Testnets (Now localhost only)
3. Front-end

##### Week 10 and Week 11

1. Demo video
2. Testing and fixing bugs and modifcations on backend and frontend if needed
