import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const MNEMONIC = "trophy van uncle comfort curve fence nest law sheriff bullet nest barrel";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // BNB Smart Chain Testnet
        bscTestnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: {
                mnemonic: MNEMONIC,
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 10,
            },
        },
        // Localhost для тестирования
        localhost: {
            url: "http://127.0.0.1:8545",
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
