/**
 * Study Dashboard page — multi-tab layout with GLP banner and study metadata.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Tabs, Tab, Stack, IconButton,
    Tooltip, Paper, Chip, Button, alpha, Breadcrumbs, Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import type { StudySummary } from '../api';
import { fetchStudies, refreshData } from '../api';
import OverviewTab from '../components/tabs/OverviewTab';
import MaternalTab from '../components/tabs/MaternalTab';
import LitterTab from '../components/tabs/LitterTab';
import FetalTab from '../components/tabs/FetalTab';
import PostnatalTab from '../components/tabs/PostnatalTab';
import AnimalDrillDownTab from '../components/tabs/AnimalDrillDownTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
    return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function StudyDashboard() {
    const { studyId } = useParams<{ studyId: string }>();
    const navigate = useNavigate();
    const [study, setStudy] = useState<StudySummary | null>(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (!studyId) return;
        fetchStudies().then(studies => {
            const found = studies.find(s => s.studyId === studyId);
            if (found) setStudy(found);
        });
    }, [studyId]);

    const handleRefresh = async () => {
        await refreshData();
        const studies = await fetchStudies();
        const found = studies.find(s => s.studyId === studyId);
        if (found) setStudy(found);
    };

    if (!studyId) return null;

    // Determine which tabs to show (EFD vs PPND)
    const isEFD = study?.studyType === 'EFD';
    const isPPND = study?.studyType === 'PPND';

    const tabs = [
        { label: 'Overview', key: 'overview' },
        { label: 'Maternal', key: 'maternal' },
        { label: 'Pregnancy & Litter', key: 'litter' },
        ...(isEFD ? [{ label: 'Fetal Findings', key: 'fetal' }] : []),
        ...(isPPND ? [{ label: 'Postnatal Development', key: 'postnatal' }] : []),
        { label: 'Animal Drill-Down', key: 'drilldown' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', pb: 6 }}>
            {/* GLP Banner */}
            <Box sx={{ bgcolor: 'rgba(96,165,250,0.06)', borderBottom: '1px solid rgba(96,165,250,0.1)', py: 1, px: 3 }}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                    🔒 Prototype – Read-only analytics overlay. Source: Provantis-like reproductive toxicology module.
                    Official GLP records reside in the source system and in signed study reports.
                </Typography>
            </Box>

            {/* Header */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    borderBottom: '1px solid rgba(148,163,184,0.08)',
                    py: 3,
                }}
            >
                <Container maxWidth="xl">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Tooltip title="Back to overview">
                                <IconButton onClick={() => navigate('/')} sx={{ color: '#94a3b8' }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box>
                                <Breadcrumbs sx={{ mb: 0.5 }}>
                                    <Link
                                        component="button"
                                        variant="caption"
                                        underline="hover"
                                        sx={{ color: '#64748b', cursor: 'pointer' }}
                                        onClick={() => navigate('/')}
                                    >
                                        Studies
                                    </Link>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {studyId}
                                    </Typography>
                                </Breadcrumbs>
                                <Typography variant="h5" sx={{ color: '#f1f5f9' }}>
                                    {study?.studyName ?? studyId}
                                </Typography>
                                {study && (
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Chip label={study.species} size="small" variant="outlined" />
                                        <Chip label={study.studyType} size="small" variant="outlined" />
                                        <Chip label={study.strain} size="small" variant="outlined" />
                                        <Chip label={study.route} size="small" variant="outlined" />
                                        {study.glpFlag && (
                                            <Chip label="GLP" size="small" sx={{ bgcolor: alpha('#60a5fa', 0.1), color: '#60a5fa' }} />
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* Provenance metadata */}
                            <Paper sx={{ px: 2, py: 1, bgcolor: 'rgba(15,23,42,0.5)' }}>
                                <Typography variant="caption" display="block" sx={{ color: '#64748b' }}>
                                    Source System ID: {studyId}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ color: '#64748b' }}>
                                    Last refresh: {study?.lastRefresh ? new Date(study.lastRefresh).toLocaleString() : 'N/A'}
                                </Typography>
                            </Paper>
                            <Tooltip title="Refresh data from source system">
                                <IconButton onClick={handleRefresh} sx={{ color: '#60a5fa' }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Tab navigation */}
            <Container maxWidth="xl">
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {tabs.map((tab, i) => (
                            <Tab key={tab.key} label={tab.label} />
                        ))}
                    </Tabs>
                </Box>

                {/* Tab panels */}
                <TabPanel value={tabValue} index={0}>
                    <OverviewTab studyId={studyId} />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <MaternalTab studyId={studyId} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <LitterTab studyId={studyId} />
                </TabPanel>
                {isEFD && (
                    <TabPanel value={tabValue} index={3}>
                        <FetalTab studyId={studyId} />
                    </TabPanel>
                )}
                {isPPND && (
                    <TabPanel value={tabValue} index={3}>
                        <PostnatalTab studyId={studyId} />
                    </TabPanel>
                )}
                <TabPanel value={tabValue} index={tabs.length - 1}>
                    <AnimalDrillDownTab studyId={studyId} />
                </TabPanel>
            </Container>
        </Box>
    );
}
