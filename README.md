# 🎓 UniHub - Decentralized Educational Platform (Web3 LMS)

This is the source code for the UniHub project, an open-source, hybrid Learning Management System (LMS) designed to solve the problem of student demotivation. It bridges the gap between traditional Web2 operational speed and Web3 transparency.

Based on the **MERN Stack** (MongoDB, Express, React, Node.js) + **Web3** (WalletConnect, Solidity, BNB Smart Chain).

## 🌟 Core Features
* **Tokenomics & Gamification:** Students earn `UniversityCoin` (ERC-20 utility tokens) and XP by completing academic tasks.
* **Soulbound Tokens (SBT):** Digital diplomas and verifiable credentials are minted as non-transferable ERC-721 tokens (`SoulboundDiploma`), ensuring they cannot be faked or sold.
* **Student DAO:** A decentralized governance system (Token-Weighted Voting) allowing students to vote on university decisions using their earned tokens without paying gas fees for each vote.

## 🚀 Current Status & Claude OSS Application
This project originated as a Master's Thesis research project and is now being transitioned into a fully maintained Open Source repository. 

**Upcoming Roadmap (Why we are applying for Claude OSS):**
- [ ] Comprehensive security audit of `UniversityCoin.sol` and `SoulboundDiploma.sol`.
- [ ] Gas optimization for smart contract deployment.
- [ ] Refactoring the React/Ethers.js integration for more stable WalletConnect sessions.
- [ ] Increasing unit test coverage for the Node.js backend.

---

## 💻 Quick Start

For detailed deployment instructions, please read `DEPLOY.md`.

**Brief Summary:**

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure:** Copy `.env.example` to `.env` in both folders and set your variables. *(Note: Never commit your actual `.env` file!)*

3. **Run:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start

   # Terminal 2: Frontend
   cd frontend && npm start
   ```

## 📂 Structure
* `backend/` - API Server & Database logic
* `frontend/` - React Application (UI)
* `admin/` - Admin Panel source code
* `contracts/` - Smart Contracts (Hardhat)
* `tools/` - Maintenance scripts

## 🛠 Dashboard
The project includes a local control panel (Dashboard) running on port `9999`. Run it via: 
```bash
node dashboard.js
```

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
