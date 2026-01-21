import React from 'react';
import type { FearGreedData } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface CurrentStateProps {
  data: FearGreedData | null;
  loading: boolean;
}

export const CurrentState: React.FC<CurrentStateProps> = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading || !data) {
    return <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>;
  }

  const value = parseInt(data.value.toString());
  let color = 'var(--color-neutral)';
  if (value <= 25) color = 'var(--color-fear)';
  else if (value <= 45) color = '#f06e30'; // soft fear
  else if (value >= 75) color = 'var(--color-greed)';
  else if (value >= 55) color = '#91c746'; // soft greed

  return (
    <div className="current-state-bar" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '24px', 
      // Removed container styles to fit in header
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
         <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{value}</span>
         <span style={{ fontSize: '1.2rem', fontWeight: '600', color }}>{data.value_classification}</span>
      </div>
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }}></div>

      <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{t.nextUpdate}:</span>
        <span style={{ fontWeight: '500' }}>{data.time_until_update ? Math.floor(parseInt(data.time_until_update)/3600) + 'h' : '--'}</span>
      </p>
    </div>
  );
};
