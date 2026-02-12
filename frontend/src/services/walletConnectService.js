import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import { ethers } from "ethers";
// Импортируем функции из нашего нового единого сервиса
import { getOrRegisterProfile, fetchUserProfile as fetchUserProfileAPI } from "./apiService";

const WALLET_CONNECT_PROJECT_ID = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;
const CHAIN_ID = process.env.REACT_APP_CHAIN_ID || "eip155:97"; // BSC Testnet default

const normalizeAvatarUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `/${url.replace(/^\/+/, '')}`;
};

let signClient = null;
let walletModal = null;

const initSignClient = async () => {
  if (signClient) return signClient;
  signClient = await SignClient.init({
    projectId: WALLET_CONNECT_PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.org",
    metadata: {
      name: "Deeplom App",
      description: "Deeplom dApp Connection",
      url: "https://cbellory.online",
      icons: ["https://cbellory.online/frontend/icon.png"],
    },
  });
  return signClient;
};

export const connectWallet = async (setAccount, setIsConnected, setProfile, setError, referralAddress = null) => {
  try {
    await initSignClient();

    if (!walletModal) {
      walletModal = new WalletConnectModal({
        projectId: WALLET_CONNECT_PROJECT_ID,
        standaloneChains: [CHAIN_ID],
      });
    }

    const { uri, approval } = await signClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "personal_sign"],
          chains: ["eip155:1"], // Ethereum Mainnet as required baseline
          events: ["accountsChanged", "chainChanged"],
        },
      },
      optionalNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "personal_sign", "wallet_switchEthereumChain", "wallet_addEthereumChain"],
          chains: ["eip155:56", "eip155:97"], // BSC Mainnet, BSC Testnet
          events: ["accountsChanged", "chainChanged"],
        },
      },
    });

    if (uri) {
      walletModal.openModal({ uri });
    }

    const session = await approval();
    const connectedAccount = session.namespaces.eip155.accounts[0].split(":")[2];
    console.log("Гаманець підключено:", connectedAccount);

    walletModal.closeModal();

    const ip = await fetch("https://api64.ipify.org?format=json").then(res => res.json()).then(data => data.ip);
    const profileData = await getOrRegisterProfile(connectedAccount, ip, referralAddress);

    profileData.avatarUrl = normalizeAvatarUrl(profileData.avatarUrl);

    setProfile(profileData);
    setAccount(connectedAccount);
    localStorage.setItem('walletAddress', connectedAccount);
    setIsConnected(true);
    console.log("Профиль успешно получен и установлен:", profileData);

  } catch (error) {
    console.error('Ошибка при подключении кошелька:', error);
    setError(`Не вдалося підключити гаманець. Спробуйте ще раз. (${error.message || 'Unknown error'})`);
  }
};

export const fetchUserProfile = async (walletAddress, setProfile, setError) => {
  try {
    const profileData = await fetchUserProfileAPI(walletAddress);
    if (profileData) {
      profileData.avatarUrl = normalizeAvatarUrl(profileData.avatarUrl);
      setProfile(profileData);
    }
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
  }
};

export const disconnectWallet = async (walletAddress, setAccount, setProfile, setIsConnected, setError) => {
  try {
    await initSignClient(); // Ensure client is there to disconnect
    if (signClient) {
      const sessions = signClient.session.getAll();
      if (sessions.length) {
        await Promise.all(sessions.map(session => signClient.disconnect({
          topic: session.topic,
          reason: { code: 6000, message: "User disconnected" }
        })));
      }
    }
  } catch (error) {
    console.error("Ошибка при завершении сессий WalletConnect:", error);
  }

  setAccount(null);
  setProfile({ username: '', avatarUrl: '', tokenBalance: 0, points: 0 });
  localStorage.removeItem('walletAddress');
  setIsConnected(false);
  setError(null);
};

export const sendTokenTransfer = async (from, to, amount, contractAddress) => {
  await initSignClient(); // Ensure client is initialized

  if (!signClient) throw new Error("Wallet not connected (Client failed to init)");

  const sessions = signClient.session.getAll();
  if (!sessions.length) throw new Error("No active session. Please reconnect your wallet.");

  // Check if session matches the 'from' address if possible, or just use the first/active one
  // For simplicity, we use the first valid session.
  const session = sessions.find(s => s.namespaces.eip155.accounts.some(a => a.includes(from))) || sessions[0];
  if (!session) throw new Error("No matching session for this address");

  // STALE SESSION CHECK:
  // If the session was created before we added 'wallet_switchEthereumChain', we must recreate it.
  const sessionMethods = session.namespaces.eip155.methods || [];
  if (!sessionMethods.includes("wallet_switchEthereumChain")) {
    console.log("Stale session detected (missing wallet_switchEthereumChain). Disconnecting...");
    try {
      await signClient.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: "Session stale, please reconnect" }
      });
    } catch (e) { console.error("Disconnect error", e); }

    // We also need to clear local storage to ensure the UI reflects the disconnect
    localStorage.removeItem('walletAddress');
    // We can't easily update React state (setAccount) from here, but throwing this error
    // will trigger the catch block in Shop.js.
    throw new Error("Session updated. Please reconnect your wallet to continue.");
  }

  // Check if CHAIN_ID is in the session namespaces
  const namespace = session.namespaces.eip155;
  const isChainApproved = namespace.chains?.includes(CHAIN_ID) || namespace.accounts?.some(a => a.startsWith(CHAIN_ID));

  if (!isChainApproved) {
    console.log(`Chain ${CHAIN_ID} not approved in session. Attempting to switch...`);
    try {
      await signClient.request({
        topic: session.topic,
        chainId: "eip155:1", // Send switch request from Mainnet (or whatever is current)
        request: {
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x61" }], // 0x61 = 97 (BSC Testnet)
        },
      });
      // Wait a bit for the wallet to update the session or for the user to approve
      // Note: In WCv2, chain switching might not auto-update the session immediately in the dapp state without a refresh event, 
      // but for some wallets it allows subsequent requests.
      console.log("Switch request sent.");
    } catch (switchError) {
      console.error("Failed to switch chain:", switchError);
      throw new Error("Please switch your wallet to BSC Testnet (Chain ID 97) manually.");
    }
  }

  const iface = new ethers.utils.Interface([
    "function transfer(address to, uint256 amount)"
  ]);

  const data = iface.encodeFunctionData("transfer", [to, ethers.utils.parseEther(amount.toString())]);

  const request = {
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: contractAddress,
        data,
      },
    ],
  };

  const result = await signClient.request({
    topic: session.topic,
    chainId: CHAIN_ID, // This might still fail if session isn't updated, but let's try
    request,
  });

  return result; // Transaction Hash
};