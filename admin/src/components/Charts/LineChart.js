import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const LineChart = ({ data, labels, color = '#6366f1', height = 200 }) => {
    const theme = useTheme();

    if (!data || data.length === 0) {
        return (
            <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                No Data
            </Box>
        );
    }

    const max = Math.max(...data, 1);
    const min = 0;
    const range = max - min;

    // Dimensions
    const w = 100;
    const h = 50;
    const padding = 2;

    // Safe calculations
    const safeRange = range === 0 ? 1 : range;
    const safeLen = data.length <= 1 ? 1 : data.length - 1;

    // Calculate Points
    const points = data.map((d, i) => {
        const val = typeof d === 'number' ? d : 0;
        const x = padding + (i / safeLen) * (w - 2 * padding);
        const y = h - padding - ((val - min) / safeRange) * (h - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    // Area Path (for gradient)
    const areaPath = `
    ${points.split(' ')[0]} 
    ${points.replaceAll(',', ' ')} 
    ${points.split(' ').slice(-1)[0].split(',')[0]} ${h}
    ${points.split(' ')[0].split(',')[0]} ${h}
  `;

    return (
        <Box sx={{ width: '100%', height: height, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <polyline
                    points={`${points.split(' ')[0].split(',')[0]},${h} ${points} ${points.split(' ').slice(-1)[0].split(',')[0]},${h}`}
                    fill={`url(#gradient-${color})`}
                    stroke="none"
                />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Dots */}
                {data.map((d, i) => {
                    const val = typeof d === 'number' ? d : 0;
                    const x = padding + (i / safeLen) * (w - 2 * padding);
                    const y = h - padding - ((val - min) / safeRange) * (h - 2 * padding);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill={theme.palette.background.paper}
                            stroke={color}
                            strokeWidth="0.5"
                        />
                    );
                })}
            </svg>

            {/* Labels Overlay */}
            <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                px: 1
            }}>
                {labels.map((label, i) => (
                    <Typography key={i} variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                        {label}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default LineChart;
