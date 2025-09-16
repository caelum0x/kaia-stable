// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseStrategy.sol";

contract StableEarnStrategy is BaseStrategy {
    uint256 public constant BASE_APY = 500; // 5% APY
    uint256 public constant MAX_CAPACITY = 1000000 * 1e6; // 1M USDT capacity
    
    uint256 public rewardPool;
    uint256 private lastRewardDistribution;
    
    constructor(address _usdt, address _yieldOptimizer) 
        BaseStrategy(_usdt, _yieldOptimizer) 
    {
        lastRewardDistribution = block.timestamp;
    }
    
    function getCurrentAPY() public view override returns (uint256) {
        uint256 utilizationRate = (totalDeposited * 10000) / MAX_CAPACITY;
        
        if (utilizationRate > 8000) { // > 80% utilization
            return BASE_APY - 100; // Reduce APY when near capacity
        } else if (utilizationRate < 2000) { // < 20% utilization
            return BASE_APY + 100; // Boost APY when low utilization
        }
        
        return BASE_APY;
    }
    
    function _afterDeposit(uint256 amount) internal override {
        _distributeRewards();
    }
    
    function _beforeWithdraw(uint256 amount) internal override returns (uint256) {
        _distributeRewards();
        return amount;
    }
    
    function _distributeRewards() internal {
        uint256 timeElapsed = block.timestamp - lastRewardDistribution;
        
        if (timeElapsed >= 1 hours && totalDeposited > 0) {
            uint256 rewards = (totalDeposited * getCurrentAPY() * timeElapsed) / (365 days * 10000);
            
            if (rewards > 0) {
                rewardPool += rewards;
                lastRewardDistribution = block.timestamp;
                emit RewardsDistributed(rewards);
            }
        }
    }
    
    function addRewards(uint256 amount) external onlyOwner {
        USDT.transferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
    }
    
    function getBalance() external view override returns (uint256) {
        return USDT.balanceOf(address(this)) + rewardPool;
    }
}