// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IYieldStrategy {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function getBalance() external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function calculateRewards(uint256 amount, uint256 timeElapsed) external view returns (uint256);
}

abstract contract BaseStrategy is IYieldStrategy, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable USDT;
    address public immutable yieldOptimizer;
    
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public lastUpdateTime;
    
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userDepositTime;
    uint256 public totalShares;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event RewardsDistributed(uint256 totalRewards);
    
    modifier onlyYieldOptimizer() {
        require(msg.sender == yieldOptimizer, "Only YieldOptimizer can call");
        _;
    }
    
    constructor(address _usdt, address _yieldOptimizer) Ownable(msg.sender) {
        USDT = IERC20(_usdt);
        yieldOptimizer = _yieldOptimizer;
        lastUpdateTime = block.timestamp;
    }
    
    function deposit(uint256 amount) external virtual override onlyYieldOptimizer nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        
        USDT.transferFrom(yieldOptimizer, address(this), amount);
        
        uint256 shares = calculateShares(amount);
        userShares[tx.origin] += shares;
        userDepositTime[tx.origin] = block.timestamp;
        totalShares += shares;
        totalDeposited += amount;
        
        _afterDeposit(amount);
        
        emit Deposited(tx.origin, amount, shares);
        return shares;
    }
    
    function withdraw(uint256 amount) external virtual override onlyYieldOptimizer nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(userShares[tx.origin] > 0, "No shares to withdraw");
        
        uint256 userBalance = getUserBalance(tx.origin);
        require(amount <= userBalance, "Insufficient balance");
        
        uint256 sharesToBurn = (amount * userShares[tx.origin]) / userBalance;
        userShares[tx.origin] -= sharesToBurn;
        totalShares -= sharesToBurn;
        
        uint256 actualAmount = _beforeWithdraw(amount);
        totalWithdrawn += actualAmount;
        
        USDT.transfer(yieldOptimizer, actualAmount);
        
        emit Withdrawn(tx.origin, actualAmount, sharesToBurn);
        return actualAmount;
    }
    
    function getBalance() external view virtual override returns (uint256) {
        return USDT.balanceOf(address(this));
    }
    
    function getUserBalance(address user) public view returns (uint256) {
        if (totalShares == 0) return 0;
        uint256 totalBalance = this.getBalance();
        return (userShares[user] * totalBalance) / totalShares;
    }
    
    function calculateShares(uint256 amount) internal view returns (uint256) {
        if (totalShares == 0) return amount;
        return (amount * totalShares) / this.getBalance();
    }
    
    function calculateRewards(uint256 amount, uint256 timeElapsed) external view virtual override returns (uint256) {
        uint256 apy = getCurrentAPY();
        return (amount * apy * timeElapsed) / (365 days * 10000);
    }
    
    function _afterDeposit(uint256 amount) internal virtual {
        // Override in strategy implementations
    }
    
    function _beforeWithdraw(uint256 amount) internal virtual returns (uint256) {
        // Override in strategy implementations
        return amount;
    }
    
    function getCurrentAPY() public view virtual override returns (uint256);
}