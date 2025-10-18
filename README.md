# 1. To start
To start the project, we will need to set up both `1.1 Backend` (blockchain network and smart contracts) and `1.2 Frontend` (user interface). We will cover how to connect the frontend to the backend in `1.3 Configure Frontend to connect to Local Blockchain`.

Install the following if you haven't already:
- [Node.js and npm](https://nodejs.org/en/download/) (npm is included with Node.js)
- [Git](https://git-scm.com/downloads)

For steps that needs to be run only once, they will be marked as `One-time setup step.`

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
    - One important dependency is `hardhat` - a development tool for Ethereum to run fake blockchains on personal computers for testing, compile and deploy smart contracts to compile, and test without spending real money. `ignition` is a plugin for Hardhat that simplifies contract deployment and management.

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

We have now set up the blockchain network! <br>
We will now set up terminal 2: The Client. Remenber to open a new terminal window and keep terminal 1 running!

### Terminal 2: The Client

The smart contracts we will be deploying are in the `contracts` folder.
- `MockStablecoin.sol` - A mock stablecoin contract that simulates real-world stablecoins like USDC and USDT. The smart contract manages the minting and transferring of these mock stablecoins.
- `Dex.sol` - The key section of our project.

Let's deploy the smart contracts to the local blockchain network.

4. Run `npx hardhat ignition deploy ignition/modules/MockStablecoins.js --network localhost` - This compiles `contracts/MockStablecoin.sol` and deploys it to the local blockchain network, creating two mock stablecoins: MockUSDC and MockUSDT.
    - Hardhat reads `MockStablecoin.sol` and compiles Solidity code into bytecode and ABI (Application Binary Interface). They are stored in `artifacts` folder.
    - Information on how the contracts should be deployed is defined in `ignition/modules/MockStablecoins.js`. In this file, we specify that two instances of `MockStablecoin` should be deployed with the names `MockUSDC` and `MockUSDT`.
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
    - Similar to step 4, Hardhat reads `Dex.sol`, compiles it, and deploys it to the local blockchain network according to the rules defined in `ignition/modules/Dex.js`. The address is also saved to `deployed_addresses.json`.

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
├── artifacts/           ← 📦 Bytecode and ABI compiled from contract Solidity code (auto-generated)
├── cache/               ← 💾 Compilation cache (auto-generated)
├── contracts/           ← 📝 Smart contracts source codes (Solidity)
├── dex-frontend/        ← 🌐 User interface (Next.js)
├── ignition/            ← 🚀 Define how contracts are deployed and track current deployments
|    ├── deployments/     ← 📂 Track deployed contract addresses
|    └── modules/         ← 📄 Define how each contract is deployed
├── scripts/             ← 🔧 Interact with deployed contracts
└── test/                ← 🧪 Automated unit tests for contracts (TBD)
```

## 1.2 Frontend 

A third terminal will be needed.

- Terminal 3: The Frontend
  - Runs the Next.js development server to serve the frontend interface
  - Must stay open

We will now set up the frontend to interact with the smart contracts deployed on the local blockchain network (no more command prompt!). <br>

1. Navigate to `dex-frontend` folder

2. Run `New-Item .env.local` - This creates a new environment variable file `.env.local` in the `dex-frontend` folder. Alternatively, you can create the file manually using a text editor.
    - One-time setup step.

3. Open  `.env.local` and add WalletConnect project ID:
    ```env
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=//
    ```
    Replace `//` with your own WalletConnect project ID. You can create a free account and get a project ID at <https://cloud.walletconnect.com/>. Make sure there are no spaces before or after the `=` sign. 
    - One-time setup step.

4. Run `npm install` - This installs all the necessary dependencies for the frontend from `package.json`.
    - One-time setup step.
    - One important dependency is `next` - a React framework that enables functionality such as server-side rendering and generating static websites for React based web applications.

5. Run `npm run dev` - This starts the Next.js development server.
    - The terminal will display the local URL (usually <http://localhost:3000>) where the frontend can be accessed.

    Example output:
    ```bash
    > dex-frontend@0.1.0 dev
    > next dev --turbopack

    ▲ Next.js 15.5.3 (Turbopack)

    - Local:        <http://localhost:3000>
    - Network:      <http://192.168.0.26:3000>
    - Environments: .env.local

    ✓ Starting...
    ✓ Ready in 18.5s
     ○ Compiling / ...
    ✓ Compiled / in 19.2s
    WalletConnect Project ID: 9a14c793f86e4b92688646de57bb8fed
    Lit is in dev mode. Not recommended for production! See <https://lit.dev/msg/dev-mode> for more information.
    ```

6. Open your web browser and navigate to <http://localhost:3000> - This opens the frontend interface of the DEX application.


## 1.3 Configure Frontend to connect to Local Blockchain

Before we begin, let's clarify on some terminologies / concepts that we will be using:
 - <b>Etherem Wallet</b> <br>
 A software application that manages an Extenally Owned Account (EOA) on the Ethereum blockchain. It stores the private key that allows users to access and manage their Ethereum assets and provides an user interface for interacting with the blockchain.

- <b>MetaMask</b> <br>
A popular Ethereum (software) wallet that is available as a browser extension and mobile app. It allows users to manages multiple EOAs, interact with decentralized applications (dApps), and sign transactions.

- <b>WalletConnect</b> <br>
An open-source protocol for websites to connect to multiple types of wallets, not just MetaMask.

To begin, ensure that you have MetaMask installed as a browser extension. You can download it from <https://metamask.io/download.html>.

1. Open Metamask, click on the network dropdown at the top, and select "Add Network" -> "Add Network manually". Enter the following details to add the local blockchain network:
    ```
    Network name:     Hardhat Local
    RPC URL:          http://127.0.0.1:8545
    Chain ID:         31337
    Currency symbol:  ETH
    ```
    Click "Save" to add the network. You can safely ignore any warnings.

2. Import test accounts (Alice and Bob) into MetaMask using their private keys displayed in Terminal 1 when you started the local blockchain network.
    - Click on the account icon at the top right corner of MetaMask and select "Import Account".
    - Paste the private key of Address #1 (Alice) and click "Import". Repeat for Address #2 (Bob). 

    Example private keys from Terminal 1:
    ```
    Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
    Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

    Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
    Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

    Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
    Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
    ```

3. Add MockUSDC and MockUSDT tokens to MetaMask for both Alice and Bob. For each account, click on "Import tokens", switch tab to "Custom Token", select "Hardhat Local" network, and enter the addresses for USDT and USDC as displayed in Terminal 2 when you deployed the mock stablecoin contracts.

    Example addresses from Terminal 2:
    ```
    Deploying [ MockStablecoinsModule ]

    Batch #1
    Executed MockStablecoinsModule#MockUSDC
    Executed MockStablecoinsModule#MockUSDT

    [ MockStablecoinsModule ] successfully deployed 🚀

    Deployed Addresses

    MockStablecoinsModule#MockUSDC - 0x5FbDB2315678afecb367f032d93F642f64180aa3
    MockStablecoinsModule#MockUSDT - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
    ```

4. Navigate to top left corner of https://localhost:3000 and connect your MetaMask wallet to the frontend.

<br>

    

# 2. Notes

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
