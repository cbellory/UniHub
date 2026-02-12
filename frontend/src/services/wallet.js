// Подключение кошелька
export const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      return accounts[0];
    } else {
      throw new Error("Ethereum объект не найден");
    }
  };
  
  // Отключение кошелька (если поддерживается)
  export const disconnectWallet = async () => {
    if (window.ethereum && window.ethereum.request) {
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
    }
  };
  
  // Обработчик изменения учетной записи
  export const handleAccountChange = (callback) => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  };
  