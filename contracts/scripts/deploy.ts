import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Starting deployment to BNB Smart Chain Testnet...\n");

    // Получаем deployer аккаунт
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "BNB\n");

    // ========== Деплой UniversityCoin ==========
    console.log("📦 Deploying UniversityCoin...");
    const UniversityCoin = await ethers.getContractFactory("UniversityCoin");
    const coin = await UniversityCoin.deploy();
    await coin.waitForDeployment();
    const coinAddress = await coin.getAddress();
    console.log("✅ UniversityCoin deployed to:", coinAddress);

    // ========== Деплой SoulboundDiploma ==========
    console.log("\n📦 Deploying SoulboundDiploma...");
    const SoulboundDiploma = await ethers.getContractFactory("SoulboundDiploma");
    const diploma = await SoulboundDiploma.deploy();
    await diploma.waitForDeployment();
    const diplomaAddress = await diploma.getAddress();
    console.log("✅ SoulboundDiploma deployed to:", diplomaAddress);

    // ========== Настройка ролей ==========
    console.log("\n🔐 Setting up roles...");

    // Роли уже выданы deployer'у в конструкторе UniversityCoin
    const MINTER_ROLE = await coin.MINTER_ROLE();
    const PAUSER_ROLE = await coin.PAUSER_ROLE();

    console.log("✅ MINTER_ROLE granted to:", deployer.address);
    console.log("✅ PAUSER_ROLE granted to:", deployer.address);
    console.log("✅ SoulboundDiploma owner:", deployer.address);

    // ========== Сохранение адресов ==========
    const deploymentInfo = {
        network: "BNB Smart Chain Testnet",
        chainId: 97,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            UniversityCoin: {
                address: coinAddress,
                name: "University Coin",
                symbol: "UCN",
            },
            SoulboundDiploma: {
                address: diplomaAddress,
                name: "University Diploma",
                symbol: "UDIP",
            },
        },
    };

    const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", outputPath);

    // ========== Итоговая информация ==========
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("   UniversityCoin (UCN):", coinAddress);
    console.log("   SoulboundDiploma (UDIP):", diplomaAddress);
    console.log("\n🔗 View on BSCScan Testnet:");
    console.log("   UniversityCoin:", `https://testnet.bscscan.com/address/${coinAddress}`);
    console.log("   SoulboundDiploma:", `https://testnet.bscscan.com/address/${diplomaAddress}`);
    console.log("\n" + "=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
