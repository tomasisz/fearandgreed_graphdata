import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language;

    return (
        <div style={{ position: 'relative', display: 'inline-block', marginLeft: '1rem' }}>
            <div className="dropdown" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <Languages size={18} color="var(--primary)" />
                <select 
                    onChange={(e) => changeLanguage(e.target.value)}
                    value={currentLang.startsWith('zh-TW') ? 'zh-TW' : currentLang.startsWith('zh') ? 'zh-CN' : 'en'}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        outline: 'none',
                        appearance: 'none', // Reset default style
                        fontWeight: 'bold'
                    }}
                >
                    <option value="zh-CN" style={{ color: '#000' }}>简体中文</option>
                    <option value="zh-TW" style={{ color: '#000' }}>繁體中文</option>
                    <option value="en" style={{ color: '#000' }}>English</option>
                </select>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
