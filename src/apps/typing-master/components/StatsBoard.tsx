import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatsBoardProps {
  wpm: number;
  accuracy: number;
  timeLeft?: number; // Optional if we do countdown
  errors: number;
}

const StatsBoard: React.FC<StatsBoardProps> = ({ wpm, accuracy, errors }) => {
  const { t } = useTranslation();

  return (
    <div className="stats-board glass-panel" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
      <div className="stat-item">
        <div className="stat-label" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>{t('stat_speed')}</div>
        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{wpm}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>{t('stat_acc')}</div>
        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{accuracy}%</div>
      </div>
      <div className="stat-item">
        <div className="stat-label" style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>{t('stat_errors')}</div>
        <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--error)' }}>{errors}</div>
      </div>
    </div>
  );
};

export default StatsBoard;
