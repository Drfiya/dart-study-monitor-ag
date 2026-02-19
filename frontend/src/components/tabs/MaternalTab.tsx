/**
 * Maternal tab — body weight, food consumption, clinical signs heatmap.
 */
import { useState, useEffect } from 'react';
import { Box, Grid, Paper, CircularProgress, Typography, alpha, useTheme } from '@mui/material';
import LineChartByGroup from '../charts/LineChartByGroup';
import IncidenceHeatmap from '../charts/IncidenceHeatmap';
import type { MaternalData } from '../../api';
import { fetchMaternalData } from '../../api';

interface Props {
    studyId: string;
}

export default function MaternalTab({ studyId }: Props) {
    const theme = useTheme();
    const [data, setData] = useState<MaternalData | null>(null);

    useEffect(() => {
        fetchMaternalData(studyId).then(setData);
    }, [studyId]);

    if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box>
            {/* Interpretation guidance */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    <strong style={{ color: theme.palette.primary.main }}>Maternal Toxicity Assessment:</strong> Decreased body weight gain
                    and reduced food consumption are key indicators of maternal toxicity. Clinical signs provide supporting
                    evidence. Assess maternal effects independently from developmental findings.
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                {/* Body weight */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title="Maternal Body Weight"
                            series={data.bodyWeight}
                            xLabel="Day"
                            yLabel="Weight (g)"
                            height={350}
                        />
                    </Paper>
                </Grid>

                {/* Body weight change */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title="Body Weight % Change from Baseline"
                            series={data.bodyWeightChange}
                            xLabel="Day"
                            yLabel="% Change"
                            height={350}
                        />
                    </Paper>
                </Grid>

                {/* Food consumption */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title="Food Consumption"
                            series={data.foodConsumption}
                            xLabel="Day Interval Start"
                            yLabel="g/day"
                            height={300}
                        />
                    </Paper>
                </Grid>

                {/* Clinical signs heatmap */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                        <IncidenceHeatmap
                            title="Maternal Clinical Signs Incidence"
                            data={data.clinicalSignsIncidence}
                            valueFormat="percent"
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
