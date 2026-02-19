import { createTheme, type PaletteMode } from '@mui/material/styles';

/**
 * Creates a MUI theme configured for the given mode.
 * Both modes share typography, shape, and component overrides.
 * Palette colors adapt to light / dark.
 */
export function createAppTheme(mode: PaletteMode) {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? '#60a5fa' : '#2563eb',
                light: isDark ? '#93c5fd' : '#60a5fa',
                dark: '#1d4ed8',
            },
            secondary: {
                main: isDark ? '#a78bfa' : '#7c3aed',
                light: isDark ? '#c4b5fd' : '#a78bfa',
                dark: '#5b21b6',
            },
            background: {
                default: isDark ? '#0b1120' : '#f1f5f9',
                paper: isDark ? '#111827' : '#ffffff',
            },
            error: { main: '#ef4444' },
            warning: { main: '#f59e0b' },
            success: { main: '#10b981' },
            text: {
                primary: isDark ? '#f1f5f9' : '#0f172a',
                secondary: isDark ? '#94a3b8' : '#475569',
            },
            divider: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)',
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            subtitle1: { fontWeight: 500 },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                    }),
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: { backgroundImage: 'none' },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: { textTransform: 'none' as const, fontWeight: 500, fontSize: '0.875rem' },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: { fontWeight: 600 },
                },
            },
        },
    });
}

/** Default export kept for backward-compat (dark theme). */
export default createAppTheme('dark');

/** Dose-group color palette — identical across modes. */
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
