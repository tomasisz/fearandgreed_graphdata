import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        color: 'var(--text-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
