'use client';

import { useState, useCallback } from 'react';

export type Theme = 'dark' | 'light';

interface UseThemeReturn {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('mc-theme') as Theme;
    if (saved) return saved;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mc-theme', next);
      return next;
    });
  }, []);

  return {
    theme,
    toggle,
    isDark: theme === 'dark',
  };
}

// Theme-aware class names helper
export function useThemeClasses(isDark: boolean, domain?: string) {
  const isChipChip = domain === 'ChipChip';
  
  return {
    bg: isChipChip ? 'bg-white font-sans' : (isDark ? 'bg-[#09090B]' : 'bg-[#FAFAFA]'),
    card: isChipChip
      ? 'bg-[#fafafa] border border-red-100 rounded-lg shadow-sm'
      : (isDark ? 'bg-[#111113] border border-neutral-800 rounded-lg' : 'bg-white border-neutral-200 rounded-lg'),
    heading: isChipChip ? 'text-black' : (isDark ? 'text-white' : 'text-neutral-900'),
    muted: isChipChip ? 'text-red-900/60' : (isDark ? 'text-neutral-400' : 'text-neutral-500'),
    subtle: isChipChip ? 'text-red-900/40' : (isDark ? 'text-neutral-500' : 'text-neutral-400'),
    divider: isChipChip ? 'border-red-100' : (isDark ? 'border-neutral-800' : 'border-neutral-200'),
    inputBg: isChipChip 
      ? 'bg-white border-red-200 text-black placeholder-red-900/30'
      : (isDark 
        ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500' 
        : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'),
    hoverCard: isChipChip
      ? 'hover:bg-red-50 hover:border-red-300 transition-all'
      : (isDark 
        ? 'hover:bg-neutral-800 hover:border-violet-500/30' 
        : 'hover:bg-neutral-50 hover:border-violet-300'),
    progressBg: isChipChip ? 'bg-red-100' : (isDark ? 'bg-neutral-800' : 'bg-neutral-200'),
  };
}