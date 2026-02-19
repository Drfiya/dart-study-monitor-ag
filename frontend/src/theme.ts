import { createTheme } from '@mui/material/styles';

/**
 * DART Study Monitor dark theme.
 * Deep navy base with toxicology-appropriate signal colors.
 */
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#60a5fa',    // calm blue
            light: '#93c5fd',
            dark: '#2563eb',
        },
        secondary: {
            main: '#a78bfa',    // soft violet
            light: '#c4b5fd',
            dark: '#7c3aed',
        },
        background: {
            default: '#0b1120',  // deep navy
            paper: '#111827',
        },
        error: {
            main: '#ef4444',
        },
        warning: {
            main: '#f59e0b',
        },
        success: {
            main: '#10b981',
        },
        text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
        },
        divider: 'rgba(148, 163, 184, 0.12)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        body2: { color: '#94a3b8' },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(148, 163, 184, 0.08)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },
    },
});

export default theme;

/** Dose group color palette, consistent across all charts. */
export const GROUP_COLORS = ['#94a3b8', '#34d399', '#fbbf24', '#ef4444'];
export const GROUP_COLOR_MAP: Record<string, string> = {
    'Vehicle Control': '#94a3b8',
    'Control': '#94a3b8',
};

/** Risk badge colors. */
export const RISK_COLORS = {
    red: '#ef4444',
    yellow: '#f59e0b',
    green: '#10b981',
} as const;
