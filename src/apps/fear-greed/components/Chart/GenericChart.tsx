import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, LineSeries, type Time } from 'lightweight-charts';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChartDataPoint } from '../../services/api';

interface GenericChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  timeRange?: '1D' | '3D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
  showGrid?: boolean;
}

export const GenericChart: React.FC<GenericChartProps> = ({ 
  data, 
  color = '#2962FF', 
  height = 200,
  showGrid = false
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Re-create chart when theme changes or init
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#D9D9D9' : '#191919';
    const backgroundColor = 'transparent';
    const gridColor = isDark ? '#363c4e' : '#e1e3e6';

    const chartInstance = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { visible: showGrid, color: gridColor },
        horzLines: { visible: showGrid, color: gridColor },
      },
      rightPriceScale: {
        borderVisible: false,
        visible: true, 
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chartInstance.addSeries(LineSeries, {
      color: color,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
    });

    // Format data for lightweight-charts
    const chartData = data.map(d => ({
      time: d.time as Time,
      value: d.value
    }));

    series.setData(chartData);
    chartInstance.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chartInstance.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, [theme, height, showGrid, data, color]); 

  return <div ref={chartContainerRef} style={{ width: '100%', height: `${height}px` }} />;
};
