import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../utils';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const saved = await db.getTheme();
            if (saved === 'light' || saved === 'dark') setTheme(saved);
            setIsLoaded(true);
        };
        loadTheme();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            db.saveTheme(theme);
            theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
        }
    }, [theme, isLoaded]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
