import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

const nightColors = {
  background:    '#1a0a2e',
  card:          '#2d1b4e',
  cardElevated:  '#3d2463',
  text:          '#ffffff',
  textSecondary: 'rgba(255,255,255,0.65)',
  primary:       '#a855f7',
  secondary:     '#f472b6',
  accent:        '#fbbf24',
  error:         '#ef4444',
  border:        'rgba(255,255,255,0.12)',
  placeholder:   'rgba(255,255,255,0.35)',
  tabBar:        '#110720',
};

const dayColors = {
  background:    '#f5f0ff',
  card:          '#ffffff',
  cardElevated:  '#ede9fe',
  text:          '#1a0a2e',
  textSecondary: '#6b21a8',
  primary:       '#7c3aed',
  secondary:     '#db2777',
  accent:        '#d97706',
  error:         '#dc2626',
  border:        '#e9d5ff',
  placeholder:   '#9ca3af',
  tabBar:        '#ffffff',
};

export type Colors = typeof nightColors;

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  colors: Colors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const colors = theme === 'dark' ? nightColors : dayColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colors, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
