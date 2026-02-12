# DeepLom / UniHub Project 🎓

This is the source code for the Diploma project.
Based on **MERN Stack** (MongoDB, Express, React, Node.js) + **Web3** (WalletConnect).

## 🚀 Quick Start
For detailed deployment instructions, please read **[DEPLOY.md](DEPLOY.md)**.

### Brief Summary:
1.  **Install dependencies**:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```
2.  **Configure**:
    Copy `.env.example` to `.env` in both folders and set your variables.
3.  **Run**:
    ```bash
    # Backend
    cd backend && npm start
    # Frontend
    cd frontend && npm start
    ```

## 📂 Structure
- `backend/` - API Server & Database logic
- `frontend/` - React Application (UI)
- `admin/` - Admin Panel source code
- `contracts/` - Smart Contracts (Hardhat)
- `tools/` - Maintenance scripts

## 🛠 Dashboard
The project includes a local control panel (Dashboard) running on port `9999`.
Run it via: `node dashboard.js`
