import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, BaselineSeries, type IChartApi, type BaselineSeriesPartialOptions } from 'lightweight-charts';
import type { ChartDataPoint } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface IndexChartProps {
  data: ChartDataPoint[];
}

export const IndexChart: React.FC<IndexChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chartInstance: IChartApi | null = null;
    let handleResize: (() => void) | null = null;

    try {
      const width = chartContainerRef.current.clientWidth || 600;
      
      chartInstance = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: isDark ? '#d1d4dc' : '#131722',
        },
        grid: {
          vertLines: { color: isDark ? '#2a2e39' : '#e0e3eb' },
          horzLines: { color: isDark ? '#2a2e39' : '#e0e3eb' },
        },
        width: width,
        height: 400,
        timeScale: {
          borderColor: isDark ? '#2a2e39' : '#e0e3eb',
        },
        rightPriceScale: {
          borderColor: isDark ? '#2a2e39' : '#e0e3eb',
        },
      });

      // Use Baseline Series for Fear (Red) / Greed (Green)
      // v5 API: use addSeries
      const baselineSeries = chartInstance.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 50 },
        topLineColor: '#0ecb81', // Greed
        topFillColor1: 'rgba(14, 203, 129, 0.28)',
        topFillColor2: 'rgba(14, 203, 129, 0.05)',
        bottomLineColor: '#ea3943', // Fear
        bottomFillColor1: 'rgba(234, 57, 67, 0.05)',
        bottomFillColor2: 'rgba(234, 57, 67, 0.28)',
      } as BaselineSeriesPartialOptions);

      if (data && data.length > 0) {
        baselineSeries.setData(data);
      }
      
      chartInstance.timeScale().fitContent();
      chartRef.current = chartInstance;

      handleResize = () => {
        if (chartContainerRef.current && chartInstance) {
          chartInstance.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);
    } catch (err) {
      console.error("Failed to initialize chart:", err);
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      if (chartInstance) {
        chartInstance.remove();
      }
      chartRef.current = null;
    };
  }, [isDark, data]);

  return (
    <div key={data.length} ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
  );
};
