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

- `Token.sol` - A mock token contract that simulates various tokens like USDC, USDT, WETH, WBTC, etc. The smart contract manages the minting and transferring of these mock tokens.
- `Dex.sol` - The key section of our project.

Let's deploy the smart contracts to the local blockchain network.

4. Run `npx hardhat ignition deploy ignition/modules/Token.js --network localhost` - This compiles `contracts/Token.sol` and deploys it to the local blockchain network, creating multiple mock tokens: USDT, USDC, DAI, WETH, WBTC, PEPE, and EIGEN.

   - Hardhat reads `Token.sol` and compiles Solidity code into bytecode and ABI (Application Binary Interface). They are stored in `artifacts` folder.
   - Information on how the contracts should be deployed is defined in `ignition/modules/Token.js`. In this file, we specify that multiple instances of `Token` should be deployed with different names and symbols.
   - Hardhat then connects to the local blockchain network (localhost:8545) and deploys the compiled contract. The transaction is sent from Account #0 (see private key).
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
Now, let's test the contracts by minting some tokens to three test accounts (Alice, Bob, and Carol). Minting is the process of creating new tokens out of thin air (ie. printing money) and assigning them to an account.

6. Run `npx hardhat run scripts/mintTokensToAccount.js --network localhost` - This mints mock tokens to test accounts (Alice, Bob, and Carol) which correspond to Account #1, #2, and #3 from the Hardhat node.

   **Amounts minted per account:**

   - **USDT, USDC, DAI, EIGEN**: 100,000 tokens each
   - **WBTC**: 100 tokens (reflecting Bitcoin's higher value)
   - **WETH**: 100 tokens (reflecting Ethereum's value)
   - **PEPE**: 10,000,000 tokens (reflecting meme coin characteristics)

   **Important:** These are the accounts you'll import into MetaMask in step 1.3.2 to interact with the DEX. Each account will have identical token balances for testing purposes.

   - The script retrieves the deployed contract addresses from `deployed_addresses.json`.
   - Address #0 (deployer) sends transactions to the Token contracts to mint tokens to Address #1 (Alice), Address #2 (Bob), and Address #3 (Carol).

   Example output (Terminal 1):

   - `From` field is Address #0, who creates the transactions
   - `To` field are the mock token contract addresses
   - `Contract call` field shows the `mint` function is called

   ```bash
   eth_sendTransaction
       Contract call:       Token#mint
       Transaction:         0x4dbb88e2a158622982113c79772c526c6358cc8f56fdea90d2304ef50a055d82
       From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
       To:                  0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
       Value:               0 ETH
       Gas used:            51297 of 30000000
       Block #4:            0xa2148c09b0c9ef77679c1ccca23edcea6e9325ce90704181d4f5db6932936678

   eth_sendTransaction
       Contract call:       Token#mint
       Transaction:         0x0c4ee2a3c3f52ff9bf48cda1e2c8e0cf2f42f44a85a0c6c2e97b5d1b9cfcc9ac
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
4. Block #4: Mint USDT to Alice (100,000 tokens)
5. Block #5: Mint USDC to Alice (100,000 tokens)
6. Block #6: Mint USDT to Bob (100,000 tokens)
7. Block #7: Mint USDC to Bob (100,000 tokens)
8. ... (continues for Carol and other tokens)

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

3. Open `.env.local` and add WalletConnect project ID:

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
   - Paste the private key of Address #1 (Alice) and click "Import". Repeat for Address #2 (Bob) and optionally Address #3 (Carol).
   - These accounts were minted with tokens in step 1.1 (Terminal 2, step 6), so they will have balances ready for trading.

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
   Deploying [ TokensModule ]

   Batch #1
   Executed TokensModule#MockUSDC
   Executed TokensModule#MockUSDT
   Executed TokensModule#MockDAI
   Executed TokensModule#MockWETH
   Executed TokensModule#MockWBTC
   Executed TokensModule#MockPEPE
   Executed TokensModule#MockEIGEN

   [ TokensModule ] successfully deployed 🚀

   Deployed Addresses

   TokensModule#MockUSDC - 0x5FbDB2315678afecb367f032d93F642f64180aa3
   TokensModule#MockUSDT - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   TokensModule#MockDAI - 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
   TokensModule#MockWETH - 0x9A676e781A523b5d0C0e43731313A708CB607508
   TokensModule#MockWBTC - 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
   TokensModule#MockPEPE - 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
   TokensModule#MockEIGEN - 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
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

## Seeding the Order Book (seedOrderBook.js)

To populate the order book with realistic trading data for testing and development:

```bash
# In your terminal under the root folder (SC4053-Project)
npm run seedOrder
```

This script will:

- Create buy and sell orders for multiple trading pairs (WBTC/USDT, USDT/WBTC, WETH/USDC, etc.)
- Generate orders with varying prices and amounts to simulate a real order book
- Automatically approve tokens and place limit orders using test accounts
- Display the order book state after seeding

**Note:** Make sure the local blockchain is running (`npm run node`) and contracts are deployed before running this script.

---

# 3. New Features

## 3.1 Portfolio Page

The portfolio page provides a comprehensive view of your token holdings with real-time pricing:

**Features:**

- **Total Assets Display**: Shows the total value of all your tokens in USD at the top of the page
- **Token Balance List**: Displays all tokens in your wallet with their balances
- **Real-Time USD Valuation**: Each token shows its USD value based on the highest bid price from the order book
- **Token Icons**: Visual representation of each token with custom images
- **Automatic Price Updates**: Prices are fetched from the DEX order book every 10 seconds
- **Multi-Pair Support**: Supports pricing from both direct (TOKEN/USDC, TOKEN/USDT) and inverse (USDC/TOKEN, USDT/TOKEN) trading pairs

**How to Access:**

1. Connect your wallet to the DEX frontend
2. Navigate to the "Portfolio" page from the header menu
3. View your token balances and total asset value in USD

**Price Calculation:**

- Prices are determined by the highest buy order (best bid) in the order book
- For tokens with inverse pairs (e.g., USDT/WBTC), the price is automatically inverted
- USDC and USDT are treated as $1.00 stablecoins

## 3.2 Trading Pair Swap

Quickly switch between trading perspectives for any token pair:

**Features:**

- **One-Click Swap**: Click the swap icon in the market header to instantly reverse the trading pair
- **Automatic Redirection**: Swaps between TOKEN1/TOKEN2 ↔ TOKEN2/TOKEN1
- **Maintains Context**: Keeps you on the same tokens, just switches base and quote
- **Order Book Inversion**: The order book updates to show the opposite perspective

**Example Use Cases:**

- View WBTC/USDT to see how much USDT you need to buy WBTC
- Swap to USDT/WBTC to see how much WBTC you can get for your USDT
- Compare liquidity and prices from both perspectives

**How to Use:**

1. Navigate to any trading pair (e.g., WBTC/USDT)
2. Click the swap icon (↔) in the market header
3. The page will reload with the inverse pair (USDT/WBTC)

## 3.3 Order Book Seeding Script

The `seedOrderBook.js` script automates the creation of realistic market data for development and testing:

**Features:**

- **Multiple Trading Pairs**: Seeds orders for WBTC, WETH, DAI, PEPE, and EIGEN against USDT/USDC
- **Realistic Price Ranges**: Creates orders with market-appropriate pricing
- **Both Sides of the Book**: Generates buy and sell orders for each pair
- **Token Approval Handling**: Automatically approves tokens before placing orders
- **Progress Reporting**: Shows which orders are being placed and their status

**How to Run:**

```bash
npm run seedOrder
```

**What it Does:**

1. Connects to the local blockchain network
2. Retrieves deployed contract addresses
3. Mints tokens to test accounts if needed
4. Approves DEX contract to spend tokens
5. Places limit orders across multiple trading pairs
6. Reports success/failure for each order

**Trading Pairs Created:**

- WBTC/USDT
- USDT/WBTC
- WETH/USDC
- DAI/USDC
- PEPE/USDT
- EIGEN/USDC

**Configuration:**
The script can be customized by editing `/scripts/seedOrderBook.js`:

- Adjust price ranges for each token
- Modify order amounts
- Add or remove trading pairs
- Change the number of orders per pair

## 3.4 Advanced Order Types

The DEX now supports multiple order types to give traders more flexibility and control:

### **Limit Order**

Place an order at a specific price that stays in the order book until filled or cancelled.

**Features:**

- Set your desired buy or sell price
- Order remains active in the order book until matched
- Can be partially filled by multiple takers
- Cancel anytime before execution
- Shows as "Limit Buy" or "Limit Sell" in order history

**Use Case:** You want to buy WETH at exactly $4000 USDC and are willing to wait for the market to reach that price.

### **Take Order**

Manually select and take a specific order from the order book for instant execution.

**Features:**

- Browse the order book and select any order
- Specify the amount you want to take
- Instant execution at the order's price
- Partially fill large orders
- Shows as "Take/Market Buy" or "Take/Market Sell" in trade history

**Use Case:** You see a specific order at $4050 in the order book that you want to take immediately.

### **Market Order**

Execute a trade instantly at the best available price in the order book.

**Features:**

- Automatically matches with the best price (lowest sell for buy, highest buy for sell)
- Instant execution
- No need to specify price
- Slippage may occur if order book is thin
- Shows as "Take/Market Buy" or "Take/Market Sell" in trade history

**Use Case:** You want to buy WETH right now at whatever the best price currently is.

### **Stop-Limit Order**

A conditional order that triggers when a stop price is reached, then places a limit order.

**Features:**

- Set a **stop price** (trigger price) and **limit price** (execution price)
- Order activates only when market reaches the stop price
- Once triggered, becomes a limit order at your specified limit price
- Shows as "Stop-Limit Buy" or "Stop-Limit Sell" in orders page
- Can be cancelled before triggering

**Use Case:** You want to buy WETH only if the price rises to $4100 (stop price), but don't want to pay more than $4120 (limit price).

**Example:**

- Current WETH price: $4000
- Stop Price: $4100
- Limit Price: $4120
- When WETH reaches $4100, your order triggers and places a limit buy at $4120

### **Order Type Comparison**

| Order Type     | Execution          | Price Control         | Use Case                             |
| -------------- | ------------------ | --------------------- | ------------------------------------ |
| **Limit**      | When price matches | Exact price           | Patient trading at desired price     |
| **Take Order** | Instant            | Select specific order | Taking a specific visible order      |
| **Market**     | Instant            | Best available        | Quick entry/exit, high urgency       |
| **Stop-Limit** | Conditional        | Stop + Limit prices   | Automated breakout/breakdown trading |

### **How to Place Orders**

1. Navigate to any trading pair page (e.g., WETH/USDC)
2. Select order type from the dropdown menu
3. Fill in the required fields:
   - **Limit Order**: Amount + Price
   - **Take Order**: Select order from book + Amount
   - **Market Order**: Amount only
   - **Stop-Limit Order**: Amount + Stop Price + Limit Price
4. Approve token spending if needed (one-time per token)
5. Confirm the transaction in MetaMask

### **Viewing Your Orders**

Navigate to the **Orders** page to see:

- **Open Orders**: Active limit and stop-limit orders waiting to be filled
- **Buy Orders**: All your active buy orders
- **Sell Orders**: All your active sell orders
- **Trade History**: Completed trades with accurate order type labels

The trade history clearly indicates:

- "Limit Buy/Sell" - Your limit orders that were filled
- "Take/Market Buy/Sell" - Orders you executed via take order or market order
- "Stop-Limit Buy/Sell" - Your triggered stop-limit orders

You can also **cancel** any open limit or stop-limit order from the Orders page before they are executed.

## 3.5 Multi-Hop Token Swap Router

The Token Swap page provides intelligent routing to swap between any two tokens, even if they don't have a direct trading pair.

**Features:**

- **Automatic Path Finding**: Uses Dijkstra's algorithm to find the optimal trading route
- **Multi-Hop Support**: Swaps through intermediate tokens automatically (e.g., DAI → USDC → WETH)
- **Best Price Guarantee**: Calculates the route that maximizes your output amount
- **Visual Route Display**: Shows the complete path with exchange rates for each hop
- **Seamless Execution**: Handles all intermediate swaps automatically in one transaction flow
- **Success Notifications**: Clear feedback showing exactly what you swapped and received

**How It Works:**

1. **Pathfinding**: The router analyzes all available trading pairs and finds the optimal route using graph algorithms to maximize your output
2. **Price Discovery**: Each step uses the best available prices from the order book to ensure favorable exchange rates
3. **Execution**: The swap executes as a series of trades across multiple pairs, automatically handling all intermediate tokens

**Example Use Case:**

Want to swap DAI for WETH but there's no direct DAI/WETH pair?

- The router finds: DAI → USDC → WETH
- Step 1: Swaps your DAI for USDC at the best DAI/USDC rate
- Step 2: Automatically swaps the received USDC for WETH at the best USDC/WETH rate
- You receive WETH in your wallet with optimal pricing

**How to Use:**

1. Navigate to the **Token Swap** page from the header menu
2. Select your **From** token (e.g., DAI)
3. Select your **To** token (e.g., WETH)
4. Enter the amount you want to swap
5. View the calculated route and expected output
6. Click **Execute Swap** to approve and complete the transaction
7. See a success banner with swap details

**Route Visualization:**

The page shows:

- Complete trading path (e.g., DAI → USDC → WETH)
- Number of hops required
- Effective exchange rate (rounded to 2 decimal places)
- Expected output amount

**Supported Features:**

- Works with all tokens in the DEX (USDT, USDC, DAI, WETH, WBTC, PEPE, EIGEN)
- Automatically approves tokens before swapping (one-time per token)
- Shows warnings when no direct pair exists
- Real-time calculation of routes when amounts change
- Clear error messages if no route is available

**Access:** Click on **Token Swap** in the navigation header to start swapping tokens with optimal routing.

## TODOs (DDL: End of Week 12)

##### Week 9 and Week 10

1. 2 Bonus parts in the project description (Bonus 1 cancelation is done, left Bonus 2 and Bonus 3)
2. Deploy on the Ethereum Testnets (Now localhost only)
3. Front-end

##### Week 10 and Week 11

1. Demo video
2. Testing and fixing bugs and modifcations on backend and frontend if needed
