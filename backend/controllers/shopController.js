const Wallet = require('../models/Wallet');
const shopItems = require('../data/shopItems');
const BadgeService = require('../services/badgeService');

exports.getShopItems = (req, res) => {
    res.json(shopItems);
};

exports.buyItem = async (req, res) => {
    const { itemId, address, txHash } = req.body;

    // Basic validation
    if (!itemId || !address) {
        return res.status(400).json({ message: "Missing itemId or address" });
    }

    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
        return res.status(404).json({ message: "Item not found" });
    }

    try {
        const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
        if (!wallet) return res.status(404).json({ message: "User not found" });

        // Check if already owns
        if (wallet.inventory && wallet.inventory.includes(itemId)) {
            return res.status(400).json({ message: "You already own this item" });
        }

        // Check balance (still good to double check, though now we rely on tx for payment)
        if (wallet.tokenBalance < item.price) {
            return res.status(400).json({ message: "Insufficient tokens" });
        }

        console.log(`Processing purchase for ${address}: Item ${itemId}, Price ${item.price}, TxHash: ${txHash || 'None'}`);

        // Transaction
        wallet.tokenBalance -= item.price;
        if (!wallet.inventory) wallet.inventory = [];
        wallet.inventory.push(itemId);

        await wallet.save();

        // --- AUTO-AWARD BADGES (Big Spender, Rich) ---
        const newBadges = await BadgeService.checkAndAwardBadges(address);

        res.json({
            success: true,
            message: `Bought ${item.name}`,
            balance: wallet.tokenBalance,
            inventory: wallet.inventory,
            newBadges, // Notify frontend if new badges awarded
            txHash // Return txHash for confirmation
        });
    } catch (error) {
        console.error("Buy Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.equipItem = async (req, res) => {
    const { itemId, type, address } = req.body;
    // Type: 'frame', 'nick', 'bg'

    if (!address) return res.status(400).json({ message: "Address required" });

    try {
        const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
        if (!wallet) return res.status(404).json({ message: "User not found" });

        // If filtering item (unequip if itemId is empty/null, or check ownership if equipping)
        if (itemId) {
            if (!wallet.inventory || !wallet.inventory.includes(itemId)) {
                return res.status(403).json({ message: "You don't own this item" });
            }
        }

        // Init equipped if needed
        if (!wallet.equipped) {
            wallet.equipped = { avatarFrame: '', nickEffect: '', profileBg: '' };
        }

        if (type === 'frame') wallet.equipped.avatarFrame = itemId || '';
        if (type === 'nick') wallet.equipped.nickEffect = itemId || '';
        if (type === 'bg') wallet.equipped.profileBg = itemId || '';

        await wallet.save();

        res.json({ success: true, equipped: wallet.equipped });
    } catch (error) {
        console.error("Equip Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
