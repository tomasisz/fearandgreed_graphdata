import React from 'react';
import { GenericChart } from '../Chart/GenericChart';
import type { ChartDataPoint } from '../../services/api';
import './IndicatorCard.css';

interface IndicatorCardProps {
  title: string;
  score: number;
  rating: string;
  description: string;
  data: ChartDataPoint[];
  color?: string;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
  title,
  score,
  rating,
  description,
  data,
  color = '#2962FF'
}) => {
  return (
    <div className="indicator-card">
      <div className="indicator-header">
        <h3>{title}</h3>
        <span className="indicator-rating" style={{ color }}>{rating}</span>
      </div>
      <div className="indicator-description">{description}</div>
      <div className="indicator-chart-wrapper">
        <GenericChart data={data} height={150} color={color} />
      </div>
      <div className="indicator-footer">
        <span className="indicator-score">Score: {Math.round(score)}</span>
      </div>
    </div>
  );
};
