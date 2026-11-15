import React, { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (next: AppTheme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'tadawol_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore storage read errors in restricted iframes
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  const setTheme = (next: AppTheme) => setThemeState(next);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light',
      isDark: false,
      setTheme: () => undefined,
      toggleTheme: () => undefined,
    };
  }
  return ctx;
}

interface ThemeToggleButtonProps {
  compact?: boolean;
  className?: string;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`tadawol-theme-toggle inline-flex items-center justify-center gap-1.5 rounded-full border font-extrabold text-xs transition cursor-pointer shrink-0 ${
        compact ? 'w-9 h-9 p-0' : 'px-3.5 py-2'
      } ${
        isDark
          ? 'bg-[#1D2521] border-[#35443D] text-[#F2BE22] hover:bg-[#27332D] hover:border-[#F2BE22]'
          : 'bg-[#F5F4F0] border-[#CFCBC2] text-[#111111] hover:bg-[#111111] hover:text-white hover:border-[#111111]'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#F2BE22]" />
      ) : (
        <Moon className="w-4 h-4 text-[#007432]" />
      )}
      {!compact && <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
};
