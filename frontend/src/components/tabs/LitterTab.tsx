/**
 * Pregnancy & Litter Outcomes tab — box plots, litter summary table.
 */
import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, CircularProgress, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    alpha, useTheme,
} from '@mui/material';
import LitterOutcomeBoxplot from '../charts/LitterOutcomeBoxplot';
import type { LitterData } from '../../api';
import { fetchLitterData } from '../../api';

interface Props {
    studyId: string;
}

export default function LitterTab({ studyId }: Props) {
    const theme = useTheme();
    const [data, setData] = useState<LitterData | null>(null);

    useEffect(() => {
        fetchLitterData(studyId).then(setData);
    }, [studyId]);

    if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box>
            {/* Info banner */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    <strong style={{ color: theme.palette.primary.main }}>Litter-Based Evaluation:</strong> In DART studies, the litter is
                    the primary unit for statistical analysis. Per-litter metrics shown here include implantation sites,
                    resorptions, and fetal counts. Pre- and post-implantation loss are calculated as percentages.
                </Typography>
            </Paper>

            {/* Box plots */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Implantations per Litter" data={data.implantations} yLabel="Count" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Live Fetuses per Litter" data={data.liveFetuses} yLabel="Count" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Early Resorptions per Litter" data={data.earlyResorptions} yLabel="Count" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Late Resorptions per Litter" data={data.lateResorptions} yLabel="Count" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Pre-Implantation Loss (%)" data={data.preImplantationLoss} yLabel="%" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Post-Implantation Loss (%)" data={data.postImplantationLoss} yLabel="%" />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LitterOutcomeBoxplot title="Mean Fetal Weight" data={data.fetalWeights} yLabel="g" />
                    </Paper>
                </Grid>
            </Grid>

            {/* Summary table */}
            <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.text.primary }}>
                    Litter Summary Table
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Group', 'Dose', 'Dams', 'Pregnant', 'Litters', 'Mean Litter Size',
                                    'Mean Implant.', 'Mean Resorp.', 'Mean Live', 'Mean Fetal Wt (g)'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>{h}</TableCell>
                                    ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.litterSummaryTable.map(row => (
                                <TableRow key={row.groupName} hover>
                                    <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}>{row.groupName}</TableCell>
                                    <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}>{row.doseLevel}</TableCell>
                                    <TableCell align="center">{row.dams}</TableCell>
                                    <TableCell align="center">{row.pregnantDams}</TableCell>
                                    <TableCell align="center">{row.littersEvaluated}</TableCell>
                                    <TableCell align="center">{row.meanLitterSize}</TableCell>
                                    <TableCell align="center">{row.meanImplantations}</TableCell>
                                    <TableCell align="center">{row.meanResorptions}</TableCell>
                                    <TableCell align="center">{row.meanLiveFetuses}</TableCell>
                                    <TableCell align="center">{row.meanFetalWeight}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
