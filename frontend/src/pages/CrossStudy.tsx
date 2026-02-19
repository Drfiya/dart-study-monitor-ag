/**
 * Cross-Study Analytics page — heatmap comparing studies across endpoints.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Paper, Stack, IconButton, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    alpha, Chip, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import type { CrossStudyData } from '../api';
import { fetchCrossStudyData } from '../api';
import { RISK_COLORS } from '../theme';

function severityBg(severity: 'red' | 'yellow' | 'green'): string {
    return alpha(RISK_COLORS[severity], severity === 'green' ? 0.08 : 0.2);
}

export default function CrossStudy() {
    const navigate = useNavigate();
    const [data, setData] = useState<CrossStudyData | null>(null);

    useEffect(() => {
        fetchCrossStudyData().then(setData);
    }, []);

    if (!data) return null;

    return (
        <Box sx={{ minHeight: '100vh', pb: 6 }}>
            {/* Header */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                    py: 3,
                }}
            >
                <Container maxWidth="xl">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Tooltip title="Back to overview">
                            <IconButton onClick={() => navigate('/')} sx={{ color: '#94a3b8' }}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <ScienceIcon sx={{ fontSize: 32, color: '#60a5fa' }} />
                        <Box>
                            <Typography variant="h5" sx={{ color: '#f1f5f9' }}>
                                Cross-Study Analytics
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                Compare DART risk profiles across studies using SEND-standardized data
                            </Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {/* Info */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)' }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        <strong style={{ color: '#60a5fa' }}>Cross-Study Comparison:</strong> This view demonstrates
                        how SEND-like standardized data enables comparison of DART safety profiles across species
                        and study types. Colors indicate signal severity: <span style={{ color: RISK_COLORS.green }}>■</span> No signal,
                        <span style={{ color: RISK_COLORS.yellow }}> ■</span> Emerging,
                        <span style={{ color: RISK_COLORS.red }}> ■</span> Clear signal.
                    </Typography>
                </Paper>

                {/* Heatmap */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, color: '#e2e8f0', fontWeight: 600 }}>
                        DART Risk Profile Heatmap
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#94a3b8', minWidth: 160 }}>Endpoint</TableCell>
                                    {data.studies.map(study => (
                                        <TableCell
                                            key={study.studyId}
                                            colSpan={4}
                                            align="center"
                                            sx={{ fontWeight: 600, color: '#e2e8f0', borderBottom: 'none', cursor: 'pointer' }}
                                            onClick={() => navigate(`/study/${study.studyId}`)}
                                        >
                                            <Stack alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                    {study.studyName.split(' ').slice(0, 3).join(' ')}
                                                </Typography>
                                                <Stack direction="row" spacing={0.5}>
                                                    <Chip label={study.species} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                                                    <Chip label={study.studyType} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                                                </Stack>
                                            </Stack>
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }} />
                                    {data.studies.flatMap(study => {
                                        const studyHeatmap = data.heatmap.filter(h => h.studyId === study.studyId);
                                        const groups = studyHeatmap[0]?.groups ?? [];
                                        return groups.map(g => (
                                            <TableCell
                                                key={`${study.studyId}-${g.groupName}`}
                                                align="center"
                                                sx={{ fontSize: '0.6rem', color: '#64748b', px: 0.5 }}
                                            >
                                                {g.groupName.split(' ')[0]}
                                            </TableCell>
                                        ));
                                    })}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.endpoints.map(endpoint => (
                                    <TableRow key={endpoint} hover>
                                        <TableCell sx={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.8rem' }}>
                                            {endpoint}
                                        </TableCell>
                                        {data.studies.flatMap(study => {
                                            const row = data.heatmap.find(
                                                h => h.studyId === study.studyId && h.endpoint === endpoint
                                            );
                                            return (row?.groups ?? []).map((g, i) => (
                                                <TableCell
                                                    key={`${study.studyId}-${endpoint}-${i}`}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: severityBg(g.severity),
                                                        color: RISK_COLORS[g.severity],
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        px: 0.5,
                                                    }}
                                                >
                                                    {g.severity === 'green' ? '—' : g.severity === 'yellow' ? '▲' : '▲▲'}
                                                </TableCell>
                                            ));
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Study comparison cards */}
                <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                    {data.studies.map(study => {
                        const studyAlerts = data.heatmap
                            .filter(h => h.studyId === study.studyId)
                            .flatMap(h => h.groups)
                            .filter(g => g.severity !== 'green');
                        const redCount = studyAlerts.filter(a => a.severity === 'red').length;
                        const yellowCount = studyAlerts.filter(a => a.severity === 'yellow').length;

                        return (
                            <Paper
                                key={study.studyId}
                                sx={{
                                    p: 3, flex: 1, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: 'rgba(96,165,250,0.3)', transform: 'translateY(-2px)' },
                                    border: '1px solid rgba(148,163,184,0.08)',
                                }}
                                onClick={() => navigate(`/study/${study.studyId}`)}
                            >
                                <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1 }}>
                                    {study.studyName}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                    <Chip label={study.species} size="small" variant="outlined" />
                                    <Chip label={study.studyType} size="small" variant="outlined" />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ color: RISK_COLORS.red }}>{redCount}</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Red Signals</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" sx={{ color: RISK_COLORS.yellow }}>{yellowCount}</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Yellow Signals</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            </Container>
        </Box>
    );
}
