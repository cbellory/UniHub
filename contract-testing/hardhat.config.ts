// 1. Імпортуємо Toolbox (для Ethers)
import "@nomicfoundation/hardhat-toolbox";
// 2. ЯВНО імпортуємо Mocha (щоб він точно запустив JS-тести)
import "@nomicfoundation/hardhat-mocha";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  // Вказуємо версію компілятора
  solidity: "0.8.20",
};