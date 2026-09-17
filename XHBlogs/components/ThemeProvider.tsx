"use client";
import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from 'react';

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

let fallbackTheme = true;

function getTheme() {
  try {
    return localStorage.getItem('blog-theme') !== 'light';
  } catch {
    return fallbackTheme;
  }
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('blog-theme-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('blog-theme-change', onChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => null);
  const isDark = theme ?? true;

  useLayoutEffect(() => {
    if (theme !== null) document.documentElement.classList.toggle('dark', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newDark = !getTheme();
    document.documentElement.classList.toggle('dark', newDark);
    try {
      localStorage.setItem('blog-theme', newDark ? 'dark' : 'light');
    } catch {}
    fallbackTheme = newDark;
    window.dispatchEvent(new Event('blog-theme-change'));
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={theme === null ? 'invisible' : 'contents'}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
