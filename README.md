# 1. To start

## 1.1 Backend

Two terminals will be needed.

- Terminal 1: The Blockchain 
    - "Server" that runs the blockchain network and processes transactions
    - Outputs every transaction sent to the blockchain network
    - Must stay open

- Terminal 2: The client
    - Send commands to the blockchain network (e.g., deploy smart contracts, mint tokens)
    - Can be closed after commands are executed and open as needed

We will proceed to set up terminal 1 first followed by terminal 2.

### Terminal 1: The Blockchain

1. Navigate to the root folder (`SC4053-Project`) - if not already there.

2. Run `npm install` - This installs all the necessary dependencies for the project from `package.json`.
    - One-time setup step.
    - One important dependency is `hardhat` - a development environment to compile, deploy, test, and debug Ethereum software. `ignition` is a plugin for Hardhat that simplifies contract deployment and management.

3. Run `npx hardhat node` - This creates a private Ethereum blockchain locally for testing purposes.
    - Started a server at <http://127.0.0.1:8545> (localhost: port 8545)
    - Generates 20 test accounts with 10000 ETH each. Their private keys are displayed in the terminal.

    Example output:
    ```bash
    Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

    Accounts
    ========

    WARNING: These accounts, and their private keys, are publicly known.
    Any funds sent to them on Mainnet or any other live network WILL BE LOST.

    Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
    Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

    Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
    Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

    ...
    ```

We have now set up the blockchain network. <br>
We will now set up terminal 2: The Client. Remenber to open a new terminal window and keep terminal 1 running!

### Terminal 2: The Client

The smart contracts we will be deploying are in the `contracts` folder.
- `MockStablecoin.sol` - A mock stablecoin contract that simulates real-world stablecoins like USDC and USDT. The smart contract manages the minting and transferring of these mock stablecoins.
- `Dex.sol` - The key section of our project.

Let's deploy the smart contracts to the local blockchain network.

4. Run `npx hardhat ignition deploy ignition/modules/MockStablecoins.js --network localhost` - This compiles `contracts/MockStablecoin.sol` and deploys it to the local blockchain network, creating two mock stablecoins: MockUSDC and MockUSDT.
    - Hardhat reads `MockStablecoin.sol` and compiles Solidity code into bytecode and ABI (Application Binary Interface). They are stored in `artifacts` folder.
    - Hardhat then connects to the local blockchain network (localhost:8545) and deploys the compiled contract. The transaction is sent from Account #0 (see private key). 
    - The new contracts' addressess are saved to `ignition/deployments/chain-31337/deployed_addresses.json` (31337 is Hardhat's chain ID). They will be later retrieved by other scripts.

    Example output (Terminal 1):
    ```bash
    eth_sendTransaction
        Contract deployment: MockStablecoin
        Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
        Transaction:         0x48221d40468fcd0c8e5d62454f8ee2eb8e5246b5c10d333a8c14b1c4b27fdefd
        From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        Value:               0 ETH
        Gas used:            682238 of 682238
        Block #1:            0x2cb220657a449f59f431f491953ed422ec90d0178fb5bbbf5fd37738b3e1fbe6

    eth_sendTransaction
        Contract deployment: MockStablecoin
        Contract address:    0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
        Transaction:         0x474e2abb20df03f79b8c6f7e230b89acbf0502dc748b7db35aaa32173b6cdd10
        From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        Value:               0 ETH
        Gas used:            682262 of 682262
        Block #2:            0xf51bd7cfdeadc959698fdcd94b2959d591ecd115f015b7393e890691a8586876
    ```

    Example output (Terminal 2):
    ```bash
    MockStablecoinsModule#MockUSDC - 0x5FbDB2315678afecb367f032d93F642f64180aa3
    MockStablecoinsModule#MockUSDT - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
    ```

5. Run `npx hardhat ignition deploy ignition/modules/Dex.js --network localhost` - This compiles `contracts/Dex.sol` and deploys it to the local blockchain network.
    - Similar to step 4, Hardhat reads `Dex.sol`, compiles it, and deploys it to the local blockchain network. The address is also saved to `deployed_addresses.json`.

    Example output (Terminal 1):
    ```bash
    eth_sendTransaction
        Contract deployment: Dex
        Contract address:    0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
        Transaction:         0xb045656a0ffeedcddc264b29db74f23a0364a90345d3f443fd70a137fccb8672
        From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        Value:               0 ETH
        Gas used:            1324776 of 1324776
        Block #3:            0x811ad5e70159fddf2f4045fd39f14f8b16d43e047606bcc6c31282eb3ed574bf
    ```

    Example output (Terminal 2):
    ```bash
    DexModule#Dex - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
    ```

We have successfully deployed the smart contracts to the local blockchain network. <br>
Now, let's test the contracts by minting some tokens to two test accounts (Alice and Bob). Minting is the process of creating new tokens out of thin air (ie. printing money) and assigning them to an account.

6. Run `npx hardhat run scripts/mintTokensToAccount.js --network localhost` - This mints MockUSDC and MockUSDT to two test accounts (Alice and Bob).
    - The script retrieves the deployed contract addresses from `deployed_addresses.json`.
    - Address #0 sends transactions to the MockStablecoin contracts to mint tokens to Address #1 (Alice) and Address #2 (Bob).

    Example output (Terminal 1):
    - `From` field is Address #0, who creates the transactions
    - `To` field are the mock USDC and USDT contract addresses
    - `Contract call` field shows the `mint` function is called
    ```bash
    eth_sendTransaction
        Contract call:       MockStablecoin#mint
        Transaction:         0x4dbb88e2a158622982113c79772c526c6358cc8f56fdea90d2304ef50a055d82
        From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        To:                  0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
        Value:               0 ETH
        Gas used:            51297 of 30000000
        Block #4:            0xa2148c09b0c9ef77679c1ccca23edcea6e9325ce90704181d4f5db6932936678

    eth_sendTransaction
        Contract call:       MockStablecoin#mint
        Transaction:         0xb5fea02aaec5714398fb165db4fdd17511584c48c5a675af33e04a6e4fef9e06
        From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        To:                  0x5fbdb2315678afecb367f032d93f642f64180aa3
        Value:               0 ETH
        Gas used:            51297 of 30000000
        Block #5:            0x584094e27ca010d3d452c247cbd0ccb19bce7734c2b3f23cef8bbd5db364ebb5
    
    ...
    ```

To Summarise the block numbers:
1. Block #1: Contract deployment (USDC)
2. Block #2: Contract deployment (USDT)
3. Block #3: Contract deployment (DEX)
4. Block #4: Mint USDT to Alice
5. Block #5: Mint USDC to Alice
6. Block #6: Mint USDT to Bob
7. Block #7: Mint USDC to Bob

Let's review the purpose of each folder in the repository:
```
SC4053-Project/
│
├── contracts/           ← 📝 Smart contracts source codes (Solidity)
├── ignition/            ← 🚀 Define how contracts are deployed and track current deployments
├── scripts/             ← 🔧 Interact with deployed contracts
├── artifacts/           ← 📦 Compiled contract code (auto-generated)
├── cache/               ← 💾 Compilation cache (auto-generated)
├── test/                ← 🧪 Automated unit tests for contracts (TBD)
└── dex-frontend/        ← 🌐 User interface (Next.js)
```

## 1.2 Frontend (To be cleaned)

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
