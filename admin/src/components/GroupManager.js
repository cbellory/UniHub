import React, { useMemo } from 'react';
import {
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const GroupManager = ({ wallets, onOpenProfile }) => {
    // Группируем кошельки по полю group
    const groupedWallets = useMemo(() => {
        const groups = {};
        wallets.forEach((wallet) => {
            const groupName = wallet.group || 'Без групи';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(wallet);
        });
        return groups;
    }, [wallets]);

    // Сортируем названия групп для красивого вывода
    const sortedGroupNames = Object.keys(groupedWallets).sort();

    return (
        <div className="group-manager">
            <Typography variant="h5" gutterBottom className="section-title">
                Керування групами
            </Typography>

            {sortedGroupNames.map((groupName) => (
                <Accordion key={groupName} sx={{ mb: 1, background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
                        aria-controls={`panel-${groupName}-content`}
                        id={`panel-${groupName}-header`}
                    >
                        <Typography sx={{ fontWeight: 'bold' }}>
                            {groupName} ({groupedWallets[groupName].length})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {groupedWallets[groupName].map((wallet, index) => (
                                <div key={wallet.address}>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <span
                                                    style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                                                    onClick={() => onOpenProfile && onOpenProfile(wallet.address)}
                                                >
                                                    {wallet.username || wallet.address}
                                                </span>
                                            }
                                            secondary={
                                                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    {wallet.username && <div style={{ fontSize: '0.8em', opacity: 0.7 }}>{wallet.address}</div>}
                                                    <div>Бали: {wallet.points} | Токени: {wallet.tokenBalance}</div>
                                                </div>
                                            }
                                        />
                                    </ListItem>
                                    {index < groupedWallets[groupName].length - 1 && (
                                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                                    )}
                                </div>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            ))}

            {sortedGroupNames.length === 0 && (
                <Typography>Немає даних про групи.</Typography>
            )}
        </div>
    );
};

export default GroupManager;
