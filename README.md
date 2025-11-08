# SC4053 Blockchain Technology Development Project <br> <br> -------------------------------------------- <br> | &nbsp; Option 1: Decentralized Exchanges &nbsp; | <br> -------------------------------------------- 

## 1. Introduction

A Decentralized Exchange (DEX) is a blockchain-based platform that facilitates peer-to-peer trading of cryptocurrencies without the need for intermediaries. Unlike centralized exchanges, users of DEXs retain control of their private keys and funds, ensuring autonomy and minimized trust assumptions. Moreover, DEXs operate on smart contracts, which provide transparency and open security.

This project builds a robust and user-friendly DEX that supports various functionalities such as token swaps, portfolio management, and real-time order book updates. By leveraging Ethereum's blockchain technology, the DEX aims to provide a seamless trading experience while maintaining decentralization and trustlessness.

## 2. Features

### 2.1 Wallet & Network Connection

At the top right corner of the Webpage, users can connect their cryptocurrency wallets to interact with the platform. Supported wallet providers include MetaMask, WalletConnect, and Coinbase Wallet.

Users can also switch between different networks, such as Ethereum Mainnet and Optimism, to access various trading pairs and liquidity pools. To connect to Localhost, please select "Anvil".

### 2.2 Portfolio Page

The portfolio page displays all of your token holdings with real-time pricing for the chosen account and network. The pricing is based on the highest buy order (best bid) from the DEX order book, and updates automatically every 10 seconds.
 
### 2.3 Market Page

The market page displays the various trading pairs avaliable. Currently, we support the following trading pairs (as well as their inverses):
- USDC/USDT
- WETH/USDC
- WBTC/USDT
- EIGEN/USDC
- PEPE/USDT
- DAI/USDC

If we select a trading pair, we will be redirected to the trading interface for that pair, which includes the order book and Place Order form.

The Order Book shows the current buy and sell orders for the selected trading pair, allowing users to see market depth and liquidity.

In the Place Order form, users can choose from the following order types:
- **Limit Order**: Specify the price and amount to buy or sell a token. The order will be added to the order book and executed when a matching order is found.

- **Market Order**: Instantly buy or sell a token at the best available price in the order book. The order is executed immediately against existing orders.

- **Take Order**: Similar to a market order, but allows users to specify the amount they want to trade. The order will be executed against the best available prices until the specified amount is fulfilled.

- **Stop Limit Order**: Set a trigger price and a limit price. When the trigger price is reached, a limit order is placed at the specified limit price.

### 2.4 Token Swap Page

If the trading pair does not exist in the Market Page, users can still perform token swaps using the Swap feature. This feature allows users to exchange one token for another directly from their wallet without needing to create an order in the order book. DEX will automatically find the best available prices from the order book to execute the swap using Dijkstra's algorithm.

### 2.5 My Orders Page

Users can view their Open Orders, Buy Orders, Sell Orders, and Trade History on the My Orders page. Users can also cancel their open orders directly from this page.

## 3. Getting Started: Local Deployment

To start the project, we will need to set up both `3.1 Backend` (local blockchain network and smart contracts) and `3.2 Frontend` (user interface). We will cover how to connect the frontend to the backend in `3.3 Configure Frontend to connect to Local Blockchain`.

Install the following if you haven't already:

- [Node.js and npm](https://nodejs.org/en/download/) (npm is included with Node.js)
- [Git](https://git-scm.com/downloads)

For steps that needs to be run only once, they will be marked as \<One-time setup step\>.

### 3.1 Backend

Two terminals will be needed.

- Terminal 1: The Local Blockchain

  - "Server" that runs the blockchain network and processes transactions
  - Outputs every transaction sent to the blockchain network
  - Must stay open

- Terminal 2: The client
  - Send commands to the blockchain network (e.g., deploy smart contracts, mint tokens) in the form of js scripts
  - Can be closed after commands are executed and open as needed

We will proceed to set up Terminal 1 first followed by Terminal 2.

#### Terminal 1: The Local Blockchain

1. Navigate to the root folder (`SC4053-Project`) if you haven't do so.

2. Run `npm install` - This installs all the necessary dependencies for the project from `package.json`.

   - \<One-time setup step\>
   - One important dependency is `hardhat` - a development tool for Ethereum to run fake blockchains on personal computers for testing, compile and deploy smart contracts to compile, and test without spending real money. `ignition` is a plugin for Hardhat that simplifies contract deployment and management.

3. Run `npx hardhat node --hostname 127.0.0.1 --port 8545e` - This creates a private Ethereum blockchain locally for testing purposes.

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

   Alternatively, you can run the shortcut `npm run node`, which is defined in `package.json`.

We have now set up the blockchain network! <br>
We will now set up Terminal 2: The Client. Remenber to open a new terminal window and keep Terminal 1 running!

#### Terminal 2: The Client

The smart contracts we will be deploying are in the `contracts` folder.

- `Token.sol` - A mock token contract that simulates various tokens like USDC, USDT, DAI, PEPE, WBTC, WETH, and EIGEN. The smart contract defines the functions for minting and transferring these mock tokens.

- `Dex.sol` - The key section of our project. It supports functionalities such as placing limit orders, cancelling orders, and executing trades between different token pairs.

Let's compile and deploy the smart contracts to the local blockchain network! 

4. Run `npx hardhat compile` - This compiles all the smart contracts in the `contracts` folder.

   Alternatively, you can run the shortcut `npm run compile`, which is defined in `package.json`.

   - Hardhat reads the Solidity code and compiles it into bytecode and ABI (Application Binary Interface). They are stored in `artifacts` folder.

   Example output:

   ```bash
   Compiling 2 files with 0.8.18
   Compilation finished successfully
   ```

5. Run `npx hardhat ignition deploy ignition/modules/Token.js --network localhost` - This deploys multiple instances of `Token.sol` to the local blockchain network.

   Alternatively, you can run the shortcut `npm run deploy:mock`, which is defined in `package.json`.

   - Information on how the contracts should be deployed is defined in `ignition/modules/Token.js`. In this file, we specify that multiple instances of `Token` should be deployed with different names and symbols.
   - Hardhat connects to the local blockchain network (localhost:8545) and deploys the compiled contract. The transaction is sent from Account #0 (see address).
   - The new contracts' addressess are saved to `ignition/deployments/chain-31337/deployed_addresses.json` (31337 is Hardhat's chain ID). They will be later retrieved by other scripts.

   Example output (Terminal 1):

   ```bash
   eth_sendTransaction
       Contract deployment: Token
       Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
       Transaction:         0x48221d40468fcd0c8e5d62454f8ee2eb8e5246b5c10d333a8c14b1c4b27fdefd
       From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
       Value:               0 ETH
       Gas used:            682238 of 682238
       Block #1:            0x2cb220657a449f59f431f491953ed422ec90d0178fb5bbbf5fd37738b3e1fbe6

   eth_sendTransaction
       Contract deployment: Token
       Contract address:    0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
       Transaction:         0x474e2abb20df03f79b8c6f7e230b89acbf0502dc748b7db35aaa32173b6cdd10
       From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
       Value:               0 ETH
       Gas used:            682262 of 682262
       Block #2:            0xf51bd7cfdeadc959698fdcd94b2959d591ecd115f015b7393e890691a8586876
   ```

   Example output (Terminal 2):

   ```bash
   TokensModule#MockUSDC - 0x5FbDB2315678afecb367f032d93F642f64180aa3
   TokensModule#MockUSDT - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   ```

6. Run `npx hardhat ignition deploy ignition/modules/Dex.js --network localhost` - This deploys the `Dex.sol` contract to the local blockchain network.

   Alternatively, you can run the shortcut `npm run deploy:dex`, which is also defined in `package.json`.

   - Similar to step 5, Hardhat connects to the local blockchain network (localhost:8545) and deploys the compiled `Dex` contract. The transaction is sent from Account #0 (see private key). The address is also saved to `deployed_addresses.json`.

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

7. Run `hardhat run --network localhost scripts/copyDeployments.js` - This script copies the deployed contract addresses from `ignition/deployments/chain-31337/deployed_addresses.json` to `dex-frontend/src/deployed_addresses.json`. This will be useful when configuring the frontend later.

We have successfully deployed the smart contracts to the local blockchain network! <br>

To simplify the above 4 steps, we can instead run the shortcut `npm run deploy:all`, which calls the script `ignition/deployAll.js`. This script will also clean previous deployments first.

Now, let's populate the DEX with some fake data to simulate real trading activities. This is termed "seeding" the DEX.

8. Run `hardhat run --network localhost scripts/seedOrderBook.js` or the shortcut `npm run seedOrder`.    
   - It reads deployed contract addresses of DEX and token contracts from `iginition/deployment/chain-31337/deployed_addresses.json`.
   - We use account 15–19 from Hardhat to simulate traders that place orders. For each account, we allocate substantial amount of tokens of each type so that they have sufficient balances to place orders. This is termed "minting" tokens to the traders.
   - Each trader approves the DEX contract to spend their tokens on their behalf.
   - We create 12 trading pairs (6 base pairs + 6 reverse pairs) with realistic prices and amounts.
      - Base pairs: WETH/USDC, WBTC/USDT, EIGEN/USDC, PEPE/USDT, DAI/USDC, USDC/USDT
      - Reverse pairs: USDC/WETH, USDT/WBTC, USDC/EIGEN, USDT/PEPE, USDC/DAI, USDT/USDC
   - For each trading pair, we place 10 limit orders (5 buy orders + 5 sell orders) with prices and amounts that simulate a real order book. 
      - Prices are set such that there are no intersecting orders (i.e., no immediate fills).
      - Buy orders are placed below the mid price and sell orders above the mid price to create a realistic market spread.

   Example Output (Terminal 2):
   ```bash
   [dotenv@17.2.3] injecting env (0) from .env -- tip: 🗂️ backup and recover secrets: <https://dotenvx.com/ops>
   [dotenv@17.2.3] injecting env (0) from .env -- tip: 👥 sync secrets across teammates & machines: <https://dotenvx.com/ops>
   🚀 Starting Order Book Seeding...

   Traders:
   [0] 0xcd3B766CCDd6AE721141F452C550Ca635964ce71
   [1] 0x2546BcD3c84621e976D8185a91A922aE77ECEc30
   [2] 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E
   [3] 0xdD2FD4581271e230360230F9337D5c0430Bf44C0
   [4] 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199

   💰 Minting tokens to traders...
   ✅ Tokens minted

   🔓 Approving DEX for all traders...
   ✅ Approvals complete

   📊 Creating order books...

   🔷 WETH/USDC Order Book
   BUY 1 WETH @ 3920 [ID: 1]
   ...

   🟡 WBTC/USDT Order Book
   BUY 0.1 WBTC @ 118800 [ID: 11]
   ...

   🟣 EIGEN/USDC Order Book
   BUY 500 EIGEN @ 1.064 [ID: 21]
   ...

   🐸 PEPE/USDT Order Book
   BUY 100 PEPE @ 0.0000069 USDT [ID: 31]
   ...

   💚 DAI/USDC Order Book
   BUY 1000 DAI @ 0.998 [ID: 41]
   ...

   💵 USDC/USDT Order Book
   BUY 1000 USDC @ 0.9995 [ID: 51]
   ...

   💵 USDT/USDC Order Book
   BUY 1000 USDT @ 0.9995 [ID: 61]
   ...

   🔷 USDC/WETH Order Book (Reverse)
   BUY 4000 USDC @ 0.000245 WETH each [ID: 71]
   ...

   ... (similar output for other reverse pairs) ...

   ✅ Order book seeding complete!

   📊 Summary:

   - 12 trading pairs populated (6 base pairs + 6 reverse pairs)

   ✅ Order Book Seeding Complete!

   - Total: 120 orders created
   - All orders non-intersecting (no immediate fills)
   - Realistic market spreads maintained

   🎯 Trading pairs ready:
   Base pairs:
      - WETH/USDC (~$4,000)
      ...
   Reverse pairs:
      - USDC/WETH
      ...
   ```

9. Run `hardhat run --network localhost scripts/mintTokensToAccount.js` or the shortcut `npm run mint`.    
   - This mints mock tokens to Account #1 (Alice), Account #2 (Bob), and Account #3 (Carol) for testing purposes.
   - You may use these accounts to interact with the DEX frontend later.

Let's review the purpose of each folder in the repository:

```
SC4053-Project/
│
├── artifacts/           ← Bytecode and ABI compiled from contract Solidity code (auto-generated)
├── cache/               ← Compilation cache (auto-generated)
├── contracts/           ← Smart contracts source codes (Solidity)
├── dex-frontend/        ← User interface (Next.js)
├── ignition/            ← Define how contracts are deployed and track current deployments
|    ├── deployments/    ← Track deployed contract addresses
|    └── modules/        ← Define how each contract is deployed
└── scripts/             ← Interact with deployed contracts
```

### 3.2 Frontend

A third terminal will be needed.

- Terminal 3: The Frontend
  - Runs the Next.js development server to serve the frontend interface
  - Must stay open

We will now set up the frontend to interact with the smart contracts deployed on the local blockchain network (no more command prompt!). <br>

1. Navigate to `dex-frontend` folder

2. Run `New-Item .env.local` - This creates a new environment variable file `.env.local` in the `dex-frontend` folder. Alternatively, you can create the file manually using a text editor.

   - \<One-time setup step\>

3. Open `.env.local` and add WalletConnect project ID:

   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=//
   ```

   Replace `//` with your own WalletConnect project ID. You can create a free account and get a project ID at <https://cloud.walletconnect.com/>. Make sure there are no spaces before or after the `=` sign.

   - \<One-time setup step\>

4. Run `npm install` - This installs all the necessary dependencies for the frontend from `package.json`.

   - \<One-time setup step\>
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

6. Once compiled, you can open your web browser and navigate to <http://localhost:3000> - This opens the frontend interface of the DEX application.

### 3.3 Configure Frontend to connect to Local Blockchain

Before we begin, let's clarify on some terminologies / concepts that we will be using:

- <b>Etherem Wallet</b> <br>
  A software application that manages an Extenally Owned Account (EOA) on the Ethereum blockchain. It stores the private key that allows users to access and manage their Ethereum assets and provides an user interface for interacting with the blockchain.

- <b>MetaMask</b> <br>
  A popular Ethereum (software) wallet that is available as a browser extension and mobile app. It allows users to manages multiple EOAs, interact with decentralized applications (dApps), and sign transactions.

- <b>WalletConnect</b> <br>
  An open-source protocol for websites to connect to multiple types of wallets, not just MetaMask.

In this tutorial, we will be using MetaMask as our Ethereum wallet to connect to the local blockchain network and interact with the DEX frontend. Ensure that you have MetaMask installed as a browser extension. You can download it from <https://metamask.io/download.html>.

1. Open Metamask, click on the network dropdown at the top, and select "Add Network" -> "Add Network manually". Enter the following details to add the local blockchain network:

   ```
   Network name:     Hardhat Local
   RPC URL:          http://127.0.0.1:8545
   Chain ID:         31337
   Currency symbol:  ETH
   ```

   Click "Save" to add the network. You can safely ignore any warnings.

2. Import test accounts (Account #1, #2, #3) of your choice into MetaMask using their private keys displayed in Terminal 1 when you started the local blockchain network.

   - Click on the account icon at the top right corner of MetaMask and select "Import Account".
   - Paste the private key of the account you want to import and click "Import".


3. For each account, add the mock tokens that you wish to see. Click on "Import tokens", switch tab to "Custom Token", select "Hardhat Local" network, and enter the addresses for the mock tokens deployed earlier (you can find them in `ignition/deployments/chain-31337/deployed_addresses.json` or under Terminal 2).

4. Navigate to top left corner of https://localhost:3000 and connect your MetaMask wallet to the frontend.

You have now successfully connected the DEX frontend to the local blockchain network! You can now interact with the DEX using the imported accounts and test tokens!

Author: Phua Guan Yuan, Wu Meng Jun, Le Yanzhi <br>
NTU AY2025/26 Semester 1



 