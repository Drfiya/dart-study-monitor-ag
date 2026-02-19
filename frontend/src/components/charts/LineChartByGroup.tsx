/**
 * Reusable line chart component — displays time series data grouped by dose.
 * Supports error bars (SEM), group coloring, and tooltips.
 */
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import type { GroupTimeSeries } from '../../api';
import { GROUP_COLORS } from '../../theme';

interface Props {
    title: string;
    series: GroupTimeSeries[];
    xLabel?: string;
    yLabel?: string;
    height?: number;
}

export default function LineChartByGroup({ title, series, xLabel = 'Day', yLabel, height = 320 }: Props) {
    if (!series.length || !series[0].data.length) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No data available</Typography>
            </Box>
        );
    }

    // Merge all series into a flat array keyed by day
    const allDays = [...new Set(series.flatMap(s => s.data.map(d => d.day)))].sort((a, b) => a - b);
    const merged = allDays.map(day => {
        const point: Record<string, number> = { day };
        series.forEach((s, i) => {
            const dp = s.data.find(d => d.day === day);
            point[`group${i}`] = dp?.mean ?? NaN;
        });
        return point;
    });

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>{title}</Typography>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={merged} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                        dataKey="day"
                        stroke="#64748b"
                        label={{ value: xLabel, position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12 }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 } : undefined}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                    />
                    {series.map((s, i) => (
                        <Line
                            key={s.groupId}
                            type="monotone"
                            dataKey={`group${i}`}
                            name={s.groupName}
                            stroke={GROUP_COLORS[i % GROUP_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
}
