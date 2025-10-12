// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Dex is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 0 for BUY, 1 for SELL
    enum actionType { BUY, SELL }

    // Order structure
    struct Order {
        uint256 id;            
        address trader;        // Address of the trader
        actionType action;     // BUY or SELL
        address base;          // Address of the base token: USDT/USDC
        address quote;         // Address of the quota token: USDT/USDC
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
}




