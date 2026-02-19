/**
 * Postnatal Development tab — pup weights, milestones, neurobehavior.
 */
import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, CircularProgress, Typography,
    ToggleButton, ToggleButtonGroup, Stack,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    alpha, useTheme,
} from '@mui/material';
import LineChartByGroup from '../charts/LineChartByGroup';
import LitterOutcomeBoxplot from '../charts/LitterOutcomeBoxplot';
import type { PostnatalData } from '../../api';
import { fetchPostnatalData } from '../../api';

interface Props {
    studyId: string;
}

export default function PostnatalTab({ studyId }: Props) {
    const theme = useTheme();
    const [data, setData] = useState<PostnatalData | null>(null);
    const [sexView, setSexView] = useState<'combined' | 'male' | 'female'>('combined');

    useEffect(() => {
        fetchPostnatalData(studyId).then(setData);
    }, [studyId]);

    if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    if (!data.pupWeightByGroup.length) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No postnatal data available for this study type (EFD studies do not have postnatal endpoints).
                </Typography>
            </Box>
        );
    }

    const pupWeightSeries = sexView === 'combined'
        ? data.pupWeightByGroup
        : data.pupWeightByGroupAndSex.find(s => s.sex === sexView)?.series ?? [];

    return (
        <Box>
            {/* Info banner */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    <strong style={{ color: theme.palette.primary.main }}>PPND Assessment:</strong> Pre- and postnatal development
                    endpoints include pup viability, weight gain, and developmental milestones (pinna detachment, eye
                    opening). Delays or decreases in a dose-related manner may indicate developmental toxicity.
                </Typography>
            </Paper>

            {/* Sex toggle */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <ToggleButtonGroup
                    value={sexView}
                    exclusive
                    onChange={(_, v) => v && setSexView(v)}
                    size="small"
                >
                    <ToggleButton value="combined">Combined</ToggleButton>
                    <ToggleButton value="male">Males</ToggleButton>
                    <ToggleButton value="female">Females</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Grid container spacing={3}>
                {/* Pup body weight */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title={`Pup Body Weight by Group${sexView !== 'combined' ? ` (${sexView}s)` : ''}`}
                            series={pupWeightSeries}
                            xLabel="Postnatal Day"
                            yLabel="Weight (g)"
                            height={350}
                        />
                    </Paper>
                </Grid>

                {/* Developmental milestones */}
                {data.milestoneIncidence.map(milestone => (
                    <Grid size={{ xs: 12, md: 6 }} key={milestone.milestone}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                                {milestone.milestone.charAt(0).toUpperCase() + milestone.milestone.slice(1)}
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Group</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Mean Day</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>% Delayed</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {milestone.groups.map(g => (
                                            <TableRow key={g.groupId} hover>
                                                <TableCell sx={{ color: theme.palette.text.primary }}>{g.groupName}</TableCell>
                                                <TableCell align="center">{g.meanDay.toFixed(1)}</TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        color: g.percentDelayed > 20 ? '#ef4444' : g.percentDelayed > 10 ? '#fbbf24' : '#e2e8f0',
                                                        fontWeight: g.percentDelayed > 10 ? 600 : 400,
                                                    }}
                                                >
                                                    {g.percentDelayed.toFixed(1)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                ))}

                {/* Neurobehavior scores */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot
                            title="Neurobehavior Composite Score"
                            data={data.neurobehaviorByGroup}
                            yLabel="Score"
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
