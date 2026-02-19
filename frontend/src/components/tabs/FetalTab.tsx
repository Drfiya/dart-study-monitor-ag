/**
 * Fetal Findings tab — incidence table, dose-response charts, and filters.
 */
import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, CircularProgress, Typography,
    ToggleButton, ToggleButtonGroup, Stack,
    FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    alpha, Chip, useTheme,
} from '@mui/material';
import DoseResponseBar from '../charts/DoseResponseBar';
import type { FetalFindingsData } from '../../api';
import { fetchFetalData } from '../../api';
import { RISK_COLORS } from '../../theme';

interface Props {
    studyId: string;
}

function intensityColor(value: number): string {
    if (value === 0) return 'transparent';
    if (value < 5) return alpha('#10b981', 0.2);
    if (value < 15) return alpha('#fbbf24', 0.3);
    if (value < 30) return alpha('#f97316', 0.4);
    return alpha('#ef4444', 0.5);
}

export default function FetalTab({ studyId }: Props) {
    const theme = useTheme();
    const [data, setData] = useState<FetalFindingsData | null>(null);
    const [viewMode, setViewMode] = useState<'litter' | 'fetus'>('litter');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');
    const [selectedFinding, setSelectedFinding] = useState<string | null>(null);

    useEffect(() => {
        fetchFetalData(studyId).then(setData);
    }, [studyId]);

    if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    if (!data.incidenceTable.length) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No fetal findings data available for this study type.
                </Typography>
            </Box>
        );
    }

    const filteredFindings = data.incidenceTable.filter(row => {
        if (categoryFilter !== 'all' && row.examType !== categoryFilter) return false;
        if (classFilter !== 'all' && row.classification !== classFilter) return false;
        return true;
    });

    // Dose-response chart data for selected finding
    const selectedRow = selectedFinding
        ? data.incidenceTable.find(r => r.findingTerm === selectedFinding)
        : filteredFindings[0];

    const doseResponseData = selectedRow?.groups.map(g => ({
        groupName: g.groupName,
        value: viewMode === 'litter' ? g.percentLitters : g.percentFetuses,
    })) ?? [];

    return (
        <Box>
            {/* Controls */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap alignItems="center">
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                >
                    <ToggleButton value="litter">% Litters Affected</ToggleButton>
                    <ToggleButton value="fetus">% Fetuses Affected</ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Category</InputLabel>
                    <Select value={categoryFilter} label="Category" onChange={e => setCategoryFilter(e.target.value)}>
                        <MenuItem value="all">All Categories</MenuItem>
                        {data.categories.map(c => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Classification</InputLabel>
                    <Select value={classFilter} label="Classification" onChange={e => setClassFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="malformation">Malformations</MenuItem>
                        <MenuItem value="variation">Variations</MenuItem>
                    </Select>
                </FormControl>
            </Stack>

            <Grid container spacing={3}>
                {/* Incidence table */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                            Fetal Findings Incidence Table ({viewMode === 'litter' ? '% Litters' : '% Fetuses'})
                        </Typography>
                        <TableContainer sx={{ maxHeight: 500 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: theme.palette.background.paper, fontWeight: 600, color: theme.palette.text.secondary, minWidth: 200 }}>Finding</TableCell>
                                        <TableCell sx={{ bgcolor: theme.palette.background.paper, fontWeight: 600, color: theme.palette.text.secondary }}>Type</TableCell>
                                        <TableCell sx={{ bgcolor: theme.palette.background.paper, fontWeight: 600, color: theme.palette.text.secondary }}>Class</TableCell>
                                        {filteredFindings[0]?.groups.map(g => (
                                            <TableCell key={g.groupId} align="center" sx={{ bgcolor: theme.palette.background.paper, fontWeight: 600, color: theme.palette.text.secondary, minWidth: 90 }}>
                                                {g.groupName}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredFindings.map(row => (
                                        <TableRow
                                            key={row.findingTerm}
                                            hover
                                            onClick={() => setSelectedFinding(row.findingTerm)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: selectedFinding === row.findingTerm ? alpha(theme.palette.primary.main, 0.08) : undefined,
                                            }}
                                        >
                                            <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}>{row.findingTerm}</TableCell>
                                            <TableCell>
                                                <Chip label={row.examType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.classification}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        bgcolor: row.classification === 'malformation'
                                                            ? alpha(RISK_COLORS.red, 0.15)
                                                            : alpha(RISK_COLORS.yellow, 0.15),
                                                        color: row.classification === 'malformation' ? RISK_COLORS.red : RISK_COLORS.yellow,
                                                    }}
                                                />
                                            </TableCell>
                                            {row.groups.map(g => {
                                                const pct = viewMode === 'litter' ? g.percentLitters : g.percentFetuses;
                                                const count = viewMode === 'litter'
                                                    ? `${g.affectedLitters}/${g.totalLitters}`
                                                    : `${g.affectedFetuses}/${g.totalFetuses}`;
                                                return (
                                                    <TableCell
                                                        key={g.groupId}
                                                        align="center"
                                                        sx={{
                                                            bgcolor: intensityColor(pct),
                                                            color: theme.palette.text.primary,
                                                            fontSize: '0.8rem',
                                                            fontWeight: pct > 0 ? 600 : 400,
                                                        }}
                                                    >
                                                        {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                                                        <Typography variant="caption" display="block" sx={{ color: theme.palette.text.disabled, fontSize: '0.65rem' }}>
                                                            ({count})
                                                        </Typography>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Dose-response chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2 }}>
                        <DoseResponseBar
                            title={`Dose–Response: ${selectedRow?.findingTerm ?? ''}`}
                            data={doseResponseData}
                            yLabel={viewMode === 'litter' ? '% Litters' : '% Fetuses'}
                            height={350}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
