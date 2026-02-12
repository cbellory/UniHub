// Function to generate a color from a string (wallet address)
export const stringToColor = (string) => {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
};

// Function to generate Avatar props (style + children)
export const getAvatarProps = (avatarUrl, address) => {
    // 1. If real URL exists, return standard src
    if (avatarUrl && avatarUrl.trim() !== '') {
        return {
            src: avatarUrl
        };
    }

    // 2. Fallback: Generate Color Avatar
    const safeAddress = address || 'Anonymous';
    return {
        sx: {
            bgcolor: stringToColor(safeAddress),
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            border: '1px solid rgba(255,255,255,0.2)'
        },
        children: safeAddress.slice(0, 2).toUpperCase() // First 2 chars as initials
    };
};

// Keep old function for backwards compatibility just in case, but redirect to null
// so components relying on src="{getAvatarUrl(...)}" stop trying to load broken URLs
export const getAvatarUrl = (avatarUrl, address) => {
    if (avatarUrl) return avatarUrl;
    return null;
};
