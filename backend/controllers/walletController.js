const Wallet = require("../models/Wallet");
const { formatProfileData } = require('./userController');

exports.registerWallet = async (req) => {
  console.log('[Register Endpoint] Получен новый запрос. Тело:', JSON.stringify(req.body, null, 2));
  let { address, ip } = req.body;
  if (!ip && req.ip) ip = req.ip;
  const referralAddress = req.body.referral;
  try {
    let wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    let isNew = false;
    if (!wallet) {
      isNew = true;
      console.log(`[Registration] Кошелек ${address} не найден. Создаем нового пользователя.`);
      const newUser = {
        address,
        ip,
        tokenBalance: 0,
        battlePassLevel: 1,
        battlePassProgress: 0,
        username: `User-${address.slice(0, 6)}`,
        avatarUrl: '/uploads/avatars/default_avatar.png',
        group: "",
        referrals: []
      };
      if (referralAddress) {
        newUser.invitedBy = referralAddress;
        console.log(`[Registration] Пользователь ${address} был приглашен ${referralAddress}.`);
      } else {
        console.log(`[Registration] Пользователь ${address} пришел без реферала.`);
      }
      wallet = new Wallet(newUser);
      await wallet.save();
      console.log(`[Registration] Новый пользователь ${address} успешно сохранен в БД.`);
    } else {
      console.log(`[Registration] Пользователь ${address} уже существует.`);
      if (referralAddress && !wallet.invitedBy) {
        console.log(`[Referral Fix] У существующего пользователя ${address} нет реферера. Добавляем ${referralAddress}.`);
        wallet.invitedBy = referralAddress;
        await wallet.save();
        console.log(`[Referral Fix] Реферер ${referralAddress} успешно добавлен к ${address}.`);
      }
    }
    if (referralAddress && referralAddress.toLowerCase() !== address.toLowerCase()) {
      console.log(`[Referral Logic] Запуск процесса добавления реферала к пригласившему...`);
      try {
        const inviterWallet = await Wallet.findOne({ address: new RegExp(`^${referralAddress}$`, 'i') });
        if (inviterWallet) {
          if (!inviterWallet.referrals.includes(address)) {
            console.log(`[Referral Logic] Пригласивший ${referralAddress} найден. Добавляем нового реферала.`);
            inviterWallet.referrals.push(address);
            await inviterWallet.save();
            console.log(`[Referral Logic] SUCCESS: Реферал ${address} успешно добавлен к ${referralAddress}.`);
          } else {
            console.log(`[Referral Logic] INFO: Реферал ${address} уже был в списке у ${referralAddress}.`);
          }
        } else {
          console.error(`[Referral Logic] FAIL: Пригласивший ${referralAddress} НЕ НАЙДЕН.`);
        }
      } catch (referralError) {
        console.error("[Referral Logic] CRITICAL FAIL:", referralError.message);
      }
    }
    const profileData = formatProfileData(wallet);
    return { profile: profileData, isNew };
  } catch (error) {
    console.error("[Registration] CRITICAL FAIL:", error);
    throw error;
  }
};

exports.getAllWallets = async (req) => {
  try {
    const wallets = await Wallet.find();
    return wallets;
  } catch (error) {
    console.error("Ошибка при получении списка кошельков:", error);
    throw error;
  }
};

exports.updateWallet = async (req) => {
  const { address } = req.params;
  const { points, tokenBalance, group } = req.body;
  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) return null;

    if (points !== undefined) wallet.points = points;
    if (tokenBalance !== undefined) wallet.tokenBalance = tokenBalance;
    if (group !== undefined) wallet.group = group;

    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Ошибка при обновлении кошелька:", error);
    throw error;
  }
};

exports.deleteWallet = async (req) => {
  const { address } = req.params;
  try {
    return await Wallet.findOneAndDelete({ address: new RegExp(`^${address}$`, 'i') });
  } catch (error) {
    console.error("Ошибка при удалении кошелька:", error);
    throw error;
  }
};

exports.checkWalletStatus = async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    res.json({ registered: !!wallet });
  } catch (error) {
    console.error("Ошибка при проверке статуса кошелька:", error);
    res.status(500).json({ message: "Ошибка сервера при проверке статуса" });
  }
};