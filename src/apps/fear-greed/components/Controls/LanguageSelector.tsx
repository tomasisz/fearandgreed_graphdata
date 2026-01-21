import React from 'react';
import { useLanguage, type Language } from '../../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        color: 'var(--text-color)',
        marginLeft: '10px'
      }}
    >
      <option value="en">English</option>
      <option value="zh">简体中文</option>
      <option value="tw">繁體中文</option>
    </select>
  );
};
