const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying KAIA YIELD AI contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSDT for testing (only on testnet)
  let USDT_ADDRESS;
  if (network.name.includes('testnet') || network.name.includes('baobab')) {
    console.log("\n1. Deploying MockUSDT (testnet only)...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    USDT_ADDRESS = await mockUSDT.getAddress();
    console.log("MockUSDT deployed to:", USDT_ADDRESS);
  } else {
    USDT_ADDRESS = "0x8bb8f10e2b2f7d6d0e7f7f94b42ac8c7f5e8e6e1"; // Mainnet USDT
  }

  console.log("\n2. Deploying YieldOptimizer...");
  const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(USDT_ADDRESS);
  await yieldOptimizer.waitForDeployment();
  const yieldOptimizerAddress = await yieldOptimizer.getAddress();
  console.log("YieldOptimizer deployed to:", yieldOptimizerAddress);

  console.log("\n3. Deploying GameRewards...");
  const GameRewards = await ethers.getContractFactory("GameRewards");
  const gameRewards = await GameRewards.deploy(USDT_ADDRESS);
  await gameRewards.waitForDeployment();
  console.log("GameRewards deployed to:", await gameRewards.getAddress());

  console.log("\n4. Deploying Strategy Contracts...");
  
  // Deploy StableEarnStrategy
  const StableEarnStrategy = await ethers.getContractFactory("StableEarnStrategy");
  const stableEarnStrategy = await StableEarnStrategy.deploy(USDT_ADDRESS, yieldOptimizerAddress);
  await stableEarnStrategy.waitForDeployment();
  const stableEarnAddress = await stableEarnStrategy.getAddress();
  console.log("StableEarnStrategy deployed to:", stableEarnAddress);

  // Deploy GrowthPlusStrategy
  const GrowthPlusStrategy = await ethers.getContractFactory("GrowthPlusStrategy");
  const growthPlusStrategy = await GrowthPlusStrategy.deploy(USDT_ADDRESS, yieldOptimizerAddress);
  await growthPlusStrategy.waitForDeployment();
  const growthPlusAddress = await growthPlusStrategy.getAddress();
  console.log("GrowthPlusStrategy deployed to:", growthPlusAddress);

  // Deploy HighYieldProStrategy
  const HighYieldProStrategy = await ethers.getContractFactory("HighYieldProStrategy");
  const highYieldProStrategy = await HighYieldProStrategy.deploy(USDT_ADDRESS, yieldOptimizerAddress);
  await highYieldProStrategy.waitForDeployment();
  const highYieldProAddress = await highYieldProStrategy.getAddress();
  console.log("HighYieldProStrategy deployed to:", highYieldProAddress);

  console.log("\n5. Setting up strategies in YieldOptimizer...");
  
  await yieldOptimizer.addStrategy(
    "Stable Earn",
    stableEarnAddress,
    500,
    2,
    ethers.parseUnits("10", 6),
    ethers.parseUnits("10000", 6)
  );
  console.log("✓ Stable Earn strategy added");

  await yieldOptimizer.addStrategy(
    "Growth Plus",
    growthPlusAddress, 
    1200,
    5,
    ethers.parseUnits("50", 6),
    ethers.parseUnits("50000", 6)
  );
  console.log("✓ Growth Plus strategy added");

  await yieldOptimizer.addStrategy(
    "High Yield Pro",
    highYieldProAddress,
    2500,
    8,
    ethers.parseUnits("100", 6),
    ethers.parseUnits("100000", 6)
  );
  console.log("✓ High Yield Pro strategy added");

  console.log("Initial strategies added successfully!");

  console.log("\n=== Deployment Summary ===");
  console.log("USDT Token:", USDT_ADDRESS);
  console.log("YieldOptimizer:", yieldOptimizerAddress);
  console.log("GameRewards:", await gameRewards.getAddress());
  console.log("StableEarnStrategy:", stableEarnAddress);
  console.log("GrowthPlusStrategy:", growthPlusAddress);
  console.log("HighYieldProStrategy:", highYieldProAddress);
  
  console.log("\n=== Verification Commands ===");
  if (network.name.includes('testnet') || network.name.includes('baobab')) {
    console.log(`npx hardhat verify --network ${network.name} ${USDT_ADDRESS}`);
  }
  console.log(`npx hardhat verify --network ${network.name} ${yieldOptimizerAddress} ${USDT_ADDRESS}`);
  console.log(`npx hardhat verify --network ${network.name} ${await gameRewards.getAddress()} ${USDT_ADDRESS}`);
  console.log(`npx hardhat verify --network ${network.name} ${stableEarnAddress} ${USDT_ADDRESS} ${yieldOptimizerAddress}`);
  console.log(`npx hardhat verify --network ${network.name} ${growthPlusAddress} ${USDT_ADDRESS} ${yieldOptimizerAddress}`);
  console.log(`npx hardhat verify --network ${network.name} ${highYieldProAddress} ${USDT_ADDRESS} ${yieldOptimizerAddress}`);

  const deploymentInfo = {
    network: network.name,
    usdt: USDT_ADDRESS,
    yieldOptimizer: yieldOptimizerAddress,
    gameRewards: await gameRewards.getAddress(),
    strategies: {
      stableEarn: stableEarnAddress,
      growthPlus: growthPlusAddress,
      highYieldPro: highYieldProAddress
    },
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });