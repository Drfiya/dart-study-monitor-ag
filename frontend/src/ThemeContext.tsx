/**
 * ThemeContext — manages dark/light mode with localStorage persistence.
 * Provides a toggle function consumed by header components.
 */
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
    mode: ThemeMode;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'dark',
    toggleMode: () => { },
});

/** Hook to access the current mode and toggle function. */
export function useThemeMode() {
    return useContext(ThemeContext);
}

/** Wraps the app with a mode-aware MUI ThemeProvider. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem('dart-theme-mode');
        return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    });

    const toggleMode = () => {
        setMode(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('dart-theme-mode', next);
            return next;
        });
    };

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}
