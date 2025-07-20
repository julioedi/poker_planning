'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import router from 'next/router';
import { usePathname } from 'next/navigation';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'switch';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'icon' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const iconSize = iconSizes[size];
  const pathname = usePathname();
  if (pathname.includes('dashboard/settings')) {
    return null;
  }
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${className}`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <Moon size={iconSize} className="text-gray-600 dark:text-gray-400" />
        ) : (
          <Sun size={iconSize} className="text-gray-400 dark:text-gray-300" />
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${className}`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <>
            <Moon size={16} />
            <span>Dark</span>
          </>
        ) : (
          <>
            <Sun size={16} />
            <span>Light</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
        } ${className}`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">
          {theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        </span>
      </button>
    );
  }

  return null;
}; 