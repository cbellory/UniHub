import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Chip, Alert } from '@mui/material';
import { AccountBalanceWallet, CardMembership, Info } from '@mui/icons-material';
import TokenManager from './TokenManager';
import CertificateManager from './CertificateManager'; // Updated from DiplomaManager
import { getContractAddresses } from '../services/blockchainApi';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`blockchain-tabpanel-${index}`}
            aria-labelledby={`blockchain-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const BlockchainManager = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [contractAddresses, setContractAddresses] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContractAddresses();
    }, []);

    const fetchContractAddresses = async () => {
        try {
            const result = await getContractAddresses();
            setContractAddresses(result.data);
        } catch (error) {
            console.error('Помилка при завантаженні адрес контрактів:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>
                    Блокчейн
                </Typography>
                {contractAddresses && (
                    <Chip
                        label={`${contractAddresses.network} (Chain ID: ${contractAddresses.chainId})`}
                        color="primary"
                        size="small"
                    />
                )}
            </Box>

            {/* Информация о контрактах */}
            {contractAddresses && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>UniversityCoin (UCN):</strong>{' '}
                        <a
                            href={`https://testnet.bscscan.com/address/${contractAddresses.universityCoin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {contractAddresses.universityCoin}
                        </a>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>SoulboundDiploma (UDIP):</strong>{' '}
                        <a
                            href={`https://testnet.bscscan.com/address/${contractAddresses.soulboundDiploma}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {contractAddresses.soulboundDiploma}
                        </a>
                    </Typography>
                </Alert>
            )}

            {/* Табы */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="blockchain tabs">
                    <Tab
                        icon={<AccountBalanceWallet />}
                        iconPosition="start"
                        label="Токени (UCN)"
                        id="blockchain-tab-0"
                        aria-controls="blockchain-tabpanel-0"
                    />
                    <Tab
                        icon={<CardMembership />}
                        iconPosition="start"
                        label="Дипломи (NFT)"
                        id="blockchain-tab-1"
                        aria-controls="blockchain-tabpanel-1"
                    />
                    <Tab
                        icon={<Info />}
                        iconPosition="start"
                        label="Інформація"
                        id="blockchain-tab-2"
                        aria-controls="blockchain-tabpanel-2"
                    />
                </Tabs>
            </Box>

            {/* Панели табов */}
            <TabPanel value={currentTab} index={0}>
                <TokenManager />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <CertificateManager />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Про систему блокчейн
                    </Typography>

                    <Typography variant="body1" paragraph>
                        Система використовує технологію блокчейн для забезпечення прозорості та надійності
                        зберігання академічних досягнень студентів.
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        UniversityCoin (UCN)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Стандарт: ERC-20
                        <br />
                        • Призначення: Утилітарний токен для винагород студентів
                        <br />
                        • Функції: Mint, Burn, Pause/Unpause
                        <br />• Контроль доступу: Ролі MINTER_ROLE та PAUSER_ROLE
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        SoulboundDiploma (UDIP)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Стандарт: ERC-721 (NFT)
                        <br />
                        • Призначення: Непередавані токени для дипломів
                        <br />
                        • Особливість: Soulbound - неможливо передати після видачі
                        <br />• Метадані: Зберігаються в IPFS
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Мережа
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • Блокчейн: BNB Smart Chain Testnet
                        <br />
                        • Chain ID: 97
                        <br />
                        • Explorer:{' '}
                        <a href="https://testnet.bscscan.com" target="_blank" rel="noopener noreferrer">
                            testnet.bscscan.com
                        </a>
                        <br />• Комісії: ~$0.10-0.50 за транзакцію
                    </Typography>
                </Box>
            </TabPanel>
        </Box>
    );
};

export default BlockchainManager;
