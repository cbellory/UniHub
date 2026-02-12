import React from 'react';
import { Box, Typography } from '@mui/material';

const PieChart = ({ data, size = 150 }) => {
    // data: [{ value, color, label }]

    const total = data.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
    let accumulatedAngle = 0;

    if (total === 0) return <Box>No Data</Box>;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative', width: size, height: size }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    {data.map((item, i) => {
                        const val = Number(item.value) || 0;
                        const percentage = total === 0 ? 0 : val / total;
                        const angle = percentage * 360;

                        // Large arc flag
                        const largeArcFlag = percentage > 0.5 ? 1 : 0;

                        // Start coordinates
                        const startX = 50 + 50 * Math.cos((Math.PI * accumulatedAngle) / 180);
                        const startY = 50 + 50 * Math.sin((Math.PI * accumulatedAngle) / 180);

                        // End coordinates
                        const endX = 50 + 50 * Math.cos((Math.PI * (accumulatedAngle + angle)) / 180);
                        const endY = 50 + 50 * Math.sin((Math.PI * (accumulatedAngle + angle)) / 180);

                        const path = `
              M 50 50
              L ${startX} ${startY}
              A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}
              Z
            `;

                        const element = (
                            <path
                                key={i}
                                d={path}
                                fill={item.color}
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth="1"
                            />
                        );

                        accumulatedAngle += angle;
                        return element;
                    })}

                    {/* Inner Circle for Donut Effect */}
                    <circle cx="50" cy="50" r="35" fill="rgba(24, 24, 27, 1)" />
                </svg>

                {/* Center Text */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{total}</Typography>
                </Box>
            </Box>

            {/* Legend */}
            <Box>
                {data.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, mr: 1 }} />
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {Math.round((item.value / total) * 100)}% ({item.value})
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default PieChart;
