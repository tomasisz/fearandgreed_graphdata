import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTranslation } from 'react-i18next';

interface ResultModalProps {
  wpm: number;
  accuracy: number;
  errors: number;
  difficulty: string;
  isCaught?: boolean;
  onRestart: () => void;
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ wpm, accuracy, errors, difficulty, isCaught, onRestart, onClose }) => {
  const { t } = useTranslation();
  const { submitScore } = useLeaderboard();
  const userContext = useContext(UserContext);
  const username = userContext?.username;
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!username || submitted || submitting) return;
    setSubmitting(true);
    const success = await submitScore(username, wpm, accuracy, difficulty, !isCaught);
    setSubmitting(false);
    if (success) setSubmitted(true);
  };
  
  // Auto-submit if user is logged in
  React.useEffect(() => {
    if (username && !submitted && !submitting) {
        handleSubmit();
    }
  }, [username]);

  const isBusted = !!isCaught;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(10,15,30,0.95)',
        border: `2px solid ${isBusted ? '#ff0055' : 'var(--primary)'}`,
        borderRadius: '15px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: `0 0 30px ${isBusted ? 'rgba(255,0,85,0.3)' : 'var(--glass-border)'}`,
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '5px'
          }}
          title="Close"
        >×</button>

        <h2 style={{ 
          color: isBusted ? '#ff0055' : 'var(--primary)', 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          textShadow: `0 0 10px ${isBusted ? '#ff0055' : 'var(--primary)'}`
        }}>
          {isBusted ? t('result_busted') : t('result_escaped')}
        </h2>
        
        {isBusted && (
            <p style={{ color: '#fff', marginBottom: '1.5rem' }}>
                {t('result_fail_msg')}
            </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{t('stat_speed')}</div>
            <div style={{ fontSize: '2rem', color: '#fff' }}>{wpm}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{t('stat_wpm')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{t('stat_acc')}</div>
            <div style={{ fontSize: '2rem', color: accuracy >= 95 ? 'var(--success)' : '#fff' }}>{accuracy}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{t('stat_errors')}</div>
            <div style={{ fontSize: '2rem', color: '#ff0055' }}>{errors}</div>
          </div>
        </div>

        {submitting && <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{t('result_submitting')}</div>}
        {submitted && <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{t('result_saved')}</div>}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={onRestart} autoFocus style={{
                padding: '0.8rem 2rem',
                fontSize: '1.2rem',
                background: isBusted ? '#ff0055' : 'var(--primary)',
                color: '#000',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>{t('result_play_again')}</button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
