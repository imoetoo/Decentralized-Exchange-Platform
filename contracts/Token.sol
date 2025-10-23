//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Mock ERC20 token for testing the DEX contract
 * Can deploy multiple instances for different tokens (USDT, USDC, DAI, WETH, WBTC, etc.)
 */
contract Token is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1000000 * 10**decimals_); // 1M tokens
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // Allow anyone to mint tokens for testing (remove in production)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    // Allow anyone to get free tokens for testing
    function faucet() external {
        _mint(msg.sender, 10000 * 10**_decimals); // 10k tokens
    }
    
    // Check balance of an account
    function checkBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }
    
    // Check multiple balances at once
    function checkBalances(address[] calldata accounts) external view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = balanceOf(accounts[i]);
        }
        return balances;
    }
}
