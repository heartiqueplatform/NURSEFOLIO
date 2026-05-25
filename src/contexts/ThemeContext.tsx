/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        try {
            const persisted = localStorage.getItem('theme-mode');
            if (persisted === 'light' || persisted === 'dark') {
                return persisted;
            }
            // Read system preference as fallback
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch (err) {
            console.warn('[THEME] Could not read theme preference from storage', err);
        }
        return 'light';
    });

    useEffect(() => {
        try {
            localStorage.setItem('theme-mode', themeMode);
        } catch (err) {
            console.warn('[THEME] Could not persist theme preference to storage', err);
        }

        const root = window.document.documentElement;
        if (themeMode === 'dark') {
            root.classList.add('dark');
            console.log('[THEME] Global dark mode activated on document elements');
        } else {
            root.classList.remove('dark');
            console.log('[THEME] Global light mode activated on document elements');
        }
    }, [themeMode]);

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ themeMode, toggleThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }
    return context;
};
