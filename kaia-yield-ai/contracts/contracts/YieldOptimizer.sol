// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./strategies/BaseStrategy.sol";

contract YieldOptimizer is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct YieldStrategy {
        uint256 id;
        string name;
        address strategy;
        uint256 apy;
        uint256 riskLevel;
        uint256 minDeposit;
        uint256 maxDeposit;
        bool active;
    }

    struct UserDeposit {
        uint256 amount;
        uint256 strategyId;
        uint256 depositTime;
        uint256 lastRewardTime;
        uint256 accumulatedRewards;
    }

    struct AIRecommendation {
        uint256 strategyId;
        uint256 confidence;
        uint256 timestamp;
        string reason;
    }

    IERC20 public immutable USDT;
    
    mapping(uint256 => YieldStrategy) public strategies;
    mapping(address => UserDeposit[]) public userDeposits;
    mapping(address => AIRecommendation) public aiRecommendations;
    mapping(address => uint256) public userRiskTolerance;
    mapping(address => uint256) public userReputationScore;
    
    uint256 public strategyCounter;
    uint256 public totalValueLocked;
    uint256 public constant MAX_STRATEGIES = 10;
    uint256 public constant MIN_RISK_LEVEL = 1;
    uint256 public constant MAX_RISK_LEVEL = 10;

    event StrategyAdded(uint256 indexed strategyId, string name, uint256 apy);
    event DepositMade(address indexed user, uint256 amount, uint256 strategyId);
    event WithdrawalMade(address indexed user, uint256 amount, uint256 strategyId);
    event RewardsDistributed(address indexed user, uint256 amount);
    event AIRecommendationUpdated(address indexed user, uint256 strategyId, uint256 confidence);
    event RiskToleranceUpdated(address indexed user, uint256 riskLevel);

    modifier validStrategy(uint256 _strategyId) {
        require(_strategyId > 0 && _strategyId <= strategyCounter, "Invalid strategy ID");
        require(strategies[_strategyId].active, "Strategy not active");
        _;
    }

    modifier validRiskLevel(uint256 _riskLevel) {
        require(_riskLevel >= MIN_RISK_LEVEL && _riskLevel <= MAX_RISK_LEVEL, "Invalid risk level");
        _;
    }

    constructor(address _usdt) Ownable(msg.sender) {
        USDT = IERC20(_usdt);
    }

    function addStrategy(
        string memory _name,
        address _strategy,
        uint256 _apy,
        uint256 _riskLevel,
        uint256 _minDeposit,
        uint256 _maxDeposit
    ) external onlyOwner validRiskLevel(_riskLevel) {
        require(strategyCounter < MAX_STRATEGIES, "Max strategies reached");
        require(_strategy != address(0), "Invalid strategy address");
        require(_apy > 0, "APY must be greater than 0");
        require(_minDeposit > 0, "Min deposit must be greater than 0");
        require(_maxDeposit > _minDeposit, "Max deposit must be greater than min");

        // Verify the strategy contract implements the interface
        try IYieldStrategy(_strategy).getCurrentAPY() returns (uint256) {
            // Strategy contract is valid
        } catch {
            revert("Invalid strategy contract");
        }

        strategyCounter++;
        strategies[strategyCounter] = YieldStrategy({
            id: strategyCounter,
            name: _name,
            strategy: _strategy,
            apy: _apy,
            riskLevel: _riskLevel,
            minDeposit: _minDeposit,
            maxDeposit: _maxDeposit,
            active: true
        });

        emit StrategyAdded(strategyCounter, _name, _apy);
    }

    function deposit(uint256 _amount, uint256 _strategyId) 
        external 
        nonReentrant 
        whenNotPaused 
        validStrategy(_strategyId) 
    {
        require(_amount > 0, "Amount must be greater than 0");
        YieldStrategy memory strategy = strategies[_strategyId];
        require(_amount >= strategy.minDeposit, "Amount below minimum deposit");
        require(_amount <= strategy.maxDeposit, "Amount exceeds maximum deposit");

        uint256 userRisk = userRiskTolerance[msg.sender];
        if (userRisk > 0) {
            require(strategy.riskLevel <= userRisk, "Strategy exceeds user risk tolerance");
        }

        USDT.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Approve and deposit to strategy contract
        USDT.approve(strategy.strategy, _amount);
        
        try IYieldStrategy(strategy.strategy).deposit(_amount) returns (uint256 shares) {
            userDeposits[msg.sender].push(UserDeposit({
                amount: _amount,
                strategyId: _strategyId,
                depositTime: block.timestamp,
                lastRewardTime: block.timestamp,
                accumulatedRewards: 0
            }));

            totalValueLocked += _amount;
            userReputationScore[msg.sender] += 1;

            emit DepositMade(msg.sender, _amount, _strategyId);
        } catch {
            revert("Strategy deposit failed");
        }
    }

    function withdraw(uint256 _depositIndex) external nonReentrant {
        require(_depositIndex < userDeposits[msg.sender].length, "Invalid deposit index");
        
        UserDeposit storage userDeposit = userDeposits[msg.sender][_depositIndex];
        require(userDeposit.amount > 0, "Deposit already withdrawn");

        uint256 rewards = calculateRewards(msg.sender, _depositIndex);
        uint256 totalAmount = userDeposit.amount + rewards;

        // Withdraw from strategy contract
        YieldStrategy memory strategy = strategies[userDeposit.strategyId];
        
        try IYieldStrategy(strategy.strategy).withdraw(userDeposit.amount) returns (uint256 actualAmount) {
            totalValueLocked -= userDeposit.amount;
            userDeposit.amount = 0;
            userDeposit.accumulatedRewards += rewards;

            USDT.safeTransfer(msg.sender, actualAmount + rewards);

            emit WithdrawalMade(msg.sender, actualAmount + rewards, userDeposit.strategyId);
            if (rewards > 0) {
                emit RewardsDistributed(msg.sender, rewards);
            }
        } catch {
            revert("Strategy withdrawal failed");
        }
    }

    function calculateRewards(address _user, uint256 _depositIndex) public view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[_user][_depositIndex];
        if (userDeposit.amount == 0) return 0;

        YieldStrategy memory strategy = strategies[userDeposit.strategyId];
        uint256 timeElapsed = block.timestamp - userDeposit.lastRewardTime;
        uint256 annualReward = (userDeposit.amount * strategy.apy) / 10000;
        uint256 reward = (annualReward * timeElapsed) / 365 days;

        return reward;
    }

    function setUserRiskTolerance(uint256 _riskLevel) external validRiskLevel(_riskLevel) {
        userRiskTolerance[msg.sender] = _riskLevel;
        emit RiskToleranceUpdated(msg.sender, _riskLevel);
    }

    function updateAIRecommendation(
        address _user,
        uint256 _strategyId,
        uint256 _confidence,
        string memory _reason
    ) external onlyOwner validStrategy(_strategyId) {
        require(_confidence <= 100, "Confidence must be <= 100");
        
        aiRecommendations[_user] = AIRecommendation({
            strategyId: _strategyId,
            confidence: _confidence,
            timestamp: block.timestamp,
            reason: _reason
        });

        emit AIRecommendationUpdated(_user, _strategyId, _confidence);
    }

    function getOptimalStrategy(address _user) external view returns (uint256, uint256) {
        AIRecommendation memory recommendation = aiRecommendations[_user];
        if (recommendation.strategyId > 0 && recommendation.confidence >= 70) {
            return (recommendation.strategyId, recommendation.confidence);
        }

        uint256 userRisk = userRiskTolerance[_user];
        if (userRisk == 0) userRisk = 5;

        uint256 bestStrategy = 0;
        uint256 bestScore = 0;

        for (uint256 i = 1; i <= strategyCounter; i++) {
            YieldStrategy memory strategy = strategies[i];
            if (!strategy.active || strategy.riskLevel > userRisk) continue;

            uint256 score = (strategy.apy * 100) / strategy.riskLevel;
            if (score > bestScore) {
                bestScore = score;
                bestStrategy = i;
            }
        }

        return (bestStrategy, bestScore);
    }

    function getUserDeposits(address _user) external view returns (UserDeposit[] memory) {
        return userDeposits[_user];
    }

    function getStrategy(uint256 _strategyId) external view returns (YieldStrategy memory) {
        return strategies[_strategyId];
    }

    function getAllStrategies() external view returns (YieldStrategy[] memory) {
        YieldStrategy[] memory allStrategies = new YieldStrategy[](strategyCounter);
        for (uint256 i = 1; i <= strategyCounter; i++) {
            allStrategies[i - 1] = strategies[i];
        }
        return allStrategies;
    }

    function updateStrategyStatus(uint256 _strategyId, bool _active) external onlyOwner {
        require(_strategyId > 0 && _strategyId <= strategyCounter, "Invalid strategy ID");
        strategies[_strategyId].active = _active;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = USDT.balanceOf(address(this));
        USDT.safeTransfer(owner(), balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}