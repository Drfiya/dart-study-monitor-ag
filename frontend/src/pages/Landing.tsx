import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Card, CardContent, CardActionArea,
    Chip, Grid, TextField, MenuItem, Select, FormControl, InputLabel,
    Button, Stack, IconButton, Tooltip, alpha, useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import type { StudySummary } from '../api';
import { fetchStudies, refreshData } from '../api';
import { RISK_COLORS } from '../theme';
import { useThemeMode } from '../ThemeContext';

const studyTypeLabels: Record<string, string> = {
    EFD: 'Embryo-Fetal Development',
    PPND: 'Pre/Postnatal Development',
    Fertility: 'Fertility',
    DNT: 'Developmental Neurotoxicity',
};

function RiskBadge({ severity }: { severity: 'red' | 'yellow' | 'green' }) {
    const icons = {
        red: <ErrorIcon sx={{ fontSize: 18 }} />,
        yellow: <WarningAmberIcon sx={{ fontSize: 18 }} />,
        green: <CheckCircleIcon sx={{ fontSize: 18 }} />,
    };
    const labels = { red: 'High Risk', yellow: 'Emerging', green: 'No Signals' };

    return (
        <Chip
            icon={icons[severity]}
            label={labels[severity]}
            size="small"
            sx={{
                bgcolor: alpha(RISK_COLORS[severity], 0.15),
                color: RISK_COLORS[severity],
                borderColor: alpha(RISK_COLORS[severity], 0.3),
                border: '1px solid',
                fontWeight: 600,
            }}
        />
    );
}

export default function Landing() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { mode, toggleMode } = useThemeMode();
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [search, setSearch] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const isDark = mode === 'dark';

    useEffect(() => {
        fetchStudies().then(setStudies);
    }, []);

    const handleRefresh = async () => {
        await refreshData();
        const data = await fetchStudies();
        setStudies(data);
    };

    const filtered = studies.filter(s => {
        if (search && !s.studyId.toLowerCase().includes(search.toLowerCase())
            && !s.studyName.toLowerCase().includes(search.toLowerCase())) return false;
        if (speciesFilter !== 'all' && s.species !== speciesFilter) return false;
        if (typeFilter !== 'all' && s.studyType !== typeFilter) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        return true;
    });

    /** Header gradient adapts to mode. */
    const headerBg = isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #e0e7ff 100%)';

    return (
        <Box sx={{ minHeight: '100vh', pb: 6 }}>
            {/* Header */}
            <Box
                sx={{
                    background: headerBg,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    py: 4,
                    mb: 4,
                }}
            >
                <Container maxWidth="xl">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <ScienceIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                            <Box>
                                <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
                                    DART Study Monitor
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                                    Developmental &amp; Reproductive Toxicology Analytics
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <IconButton onClick={toggleMode} sx={{ color: theme.palette.text.secondary }}>
                                    {isDark ? <LightModeIcon /> : <DarkModeIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Cross-Study Analytics">
                                <Button
                                    variant="outlined"
                                    startIcon={<CompareArrowsIcon />}
                                    onClick={() => navigate('/cross-study')}
                                    sx={{ borderColor: theme.palette.divider, color: theme.palette.text.secondary }}
                                >
                                    Cross-Study
                                </Button>
                            </Tooltip>
                            <Tooltip title="Refresh data from source system">
                                <IconButton onClick={handleRefresh} sx={{ color: theme.palette.primary.main }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl">
                {/* Filters */}
                <Stack direction="row" spacing={2} sx={{ mb: 4 }} flexWrap="wrap" useFlexGap>
                    <TextField
                        size="small"
                        placeholder="Search by Study ID or Name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: theme.palette.text.secondary }} /> }}
                        sx={{ minWidth: 280 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Species</InputLabel>
                        <Select value={speciesFilter} label="Species" onChange={e => setSpeciesFilter(e.target.value)}>
                            <MenuItem value="all">All Species</MenuItem>
                            <MenuItem value="rat">Rat</MenuItem>
                            <MenuItem value="rabbit">Rabbit</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Study Type</InputLabel>
                        <Select value={typeFilter} label="Study Type" onChange={e => setTypeFilter(e.target.value)}>
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="EFD">EFD</MenuItem>
                            <MenuItem value="PPND">PPND</MenuItem>
                            <MenuItem value="Fertility">Fertility</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="ongoing">Ongoing</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                {/* Study cards */}
                <Grid container spacing={3}>
                    {filtered.map(study => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={study.studyId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: alpha(theme.palette.primary.main, 0.3),
                                        transform: 'translateY(-2px)',
                                        boxShadow: isDark
                                            ? '0 8px 32px rgba(0,0,0,0.3)'
                                            : '0 8px 32px rgba(0,0,0,0.08)',
                                    },
                                }}
                            >
                                <CardActionArea
                                    onClick={() => navigate(`/study/${study.studyId}`)}
                                    sx={{ height: '100%', p: 0 }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        {/* Header row */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                            <Box>
                                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1 }}>
                                                    {study.studyId}
                                                </Typography>
                                                <Typography variant="h6" sx={{ lineHeight: 1.3, mt: 0.5 }}>
                                                    {study.studyName}
                                                </Typography>
                                            </Box>
                                            <RiskBadge severity={study.riskBadge} />
                                        </Stack>

                                        {/* Study metadata chips */}
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                            <Chip label={study.species} size="small" variant="outlined" />
                                            <Chip label={studyTypeLabels[study.studyType] || study.studyType} size="small" variant="outlined" />
                                            <Chip
                                                label={study.status}
                                                size="small"
                                                color={study.status === 'ongoing' ? 'primary' : 'default'}
                                                variant="outlined"
                                            />
                                            {study.glpFlag && (
                                                <Chip label="GLP" size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }} />
                                            )}
                                        </Stack>

                                        {/* Quick indicators */}
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: 1.5,
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: isDark ? 'rgba(15,23,42,0.5)' : alpha(theme.palette.primary.main, 0.04),
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>{study.design.numberOfGroups}</Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Groups</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>{study.totalDams}</Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Dams</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>{study.percentPregnant}%</Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Pregnant</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" sx={{ color: RISK_COLORS[study.riskBadge] }}>{study.activeAlerts}</Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Alerts</Typography>
                                            </Box>
                                        </Box>

                                        {/* Design info */}
                                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                                                {study.design.ichType} • {study.design.dosingWindow}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                                                {study.startDate}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Footer provenance */}
                <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        Prototype – Read-only analytics overlay. Source system: Provantis-like reproductive toxicology module.
                        Data refreshed: {studies[0]?.lastRefresh ? new Date(studies[0].lastRefresh).toLocaleString() : 'N/A'}
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
