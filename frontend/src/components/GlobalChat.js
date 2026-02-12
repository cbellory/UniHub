import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, IconButton, Typography, Avatar,
    Fab, Fade, Tooltip, Badge
} from '@mui/material';
import { Send, ChatBubbleOutline, Close, SmartToy } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { sounds } from '../utils/SoundManager';
import { getAvatarProps } from '../utils/avatarUtils';

const GlobalChat = ({ account, profile, onOpenProfile, onStateChange }) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Notify parent about state change
    useEffect(() => {
        if (onStateChange) {
            onStateChange(isOpen);
        }
    }, [isOpen, onStateChange]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        // Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Chat connected');
        };

        ws.current.onmessage = (event) => {
            try {
                let data = event.data;
                // Server now guarantees string text (JSON)
                if (typeof data !== 'string') return;

                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = {
                        type: 'system',
                        text: data,
                        id: Date.now()
                    };
                }

                if (parsed.type === 'chat' || parsed.type === 'system') {
                    setMessages(prev => [...prev, parsed]);
                    // Play sound if not from me
                    if (parsed.sender !== account && parsed.type === 'chat') {
                        sounds.playMessage();
                    }
                    if (!isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            } catch (err) {
                console.error("Chat message error", err);
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [isOpen]);

    const handleSend = () => {
        if (!inputText.trim() || !ws.current) return;

        const msg = {
            type: 'chat',
            text: inputText.trim(),
            sender: account,
            username: profile?.username || 'Агент',
            avatar: profile?.avatarUrl,
            timestamp: new Date().toISOString()
        };

        ws.current.send(JSON.stringify(msg));
        setMessages(prev => [...prev, msg]);
        sounds.playClick();

        setInputText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const toggleChat = () => {
        sounds.playClick();
        setIsOpen(!isOpen);
        if (!isOpen) setUnreadCount(0);
    };

    return (
        <>
            {/* Floating Action Button */}
            <Tooltip title="Глобальний Чат" placement="left">
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={toggleChat}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                        display: { xs: isOpen ? 'none' : 'flex', sm: 'flex' }, // HIDE ON MOBILE WHEN OPEN
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        animation: unreadCount > 0 ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                            '0%': { boxShadow: '0 0 0 0 rgba(217, 70, 239, 0.7)' },
                            '70%': { boxShadow: '0 0 0 15px rgba(217, 70, 239, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(217, 70, 239, 0)' }
                        }
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error">
                        {isOpen ? <Close /> : <ChatBubbleOutline />}
                    </Badge>
                </Fab>
            </Tooltip>

            {/* Chat Window */}
            <Fade in={isOpen}>
                <Paper
                    elevation={10}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 0, sm: 100 },
                        right: { xs: 0, sm: 24 },
                        width: { xs: '100%', sm: 350 },
                        height: { xs: '100%', sm: 500 },
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 999,
                        borderRadius: { xs: 0, sm: '20px' },
                        overflow: 'hidden',
                        background: alpha('#0f172a', 0.85), // Darker glass
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 2,
                        background: alpha(theme.palette.primary.main, 0.1),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToy sx={{ color: theme.palette.secondary.main }} />
                            <Typography variant="subtitle1" fontWeight="bold">Глобальний Чат</Typography>
                        </Box>
                        {/* Mobile Close Button - IMPROVED VISIBILITY */}
                        <IconButton
                            size="small"
                            onClick={toggleChat}
                            sx={{
                                display: { xs: 'flex', sm: 'none' }, // Only on mobile
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { background: theme.palette.primary.dark, borderRadius: '4px' }
                    }}>
                        <Typography variant="caption" align="center" sx={{ color: 'text.secondary', display: 'block', my: 2 }}>
                            --- З'єднання встановлено ---
                        </Typography>

                        {messages.map((msg, index) => {
                            const isMe = msg.sender === account;
                            const isSystem = msg.type === 'system';

                            if (isSystem) {
                                return (
                                    <Typography key={index} variant="caption" align="center" sx={{ color: theme.palette.info.main, fontStyle: 'italic' }}>
                                        {msg.text}
                                    </Typography>
                                );
                            }

                            return (
                                <Box key={index} sx={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    {!isMe && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1 }}>
                                            <Avatar
                                                {...getAvatarProps(msg.avatar, msg.sender)}
                                                sx={{
                                                    ...getAvatarProps(msg.avatar, msg.sender).sx, // Merge generated color sx
                                                    width: 20,
                                                    height: 20,
                                                    cursor: 'pointer',
                                                    border: '1px solid rgba(255,255,255,0.3)'
                                                }}
                                                onClick={() => onOpenProfile && onOpenProfile(msg)}
                                            />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'text.secondary',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer',
                                                    '&:hover': { color: theme.palette.primary.light }
                                                }}
                                                onClick={() => onOpenProfile && onOpenProfile(msg)}
                                            >
                                                {msg.username}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: '16px',
                                        borderTopRightRadius: isMe ? '4px' : '16px',
                                        borderTopLeftRadius: !isMe ? '4px' : '16px',
                                        bgcolor: isMe ? alpha(theme.palette.primary.main, 0.8) : alpha(theme.palette.background.paper, 0.6),
                                        border: `1px solid ${isMe ? 'transparent' : alpha(theme.palette.divider, 0.1)}`,
                                        color: '#fff',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}>
                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                            {msg.text}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{
                        p: 2,
                        gap: 1,
                        display: 'flex',
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        background: alpha(theme.palette.background.paper, 0.4)
                    }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Введіть повідомлення..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px',
                                    bgcolor: 'rgba(0,0,0,0.2)'
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                        >
                            <Send />
                        </IconButton>
                    </Box>
                </Paper>
            </Fade>
        </>
    );
};

export default GlobalChat;
