/**
 * ThemeProvider - 主题上下文提供者 (Light mode only)
 *
 * Dark mode has been removed. This file is kept for backwards compatibility.
 */

'use client';

import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Simplified provider - just passes through children
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}

// Kept for backwards compatibility - returns light theme only
export function useTheme() {
  return {
    theme: 'light' as const,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}

// No-op component - returns null
export function ThemeToggle() {
  return null;
}

// No-op component - returns null
export function ThemeSelector() {
  return null;
}

export default ThemeProvider;
