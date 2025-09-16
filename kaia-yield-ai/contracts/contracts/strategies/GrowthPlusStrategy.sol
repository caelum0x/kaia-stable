// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseStrategy.sol";

contract GrowthPlusStrategy is BaseStrategy {
    uint256 public constant BASE_APY = 1200; // 12% APY
    uint256 public constant VOLATILITY_MULTIPLIER = 200; // 2% volatility
    uint256 public constant MAX_CAPACITY = 500000 * 1e6; // 500K USDT capacity
    
    uint256 public currentMultiplier = 10000; // 100% in basis points
    uint256 public lastPriceUpdate;
    uint256 public volatilityIndex;
    
    constructor(address _usdt, address _yieldOptimizer) 
        BaseStrategy(_usdt, _yieldOptimizer) 
    {
        lastPriceUpdate = block.timestamp;
        volatilityIndex = 5000; // 50% initial volatility
    }
    
    function getCurrentAPY() public view override returns (uint256) {
        uint256 baseApy = BASE_APY;
        uint256 volatilityBonus = (volatilityIndex * VOLATILITY_MULTIPLIER) / 10000;
        uint256 multiplierEffect = (currentMultiplier * baseApy) / 10000;
        
        return multiplierEffect + volatilityBonus;
    }
    
    function _afterDeposit(uint256 amount) internal override {
        _updateVolatility();
        _simulateMarketConditions();
    }
    
    function _beforeWithdraw(uint256 amount) internal override returns (uint256) {
        _updateVolatility();
        _simulateMarketConditions();
        
        // Apply performance fee (1% on profits)
        uint256 timeHeld = block.timestamp - userDepositTime[tx.origin];
        if (timeHeld > 7 days) {
            uint256 potentialRewards = this.calculateRewards(amount, timeHeld);
            uint256 fee = potentialRewards / 100;
            return amount > fee ? amount - fee : amount;
        }
        
        return amount;
    }
    
    function _updateVolatility() internal {
        uint256 timeElapsed = block.timestamp - lastPriceUpdate;
        
        if (timeElapsed >= 1 hours) {
            // Simulate market volatility
            uint256 randomness = uint256(keccak256(abi.encodePacked(
                block.timestamp, 
                block.prevrandao, 
                totalDeposited
            ))) % 10000;
            
            if (randomness < 3000) { // 30% chance
                volatilityIndex = volatilityIndex > 1000 ? volatilityIndex - 1000 : 0;
            } else if (randomness > 7000) { // 30% chance
                volatilityIndex = volatilityIndex < 9000 ? volatilityIndex + 1000 : 10000;
            }
            
            lastPriceUpdate = block.timestamp;
        }
    }
    
    function _simulateMarketConditions() internal {
        uint256 utilizationRate = (totalDeposited * 10000) / MAX_CAPACITY;
        
        if (utilizationRate > 8000) {
            currentMultiplier = 9000; // Reduce returns when overutilized
        } else if (utilizationRate < 2000) {
            currentMultiplier = 11000; // Boost returns when underutilized
        } else {
            currentMultiplier = 10000; // Normal returns
        }
    }
    
    function emergencyAdjustMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier >= 5000 && newMultiplier <= 15000, "Invalid multiplier");
        currentMultiplier = newMultiplier;
    }
    
    function getStrategyStats() external view returns (
        uint256 apy,
        uint256 volatility,
        uint256 multiplier,
        uint256 utilization
    ) {
        return (
            getCurrentAPY(),
            volatilityIndex,
            currentMultiplier,
            (totalDeposited * 10000) / MAX_CAPACITY
        );
    }
}