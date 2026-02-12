const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Загрузка адресов контрактов
const deployedAddressesPath = path.join(__dirname, '../../contracts/deployed-addresses.json');
const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, 'utf8'));

// Загрузка ABI контрактов
const universityCoinArtifact = require('../../contracts/artifacts/contracts/UniversityCoin.sol/UniversityCoin.json');
const soulboundDiplomaArtifact = require('../../contracts/artifacts/contracts/SoulboundDiploma.sol/SoulboundDiploma.json');

// Конфигурация сети
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const MNEMONIC = process.env.MNEMONIC || 'trophy van uncle comfort curve fence nest law sheriff bullet nest barrel';

// Создание провайдера и кошелька
const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
const wallet = ethers.Wallet.fromPhrase(MNEMONIC).connect(provider);

// Создание экземпляров контрактов
const universityCoinContract = new ethers.Contract(
    deployedAddresses.contracts.UniversityCoin.address,
    universityCoinArtifact.abi,
    wallet
);

const soulboundDiplomaContract = new ethers.Contract(
    deployedAddresses.contracts.SoulboundDiploma.address,
    soulboundDiplomaArtifact.abi,
    wallet
);

/**
 * Сервис для работы с блокчейн контрактами
 */
class ContractService {
    /**
     * Получить адреса контрактов
     */
    static getContractAddresses() {
        return {
            universityCoin: deployedAddresses.contracts.UniversityCoin.address,
            soulboundDiploma: deployedAddresses.contracts.SoulboundDiploma.address,
            network: deployedAddresses.network,
            chainId: deployedAddresses.chainId,
        };
    }

    /**
     * Выдать токены студенту (только MINTER_ROLE)
     * @param {string} studentAddress - Адрес студента
     * @param {number} amount - Количество токенов (в целых единицах, не wei)
     */
    static async mintTokens(studentAddress, amount) {
        try {
            // Конвертируем в wei (1 UCN = 10^18 wei)
            const amountInWei = ethers.parseEther(amount.toString());

            // Вызываем функцию mint
            const tx = await universityCoinContract.mint(studentAddress, amountInWei);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                amount: amount,
                studentAddress: studentAddress,
            };
        } catch (error) {
            console.error('Error minting tokens:', error);
            throw new Error(`Failed to mint tokens: ${error.message}`);
        }
    }

    /**
     * Получить баланс токенов студента
     * @param {string} address - Адрес студента
     */
    static async getTokenBalance(address) {
        try {
            const balanceInWei = await universityCoinContract.balanceOf(address);
            const balance = ethers.formatEther(balanceInWei);

            return {
                address: address,
                balance: parseFloat(balance),
                balanceWei: balanceInWei.toString(),
            };
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    /**
     * Выдать диплом студенту (только Owner)
     * @param {string} studentAddress - Адрес студента
     * @param {string} metadataURI - URI метаданных диплома (IPFS)
     */
    static async mintDiploma(studentAddress, metadataURI) {
        try {
            const tx = await soulboundDiplomaContract.safeMint(studentAddress, metadataURI);
            const receipt = await tx.wait();

            // Получаем tokenId из события Transfer
            const transferEvent = receipt.logs.find(
                log => log.fragment && log.fragment.name === 'Transfer'
            );

            const tokenId = transferEvent ? transferEvent.args[2].toString() : null;

            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                tokenId: tokenId,
                studentAddress: studentAddress,
                metadataURI: metadataURI,
            };
        } catch (error) {
            console.error('Error minting diploma:', error);
            throw new Error(`Failed to mint diploma: ${error.message}`);
        }
    }

    /**
     * Получить информацию о дипломе по tokenId
     * @param {number} tokenId - ID токена диплома
     */
    static async getDiplomaInfo(tokenId) {
        try {
            const owner = await soulboundDiplomaContract.ownerOf(tokenId);
            const tokenURI = await soulboundDiplomaContract.tokenURI(tokenId);

            return {
                tokenId: tokenId,
                owner: owner,
                metadataURI: tokenURI,
            };
        } catch (error) {
            console.error('Error getting diploma info:', error);
            throw new Error(`Failed to get diploma info: ${error.message}`);
        }
    }

    /**
     * Получить количество дипломов у студента
     * @param {string} address - Адрес студента
     */
    static async getDiplomaBalance(address) {
        try {
            const balance = await soulboundDiplomaContract.balanceOf(address);
            return {
                address: address,
                diplomaCount: parseInt(balance.toString()),
            };
        } catch (error) {
            console.error('Error getting diploma balance:', error);
            throw new Error(`Failed to get diploma balance: ${error.message}`);
        }
    }

    /**
     * Проверить, является ли адрес владельцем контракта
     */
    static async isContractOwner(address) {
        try {
            const owner = await soulboundDiplomaContract.owner();
            return owner.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Error checking contract owner:', error);
            return false;
        }
    }

    /**
     * Получить информацию о провайдере
     */
    static async getProviderInfo() {
        try {
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();

            return {
                network: network.name,
                chainId: Number(network.chainId),
                blockNumber: blockNumber,
            };
        } catch (error) {
            console.error('Error getting provider info:', error);
            throw new Error(`Failed to get provider info: ${error.message}`);
        }
    }
}

module.exports = ContractService;
