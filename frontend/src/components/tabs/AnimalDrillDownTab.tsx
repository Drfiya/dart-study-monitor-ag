/**
 * Animal / Litter drill-down tab — dam table with expandable detail panel.
 */
import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, CircularProgress, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Stack, Collapse, IconButton, alpha, useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LineChartByGroup from '../charts/LineChartByGroup';
import type { AnimalDetail, GroupTimeSeries } from '../../api';
import { fetchAnimals } from '../../api';


interface Props {
    studyId: string;
}

function AnimalRow({ animal }: { animal: AnimalDetail }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [open, setOpen] = useState(false);

    const statusColor = animal.pregnancyStatus === 'pregnant' ? '#10b981'
        : animal.pregnancyStatus === 'aborted' ? '#ef4444' : '#94a3b8';

    // Create a single-animal "series" for the detail chart
    const animalBWSeries: GroupTimeSeries[] = [{
        groupName: animal.animalId,
        groupId: animal.animalId,
        doseLevel: animal.doseLevel,
        data: animal.bodyWeights.map(bw => ({ day: bw.day, mean: bw.weight, sem: 0 })),
    }];

    return (
        <>
            <TableRow hover onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                    <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{animal.animalId}</TableCell>
                <TableCell>{animal.groupName}</TableCell>
                <TableCell>
                    <Chip
                        label={animal.pregnancyStatus}
                        size="small"
                        sx={{ bgcolor: alpha(statusColor, 0.15), color: statusColor, fontWeight: 600 }}
                    />
                </TableCell>
                <TableCell align="center">{animal.litter?.liveFetuses ?? '—'}</TableCell>
                <TableCell align="center">
                    {animal.litter ? animal.litter.resorptionsEarly + animal.litter.resorptionsLate : '—'}
                </TableCell>
                <TableCell align="center">
                    {animal.clinicalObservations.length > 0
                        ? <Chip label={`${animal.clinicalObservations.length} obs`} size="small" color="warning" variant="outlined" />
                        : '—'
                    }
                </TableCell>
                <TableCell>
                    {animal.maternalDeathFlag && (
                        <Chip label="Dead" size="small" sx={{ bgcolor: alpha('#ef4444', 0.15), color: '#ef4444' }} />
                    )}
                </TableCell>
            </TableRow>

            {/* Expanded detail */}
            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 3, bgcolor: isDark ? 'rgba(15,23,42,0.5)' : alpha(theme.palette.primary.main, 0.02) }}>
                            <Grid container spacing={3}>
                                {/* Individual body weight chart */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <LineChartByGroup
                                            title={`Body Weight — ${animal.animalId}`}
                                            series={animalBWSeries}
                                            xLabel="Day"
                                            yLabel="Weight (g)"
                                            height={250}
                                        />
                                    </Paper>
                                </Grid>

                                {/* Litter outcomes */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    {animal.litter ? (
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary }}>Litter Outcomes</Typography>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2">Implantations: {animal.litter.implantations}</Typography>
                                                <Typography variant="body2">Corpora Lutea: {animal.litter.corporaLutea}</Typography>
                                                <Typography variant="body2">Early Resorptions: {animal.litter.resorptionsEarly}</Typography>
                                                <Typography variant="body2">Late Resorptions: {animal.litter.resorptionsLate}</Typography>
                                                <Typography variant="body2">Live Fetuses: {animal.litter.liveFetuses}</Typography>
                                                <Typography variant="body2">Dead Fetuses: {animal.litter.deadFetuses}</Typography>
                                                <Typography variant="body2">Mean Fetal Weight: {animal.litter.meanFetalWeight?.toFixed(2)}g</Typography>
                                            </Stack>
                                        </Paper>
                                    ) : (
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="body2" color="text.secondary">No litter data available</Typography>
                                        </Paper>
                                    )}
                                </Grid>

                                {/* Fetal findings */}
                                {animal.fetuses.length > 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                                                Fetal Findings ({animal.fetuses.length} fetuses)
                                            </Typography>
                                            <TableContainer sx={{ maxHeight: 200 }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Fetus ID</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Sex</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Weight</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Status</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Findings</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {animal.fetuses.slice(0, 20).map((f: any) => (
                                                            <TableRow key={f.fetusId}>
                                                                <TableCell sx={{ fontSize: '0.75rem' }}>{f.fetusId}</TableCell>
                                                                <TableCell>{f.sex}</TableCell>
                                                                <TableCell>{f.weight?.toFixed(2)}g</TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={f.viabilityStatus}
                                                                        size="small"
                                                                        color={f.viabilityStatus === 'live' ? 'success' : 'error'}
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    {f.findings?.length > 0
                                                                        ? f.findings.map((ff: any, i: number) => (
                                                                            <Chip
                                                                                key={i}
                                                                                label={ff.findingTerm}
                                                                                size="small"
                                                                                sx={{
                                                                                    mr: 0.5, mb: 0.5, fontSize: '0.65rem',
                                                                                    bgcolor: ff.classification === 'malformation'
                                                                                        ? alpha('#ef4444', 0.15) : alpha('#fbbf24', 0.15),
                                                                                    color: ff.classification === 'malformation' ? '#ef4444' : '#fbbf24',
                                                                                }}
                                                                            />
                                                                        ))
                                                                        : '—'
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Pup data for PPND */}
                                {animal.pups.length > 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                                                Pups ({animal.pups.length})
                                            </Typography>
                                            <TableContainer sx={{ maxHeight: 200 }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Pup ID</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Sex</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Status</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Neurobehavior</TableCell>
                                                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Eye Opening</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {animal.pups.slice(0, 20).map((p: any) => (
                                                            <TableRow key={p.pupId}>
                                                                <TableCell sx={{ fontSize: '0.75rem' }}>{p.pupId}</TableCell>
                                                                <TableCell>{p.sex}</TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={p.viabilityStatus}
                                                                        size="small"
                                                                        color={p.viabilityStatus === 'live' ? 'success' : 'error'}
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '0.7rem' }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{p.neurobehaviorScore ?? '—'}</TableCell>
                                                                <TableCell>
                                                                    {p.milestones?.find((m: any) => m.milestone === 'eye opening')?.dayAchieved ?? '—'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function AnimalDrillDownTab({ studyId }: Props) {
    const theme = useTheme();
    const [animals, setAnimals] = useState<AnimalDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnimals(studyId).then(data => {
            setAnimals(data);
            setLoading(false);
        });
    }, [studyId]);

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    <strong style={{ color: theme.palette.primary.main }}>Animal/Litter Drill-Down:</strong> Click any dam row to expand
                    its individual body weight chart, litter outcomes, and fetal/pup findings.
                </Typography>
            </Paper>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary, width: 50 }} />
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Animal ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Group</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Pregnancy</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Live Fetuses</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Resorptions</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Clinical Signs</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {animals.map(animal => (
                            <AnimalRow key={animal.animalId} animal={animal} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
