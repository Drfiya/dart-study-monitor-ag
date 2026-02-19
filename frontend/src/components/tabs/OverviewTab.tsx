/**
 * Overview tab — summary tiles, key plots, and alerts panel.
 */
import { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, Chip, Stack, Alert as MuiAlert,
    CircularProgress, alpha, useTheme,
} from '@mui/material';
import LineChartByGroup from '../charts/LineChartByGroup';
import StackedBarChart from '../charts/StackedBarChart';
import type { OverviewData } from '../../api';
import { fetchOverview } from '../../api';
import { RISK_COLORS } from '../../theme';

interface Props {
    studyId: string;
}

function StatusTile({ title, status, color }: { title: string; status: string; color: string }) {
    const theme = useTheme();
    return (
        <Paper sx={{ p: 2.5, bgcolor: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.2)}` }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color }}>
                {status}
            </Typography>
        </Paper>
    );
}

export default function OverviewTab({ studyId }: Props) {
    const theme = useTheme();
    const [data, setData] = useState<OverviewData | null>(null);

    useEffect(() => {
        fetchOverview(studyId).then(setData);
    }, [studyId]);

    if (!data) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    const maternalColor = data.maternalToxicityStatus.includes('detected') ? RISK_COLORS.red
        : data.maternalToxicityStatus.includes('Possible') ? RISK_COLORS.yellow : RISK_COLORS.green;
    const devColor = data.developmentalToxicityStatus.includes('detected') ? RISK_COLORS.red
        : data.developmentalToxicityStatus.includes('Emerging') ? RISK_COLORS.yellow : RISK_COLORS.green;

    const redAlerts = data.alerts.filter(a => a.severity === 'red');
    const yellowAlerts = data.alerts.filter(a => a.severity === 'yellow');

    return (
        <Box>
            {/* Summary tiles */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <StatusTile title="Maternal Toxicity" status={data.maternalToxicityStatus} color={maternalColor} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <StatusTile title="Developmental Toxicity" status={data.developmentalToxicityStatus} color={devColor} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>Design</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {data.study.design?.ichType} • {data.study.species} ({data.study.strain})
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {data.study.route} • {data.study.design?.dosingWindow}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2.5 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>Status</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={data.study.status} size="small" color={data.study.status === 'ongoing' ? 'primary' : 'default'} />
                            {data.study.glpFlag && <Chip label="GLP" size="small" sx={{ color: theme.palette.primary.main }} />}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Alerts panel */}
            {data.alerts.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, border: `1px solid ${alpha(RISK_COLORS.red, 0.15)}` }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: RISK_COLORS.red }}>
                        ⚠ Signals & Alerts ({data.alerts.length})
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {redAlerts.map(alert => (
                            <MuiAlert key={alert.alertId} severity="error" variant="outlined" sx={{ py: 0 }}>
                                {alert.message}
                            </MuiAlert>
                        ))}
                        {yellowAlerts.map(alert => (
                            <MuiAlert key={alert.alertId} severity="warning" variant="outlined" sx={{ py: 0 }}>
                                {alert.message}
                            </MuiAlert>
                        ))}
                    </Stack>
                </Paper>
            )}

            {/* Key plots */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title="Maternal Body Weight"
                            series={data.bodyWeightByGroup}
                            xLabel="Gestation Day"
                            yLabel="Weight (g)"
                        />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <LineChartByGroup
                            title="Food Consumption"
                            series={data.foodConsumptionByGroup}
                            xLabel="Day"
                            yLabel="g/day"
                        />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <StackedBarChart data={data.pregnancyOutcomeByGroup} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
