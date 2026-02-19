/**
 * Stacked bar chart for pregnancy outcomes per group.
 * Shows proportions of pregnant, not pregnant, and aborted.
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import type { PregnancyOutcome } from '../../api';

interface Props {
    data: PregnancyOutcome[];
    height?: number;
}

export default function StackedBarChart({ data, height = 300 }: Props) {
    if (!data.length) return null;

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>
                Pregnancy Outcomes by Group
            </Typography>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                        dataKey="groupName"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        angle={-15}
                        textAnchor="end"
                    />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    <Bar dataKey="pregnant" stackId="a" fill="#10b981" name="Pregnant" />
                    <Bar dataKey="notPregnant" stackId="a" fill="#6366f1" name="Not Pregnant" />
                    <Bar dataKey="aborted" stackId="a" fill="#ef4444" name="Aborted" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
