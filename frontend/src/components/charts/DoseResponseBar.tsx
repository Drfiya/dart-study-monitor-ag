/**
 * Dose-response bar chart for specific findings.
 * Shows incidence % by group for a selected finding.
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { GROUP_COLORS } from '../../theme';

interface DoseResponseItem {
    groupName: string;
    value: number;
}

interface Props {
    title: string;
    data: DoseResponseItem[];
    yLabel?: string;
    height?: number;
}

export default function DoseResponseBar({ title, data, yLabel = '% Incidence', height = 250 }: Props) {
    if (!data.length) return null;

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>{title}</Typography>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                        dataKey="groupName"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        angle={-15}
                        textAnchor="end"
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        formatter={(value: number | undefined) => [(value ?? 0).toFixed(1) + '%', 'Incidence']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((_, i) => (
                            <Cell key={i} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
