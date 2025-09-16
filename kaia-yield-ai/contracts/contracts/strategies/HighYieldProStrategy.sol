// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseStrategy.sol";

contract HighYieldProStrategy is BaseStrategy {
    uint256 public constant BASE_APY = 2500; // 25% APY
    uint256 public constant MAX_CAPACITY = 200000 * 1e6; // 200K USDT capacity
    uint256 public constant LOSS_PROBABILITY = 1000; // 10% chance of loss
    uint256 public constant MAX_LOSS_PERCENTAGE = 500; // 5% max loss
    
    uint256 public performanceMultiplier = 10000; // 100%
    uint256 public lossBuffer;
    uint256 public totalProfits;
    uint256 public totalLosses;
    
    mapping(address => uint256) public userRiskScore;
    mapping(address => bool) public experiencedUser;
    
    event RiskEvent(bool isLoss, uint256 amount, uint256 affectedUsers);
    event UserQualified(address indexed user, uint256 riskScore);
    
    constructor(address _usdt, address _yieldOptimizer) 
        BaseStrategy(_usdt, _yieldOptimizer) 
    {}
    
    function getCurrentAPY() public view override returns (uint256) {
        uint256 baseApy = BASE_APY;
        
        // Performance adjustments based on recent performance
        uint256 adjustedApy = (baseApy * performanceMultiplier) / 10000;
        
        // Risk premium based on volatility
        uint256 riskPremium = calculateRiskPremium();
        
        return adjustedApy + riskPremium;
    }
    
    function calculateRiskPremium() internal view returns (uint256) {
        if (totalDeposited == 0) return 0;
        
        uint256 lossRatio = (totalLosses * 10000) / totalDeposited;
        uint256 profitRatio = (totalProfits * 10000) / totalDeposited;
        
        if (profitRatio > lossRatio * 2) {
            return 300; // 3% bonus for good performance
        } else if (lossRatio > profitRatio) {
            return 0; // No premium if losses exceed profits
        }
        
        return 150; // 1.5% standard risk premium
    }
    
    function deposit(uint256 amount) external override onlyYieldOptimizer nonReentrant returns (uint256) {
        // Require user qualification for high-risk strategy
        require(isUserQualified(tx.origin), "User not qualified for high-risk strategy");
        require(amount > 0, "Amount must be greater than 0");
        
        USDT.transferFrom(yieldOptimizer, address(this), amount);
        
        uint256 shares = calculateShares(amount);
        userShares[tx.origin] += shares;
        userDepositTime[tx.origin] = block.timestamp;
        totalShares += shares;
        totalDeposited += amount;
        
        _afterDeposit(amount);
        _executeRiskEvent();
        
        emit Deposited(tx.origin, amount, shares);
        return shares;
    }
    
    function withdraw(uint256 amount) external override onlyYieldOptimizer nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(userShares[tx.origin] > 0, "No shares to withdraw");
        
        uint256 userBalance = getUserBalance(tx.origin);
        require(amount <= userBalance, "Insufficient balance");
        
        uint256 sharesToBurn = (amount * userShares[tx.origin]) / userBalance;
        userShares[tx.origin] -= sharesToBurn;
        totalShares -= sharesToBurn;
        
        uint256 actualAmount = _beforeWithdraw(amount);
        totalWithdrawn += actualAmount;
        
        _executeRiskEvent();
        
        USDT.transfer(yieldOptimizer, actualAmount);
        
        emit Withdrawn(tx.origin, actualAmount, sharesToBurn);
        return actualAmount;
    }
    
    function _afterDeposit(uint256 amount) internal override {
        _updatePerformanceMultiplier();
    }
    
    function _beforeWithdraw(uint256 amount) internal override returns (uint256) {
        _updatePerformanceMultiplier();
        
        // Apply dynamic performance fee based on profits
        uint256 timeHeld = block.timestamp - userDepositTime[tx.origin];
        uint256 potentialRewards = this.calculateRewards(amount, timeHeld);
        
        uint256 feePercentage = calculatePerformanceFee(potentialRewards, amount);
        uint256 fee = (amount * feePercentage) / 10000;
        
        return amount > fee ? amount - fee : amount;
    }
    
    function calculatePerformanceFee(uint256 rewards, uint256 principal) internal pure returns (uint256) {
        if (rewards == 0) return 0;
        
        uint256 returnRate = (rewards * 10000) / principal;
        
        if (returnRate > 2000) { // > 20% returns
            return 200; // 2% fee
        } else if (returnRate > 1000) { // > 10% returns
            return 150; // 1.5% fee
        } else if (returnRate > 500) { // > 5% returns
            return 100; // 1% fee
        }
        
        return 50; // 0.5% minimum fee
    }
    
    function _executeRiskEvent() internal {
        uint256 randomness = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            totalDeposited,
            msg.sender
        ))) % 10000;
        
        if (randomness < LOSS_PROBABILITY && totalDeposited > 0) {
            // Loss event
            uint256 lossAmount = (totalDeposited * MAX_LOSS_PERCENTAGE) / 10000;
            
            if (lossBuffer >= lossAmount) {
                lossBuffer -= lossAmount;
            } else {
                uint256 actualLoss = lossAmount - lossBuffer;
                lossBuffer = 0;
                totalLosses += actualLoss;
                performanceMultiplier = performanceMultiplier > 1000 ? 
                    performanceMultiplier - 1000 : 5000; // Min 50%
            }
            
            emit RiskEvent(true, lossAmount, totalShares > 0 ? 1 : 0);
        } else if (randomness > 8500) {
            // Profit event
            uint256 profitAmount = (totalDeposited * 300) / 10000; // 3% profit
            totalProfits += profitAmount;
            lossBuffer += profitAmount / 2; // Half goes to loss buffer
            performanceMultiplier = performanceMultiplier < 15000 ? 
                performanceMultiplier + 500 : 15000; // Max 150%
            
            emit RiskEvent(false, profitAmount, totalShares > 0 ? 1 : 0);
        }
    }
    
    function _updatePerformanceMultiplier() internal {
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        
        if (timeElapsed >= 24 hours) {
            // Gradually return to baseline performance
            if (performanceMultiplier > 10000) {
                performanceMultiplier -= 100;
            } else if (performanceMultiplier < 10000) {
                performanceMultiplier += 100;
            }
            
            lastUpdateTime = block.timestamp;
        }
    }
    
    function qualifyUser(address user, uint256 riskScore) external onlyOwner {
        require(riskScore >= 7, "Risk score too low for this strategy");
        userRiskScore[user] = riskScore;
        experiencedUser[user] = true;
        emit UserQualified(user, riskScore);
    }
    
    function isUserQualified(address user) public view returns (bool) {
        return experiencedUser[user] && userRiskScore[user] >= 7;
    }
    
    function addLossBuffer(uint256 amount) external onlyOwner {
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        lossBuffer += amount;
    }
    
    function getStrategyMetrics() external view returns (
        uint256 apy,
        uint256 multiplier,
        uint256 profits,
        uint256 losses,
        uint256 buffer,
        uint256 riskLevel
    ) {
        return (
            getCurrentAPY(),
            performanceMultiplier,
            totalProfits,
            totalLosses,
            lossBuffer,
            8 // High risk level
        );
    }
}