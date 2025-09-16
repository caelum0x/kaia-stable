// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameRewards is Ownable, ReentrancyGuard {
    struct Mission {
        uint256 id;
        string name;
        string description;
        uint256 reward;
        uint256 difficulty;
        uint256 duration;
        bool active;
    }

    struct UserMission {
        uint256 missionId;
        uint256 progress;
        uint256 startTime;
        bool completed;
        bool claimed;
    }

    struct LeaderboardEntry {
        address user;
        uint256 score;
        uint256 timestamp;
    }

    IERC20 public rewardToken;
    
    mapping(uint256 => Mission) public missions;
    mapping(address => mapping(uint256 => UserMission)) public userMissions;
    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public userLevel;
    mapping(address => uint256) public dailyStreak;
    mapping(address => uint256) public lastActivity;
    mapping(address => bool) public socialBonus;
    
    LeaderboardEntry[] public leaderboard;
    uint256 public missionCounter;
    uint256 public constant POINTS_PER_LEVEL = 1000;
    uint256 public constant DAILY_STREAK_BONUS = 50;
    uint256 public constant SOCIAL_BONUS_MULTIPLIER = 120;

    event MissionCreated(uint256 indexed missionId, string name, uint256 reward);
    event MissionStarted(address indexed user, uint256 indexed missionId);
    event MissionCompleted(address indexed user, uint256 indexed missionId, uint256 reward);
    event LevelUp(address indexed user, uint256 newLevel);
    event StreakBonus(address indexed user, uint256 streak, uint256 bonus);
    event SocialBonusActivated(address indexed user);

    modifier validMission(uint256 _missionId) {
        require(_missionId > 0 && _missionId <= missionCounter, "Invalid mission ID");
        require(missions[_missionId].active, "Mission not active");
        _;
    }

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
        _initializeMissions();
    }

    function _initializeMissions() internal {
        createMission(
            "First Deposit",
            "Make your first USDT deposit",
            100,
            1,
            86400
        );
        
        createMission(
            "Yield Explorer",
            "Try 3 different yield strategies",
            250,
            2,
            604800
        );
        
        createMission(
            "Social Trader",
            "Share a strategy with 5 LINE friends",
            200,
            2,
            259200
        );
        
        createMission(
            "Risk Manager",
            "Set your risk tolerance profile",
            75,
            1,
            3600
        );
        
        createMission(
            "Yield Master",
            "Earn 100 USDT in yield rewards",
            500,
            3,
            2592000
        );
    }

    function createMission(
        string memory _name,
        string memory _description,
        uint256 _reward,
        uint256 _difficulty,
        uint256 _duration
    ) public onlyOwner {
        missionCounter++;
        missions[missionCounter] = Mission({
            id: missionCounter,
            name: _name,
            description: _description,
            reward: _reward,
            difficulty: _difficulty,
            duration: _duration,
            active: true
        });

        emit MissionCreated(missionCounter, _name, _reward);
    }

    function startMission(uint256 _missionId) external validMission(_missionId) {
        require(userMissions[msg.sender][_missionId].startTime == 0, "Mission already started");
        
        userMissions[msg.sender][_missionId] = UserMission({
            missionId: _missionId,
            progress: 0,
            startTime: block.timestamp,
            completed: false,
            claimed: false
        });

        emit MissionStarted(msg.sender, _missionId);
    }

    function updateMissionProgress(address _user, uint256 _missionId, uint256 _progress) 
        external 
        onlyOwner 
        validMission(_missionId) 
    {
        UserMission storage userMission = userMissions[_user][_missionId];
        require(userMission.startTime > 0, "Mission not started");
        require(!userMission.completed, "Mission already completed");
        
        Mission memory mission = missions[_missionId];
        require(block.timestamp <= userMission.startTime + mission.duration, "Mission expired");

        userMission.progress = _progress;
        
        if (_progress >= 100) {
            userMission.completed = true;
            _updateDailyStreak(_user);
            emit MissionCompleted(_user, _missionId, mission.reward);
        }
    }

    function claimMissionReward(uint256 _missionId) external nonReentrant {
        UserMission storage userMission = userMissions[msg.sender][_missionId];
        require(userMission.completed, "Mission not completed");
        require(!userMission.claimed, "Reward already claimed");

        Mission memory mission = missions[_missionId];
        uint256 baseReward = mission.reward;
        uint256 levelBonus = (userLevel[msg.sender] * baseReward) / 100;
        uint256 streakBonus = (dailyStreak[msg.sender] * DAILY_STREAK_BONUS);
        
        uint256 totalReward = baseReward + levelBonus + streakBonus;
        
        if (socialBonus[msg.sender]) {
            totalReward = (totalReward * SOCIAL_BONUS_MULTIPLIER) / 100;
        }

        userMission.claimed = true;
        userPoints[msg.sender] += totalReward;
        
        _checkLevelUp(msg.sender);
        _updateLeaderboard(msg.sender);
        
        rewardToken.transfer(msg.sender, totalReward);
    }

    function _updateDailyStreak(address _user) internal {
        uint256 lastActivityTime = lastActivity[_user];
        uint256 timeDiff = block.timestamp - lastActivityTime;
        
        if (timeDiff <= 86400) {
            dailyStreak[_user]++;
        } else if (timeDiff > 172800) {
            dailyStreak[_user] = 1;
        }
        
        lastActivity[_user] = block.timestamp;
        
        if (dailyStreak[_user] % 7 == 0) {
            uint256 bonus = dailyStreak[_user] * DAILY_STREAK_BONUS;
            userPoints[_user] += bonus;
            emit StreakBonus(_user, dailyStreak[_user], bonus);
        }
    }

    function _checkLevelUp(address _user) internal {
        uint256 currentLevel = userLevel[_user];
        uint256 newLevel = userPoints[_user] / POINTS_PER_LEVEL;
        
        if (newLevel > currentLevel) {
            userLevel[_user] = newLevel;
            emit LevelUp(_user, newLevel);
        }
    }

    function _updateLeaderboard(address _user) internal {
        uint256 userScore = userPoints[_user];
        
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].user == _user) {
                leaderboard[i].score = userScore;
                leaderboard[i].timestamp = block.timestamp;
                _sortLeaderboard();
                return;
            }
        }
        
        if (leaderboard.length < 100) {
            leaderboard.push(LeaderboardEntry({
                user: _user,
                score: userScore,
                timestamp: block.timestamp
            }));
            _sortLeaderboard();
        } else if (userScore > leaderboard[leaderboard.length - 1].score) {
            leaderboard[leaderboard.length - 1] = LeaderboardEntry({
                user: _user,
                score: userScore,
                timestamp: block.timestamp
            });
            _sortLeaderboard();
        }
    }

    function _sortLeaderboard() internal {
        for (uint256 i = 0; i < leaderboard.length - 1; i++) {
            for (uint256 j = 0; j < leaderboard.length - i - 1; j++) {
                if (leaderboard[j].score < leaderboard[j + 1].score) {
                    LeaderboardEntry memory temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                }
            }
        }
    }

    function activateSocialBonus(address _user) external onlyOwner {
        socialBonus[_user] = true;
        emit SocialBonusActivated(_user);
    }

    function getUserMissions(address _user) external view returns (UserMission[] memory) {
        UserMission[] memory userMissionList = new UserMission[](missionCounter);
        for (uint256 i = 1; i <= missionCounter; i++) {
            userMissionList[i - 1] = userMissions[_user][i];
        }
        return userMissionList;
    }

    function getActiveMissions() external view returns (Mission[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= missionCounter; i++) {
            if (missions[i].active) activeCount++;
        }
        
        Mission[] memory activeMissions = new Mission[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= missionCounter; i++) {
            if (missions[i].active) {
                activeMissions[index] = missions[i];
                index++;
            }
        }
        return activeMissions;
    }

    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    function getUserStats(address _user) external view returns (
        uint256 points,
        uint256 level,
        uint256 streak,
        bool hasSocialBonus
    ) {
        return (
            userPoints[_user],
            userLevel[_user],
            dailyStreak[_user],
            socialBonus[_user]
        );
    }

    function updateMissionStatus(uint256 _missionId, bool _active) external onlyOwner {
        require(_missionId > 0 && _missionId <= missionCounter, "Invalid mission ID");
        missions[_missionId].active = _active;
    }

    function withdrawRewards(uint256 _amount) external onlyOwner {
        rewardToken.transfer(owner(), _amount);
    }
}