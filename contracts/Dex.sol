// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Dex is ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 private constant PRICE_PRECISION = 1e6; // Price precision (e.g., 1 USDC = 1,000,000 microUSDC)

    // 0 for BUY, 1 for SELL
    enum actionType { BUY, SELL }

    // Order structure
    struct Order {
        uint256 id;            
        address trader;        // Address of the trader
        actionType action;     // BUY or SELL
        address base;          // Address of the base token: USDT/USDC
        address quote;         // Address of the quote token: USDT/USDC
        uint256 amount;        
        uint256 filled;        // Amount already filled 
        uint256 price;         // Price in quote/base (e.g., USDC per USDT)
        uint256 ts;            // Timestamp of order creation
        // uint256 expiry;        // Expiry timestamp
        bool active;           
    }

    struct OrderBook {
        uint256[] buyOrders;
        uint256[] sellOrders;
    }

    // State variables
    mapping(uint256 => Order) public orders;
    mapping(bytes32 => OrderBook) private books;

    uint256 public nextOrderId;
    uint256 public feePercent;
    address public feeAccount; // Account that receives fees

    // Events
    event NewOrder(uint256 id, address trader, actionType action, address base, address quote, uint256 amount, uint256 price);
    event OrderFilled(uint256 takerId, uint256 makerId, uint256 baseAmount, uint256 quoteAmount);
    event OrderCancelled(uint256 indexed orderId);
    event OrderClosed(uint256 indexed orderId);
    // event OrderExpired(uint256 indexed orderId);

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
        nextOrderId = 1;
    }

    // Key generation for order pairs
    function _pairKey(address base, address quote) internal pure returns (bytes32) {
        return keccak256(abi.encode(base, quote));
    }

    // call for orderlist: regarding the base and quote token
    function getList(address base, address quote) external view returns (uint256[] memory, uint256[] memory) {
        bytes32 key = _pairKey(base, quote);
        OrderBook storage book = books[key];
        return (book.buyOrders, book.sellOrders);
    }

    function placeLimit(actionType action, address base, address quote, uint256 baseAmount, uint256 price) external nonReentrant returns (uint256 orderId) {
        require(base != address(0) && quote != address(0), "Invalid token address");
        require(base != quote, "Base and quote tokens must differ");
        require(baseAmount > 0 && price > 0, "Amount and price must be positive");

        if (action == actionType.SELL) {
            // for SELL order, lock base tokens
            IERC20(base).safeTransferFrom(msg.sender, address(this), baseAmount);
        } else {
            // for BUY order, lock quote tokens
            uint256 needQuote = (baseAmount * price) / PRICE_PRECISION;
            IERC20(quote).safeTransferFrom(msg.sender, address(this), needQuote);
        }
        
        // Create and store the order
        orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            action: action,
            base: base,
            quote: quote,
            amount: baseAmount,
            filled: 0,
            price: price,
            ts: block.timestamp,
            active: true
        });

        emit NewOrder(orderId, msg.sender, action, base, quote, baseAmount, price);

        // match order before adding to order book
        _matchOnPlace(orderId);
        
        // If still active (not fully filled), add to order book
        Order storage taker = orders[orderId];
        if (taker.active) {
            bytes32 key = _pairKey(base, quote);
            OrderBook storage book = books[key];
            if (action == actionType.BUY) {
                _insertBuy(book.buyOrders, orderId);
            } else {
                _insertSell(book.sellOrders, orderId);
            }
        }
    }

    // Find the correct place to insert the new buy order to keep the array sorted
    function _insertBuy(uint256[] storage arr, uint256 id) internal {
        uint256 n = arr.length;
        arr.push(id);
        while (n > 0) {
            Order storage a = orders[arr[n - 1]]; // previous order of the current position
            Order storage b = orders[id];         // the new order to insert
            // If previous order has higher price (or same price but earlier), it should stay before the new order
            bool aBeforeB = (a.price > b.price) || (a.price == b.price && a.ts <= b.ts);
            if (aBeforeB) break;
            arr[n] = arr[n - 1];
            n--;
        }
        arr[n] = id;
    }

    // Find the correct place to insert the new sell order to keep the array sorted
    function _insertSell(uint256[] storage arr, uint256 id) internal {
        uint256 n = arr.length;
        arr.push(id);
        while (n > 0) {
            Order storage a = orders[arr[n - 1]];
            Order storage b = orders[id];
            // If previous order has lower price (or same price but earlier), it should stay before the new order
            bool aBeforeB = (a.price < b.price) || (a.price == b.price && a.ts <= b.ts);
            if (aBeforeB) break;
            arr[n] = arr[n - 1];
            n--;
        }
        arr[n] = id;
    }

    // Shift elements to the left to remove an element while maintaining order
    function _orderedRemove(uint256[] storage arr, uint256 idx) internal {
        for (uint256 i = idx; i < arr.length - 1; i++) {
            arr[i] = arr[i + 1];
        }
        arr.pop();
    }

    // Find the index of an order ID in an array and shift elements to remove it
    function _removeFromBook(Order storage o) internal {
        bytes32 key = _pairKey(o.base, o.quote);
        OrderBook storage book = books[key];
        uint256[] storage arr = (o.action == actionType.BUY) ? book.buyOrders : book.sellOrders;
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == o.id) {
                _orderedRemove(arr, i);
                break;
            }
        }
    }

    function _matchOnPlace(uint256 takerId) internal {
        Order storage taker = orders[takerId];
        require(taker.active, "Taker order is not active");

        bytes32 key =_pairKey(taker.base, taker.quote);
        OrderBook storage book = books[key];

        // If taker is BUY, match with SELL orders; if taker is SELL, match with BUY orders
        uint256[] storage oppositeOrders = (taker.action == actionType.BUY) ? book.sellOrders : book.buyOrders;

        uint256 spentQuote = 0;

        // Iterate through opposite orders to find all possible matches
        uint256 i = 0;
        while (i < oppositeOrders.length && taker.active) {
            Order storage maker = orders[oppositeOrders[i]];
            // Check if the maker is active
            if (!maker.active) {
                _orderedRemove(oppositeOrders, i);
                continue;
            }

            // Check if BUY price >= SELL price, or it mean contract "force" buyer to spend more (But buyer won't put in that much funds)
            bool priceMatch = (taker.action == actionType.BUY) ? (taker.price >= maker.price) : (maker.price >= taker.price);
            if (!priceMatch) break;

            // Determine the trade amount
            uint256 takerRemain = taker.amount - taker.filled;
            uint256 makerRemain = maker.amount - maker.filled;
            uint256 tradedBase = takerRemain < makerRemain ? takerRemain : makerRemain;

            // Compute trade quote amount
            uint256 tradedQuote = (tradedBase * maker.price) / PRICE_PRECISION;

            // Calculate the amount after matching
            if (taker.action == actionType.BUY) {
                // If BUY: taker get the base, maker get the quote
                IERC20(taker.base).safeTransfer(taker.trader, tradedBase);
                // IERC20(taker.quote).safeTransfer(maker.trader, tradedQuote);
                _payoutQuoteWithFee(taker.quote, maker.trader, tradedQuote);
                spentQuote += tradedQuote;
            } else {
                // If SELL: taker get the quote, maker get the base
                // IERC20(taker.quote).safeTransfer(taker.trader, tradedQuote);
                _payoutQuoteWithFee(taker.quote, taker.trader, tradedQuote);
                IERC20(taker.base).safeTransfer(maker.trader, tradedBase);
            }

            // Update filled amounts (traded)
            taker.filled += tradedBase;
            maker.filled += tradedBase;

            emit OrderFilled(taker.id, maker.id, tradedBase, tradedQuote);

            // Check if maker is fully filled
            // SELL order does not put quote token in the contract so no refund needed (BUY order: put money; SELL order: put merchandise)
            if (maker.filled == maker.amount) {
                maker.active = false;
                _orderedRemove(oppositeOrders, i);
                emit OrderClosed(maker.id);
            } else {
                i++;
            }

            // Check if taker is fully filled
            if (taker.filled == taker.amount) {
                taker.active = false;
                emit OrderClosed(taker.id);
                
                // *Deposited total is the price that the people who place the order think they will spend
                // *But the actual spentQuote might be lower if the order is filled at a lower price based on the order book
                // *So SELL order must be spent in it's price, but BUY order depend on the actual filled price by the SELL orders
                if (taker.action == actionType.BUY) {
                    uint256 deposited = (taker.amount * taker.price) / PRICE_PRECISION;
                    if (deposited > spentQuote) {
                        // Refund unused quote tokens to taker and stay in the OrderBook
                        IERC20(taker.quote).safeTransfer(taker.trader, deposited - spentQuote);
                    }
                }
            }
        }
    }

    function cancel(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(o.active, "order inactive");
        require(o.trader == msg.sender, "not order owner");

        // Remaining amount to refund
        uint256 remainingBase = o.amount - o.filled;

        // Mark order as inactive and remove from order book
        o.active = false;
        _removeFromBook(o);

        // Refund remaining tokens
        if (remainingBase > 0) {
            // Refund "merchandis" for SELL
            if (o.action == actionType.SELL) {
                IERC20(o.base).safeTransfer(o.trader, remainingBase);
            } 
            // Refund "money" for BUY, total money spent depend on the actual filled price, not "expected" price by the 
            else {
                uint256 refundQuote = (remainingBase * o.price) / PRICE_PRECISION;
                IERC20(o.quote).safeTransfer(o.trader, refundQuote);
            }
        }

        emit OrderCancelled(orderId);
        emit OrderClosed(orderId);
    }

    function _payoutQuoteWithFee(address quoteToken, address to, uint256 gross) internal returns (uint256 net) {
        if (feePercent == 0) {
            IERC20(quoteToken).safeTransfer(to, gross);
            return gross;
        }
        uint256 fee = (gross * feePercent) / 10000; // feePercent 以 bps 计
        if (fee > 0) {
            IERC20(quoteToken).safeTransfer(feeAccount, fee);
        }
        net = gross - fee;
        IERC20(quoteToken).safeTransfer(to, net);
    }
}