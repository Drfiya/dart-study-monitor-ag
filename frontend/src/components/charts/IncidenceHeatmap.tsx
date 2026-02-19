/**
 * Heatmap-style table for clinical signs or fetal findings incidence.
 * Rows = finding terms, columns = dose groups, cells colored by intensity.
 */
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Box, alpha,
} from '@mui/material';

interface IncidenceGroup {
    groupName: string;
    groupId: string;
    incidence: number;
    total: number;
}

interface IncidenceRow {
    findingTerm: string;
    groups: IncidenceGroup[];
}

interface Props {
    title: string;
    data: IncidenceRow[];
    valueFormat?: 'count' | 'percent';
}

/** Map intensity 0-1 to a color gradient from dark to red. */
function intensityColor(value: number, max: number): string {
    if (max === 0 || value === 0) return 'transparent';
    const intensity = Math.min(value / Math.max(max, 1), 1);
    if (intensity < 0.25) return alpha('#10b981', 0.2);
    if (intensity < 0.5) return alpha('#fbbf24', 0.3);
    if (intensity < 0.75) return alpha('#f97316', 0.4);
    return alpha('#ef4444', 0.5);
}

export default function IncidenceHeatmap({ title, data, valueFormat = 'count' }: Props) {
    if (!data.length) return null;

    const groupNames = data[0]?.groups.map(g => g.groupName) ?? [];
    const maxValue = Math.max(...data.flatMap(row => row.groups.map(g =>
        valueFormat === 'percent' ? (g.total > 0 ? (g.incidence / g.total) * 100 : 0) : g.incidence
    )));

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>{title}</Typography>
            <TableContainer component={Paper} sx={{ bgcolor: '#111827', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#1e293b', fontWeight: 600, color: '#94a3b8', minWidth: 180 }}>
                                Finding
                            </TableCell>
                            {groupNames.map(name => (
                                <TableCell key={name} align="center" sx={{ bgcolor: '#1e293b', fontWeight: 600, color: '#94a3b8', minWidth: 100 }}>
                                    {name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map(row => (
                            <TableRow key={row.findingTerm} hover>
                                <TableCell sx={{ color: '#e2e8f0', fontSize: '0.8rem' }}>
                                    {row.findingTerm}
                                </TableCell>
                                {row.groups.map(g => {
                                    const displayValue = valueFormat === 'percent'
                                        ? g.total > 0 ? ((g.incidence / g.total) * 100).toFixed(0) + '%' : '0%'
                                        : `${g.incidence}/${g.total}`;
                                    const numValue = valueFormat === 'percent'
                                        ? g.total > 0 ? (g.incidence / g.total) * 100 : 0
                                        : g.incidence;

                                    return (
                                        <TableCell
                                            key={g.groupId}
                                            align="center"
                                            sx={{
                                                bgcolor: intensityColor(numValue, maxValue),
                                                color: '#e2e8f0',
                                                fontSize: '0.8rem',
                                                fontWeight: numValue > 0 ? 600 : 400,
                                            }}
                                        >
                                            {displayValue}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
