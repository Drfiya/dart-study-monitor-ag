/**
 * Box plot approximation for litter-based metrics.
 * Uses Recharts bar chart with error bars to show distribution.
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ErrorBar,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import type { GroupBoxData } from '../../api';
import { GROUP_COLORS } from '../../theme';

interface Props {
    title: string;
    data: GroupBoxData[];
    yLabel?: string;
    height?: number;
}

export default function LitterOutcomeBoxplot({ title, data, yLabel, height = 280 }: Props) {
    if (!data.length) return null;

    const chartData = data.map((d, idx) => ({
        name: d.groupName,
        mean: d.mean,
        median: d.median,
        min: d.min,
        max: d.max,
        q1: d.q1,
        q3: d.q3,
        error: [d.mean - d.q1, d.q3 - d.mean],
        fill: GROUP_COLORS[idx % GROUP_COLORS.length],
    }));

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>{title}</Typography>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        angle={-15}
                        textAnchor="end"
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 } : undefined}
                    />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        formatter={(value: number, name: string) => [value.toFixed(2), name]}
                    />
                    <Bar dataKey="mean" name="Mean" radius={[4, 4, 0, 0]}>
                        <ErrorBar dataKey="error" width={6} strokeWidth={1.5} stroke="#94a3b8" />
                        {chartData.map((entry, i) => (
                            <rect key={i} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
