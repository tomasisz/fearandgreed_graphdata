import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

const UserLogin: React.FC = () => {
  const { login } = useUser();
  const [inputName, setInputName] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      login(inputName.trim());
    }
  };

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100%' 
    }}>
        <div className="user-login glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>{t('login_title')}</h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>{t('login_placeholder')}</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder={t('login_placeholder')} 
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              autoFocus
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                padding: '1rem',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1.1rem',
                outline: 'none'
              }}
            />
            <button type="submit">{t('login_btn')}</button>
          </form>
        </div>
    </div>
  );
};

export default UserLogin;
