import React, { useEffect, useState } from 'react';
import './styles/variables.css';
import { fetchData, type FearGreedData, type ChartDataPoint } from './services/api';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { IndexChart } from './components/Chart/IndexChart';
import { CurrentState } from './components/Dashboard/CurrentState';
import { ThemeToggle } from './components/Controls/ThemeToggle';
import { LanguageSelector } from './components/Controls/LanguageSelector';
import { LiveBigQueryView } from './components/Dashboard/LiveBigQueryView';
import { IndicatorCard } from './components/IndicatorCard/IndicatorCard';
import { useTheme } from './contexts/ThemeContext';
import './index.css';

const Header: React.FC = () => {
  const { t } = useLanguage();
  return (
    <header className="app-header">
        <h1>{t.title}</h1>
        <div className="controls">
          <ThemeToggle />
          <LanguageSelector />
        </div>
    </header>
  );
};

const SubIndicatorsGrid: React.FC<{ 
    subIndicators: FearGreedData['subIndicators'];
    history: Record<string, ChartDataPoint[]>;
}> = ({ subIndicators, history }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    if (!subIndicators) return null;

    const subIndicatorsConfig = [
        { key: 'market_momentum_sp500', title: t.marketMomentum, desc: t.marketMomentumDesc },
        { key: 'stock_price_strength', title: t.stockPriceStrength, desc: t.stockPriceStrengthDesc },
        { key: 'stock_price_breadth', title: t.stockPriceBreadth, desc: t.stockPriceBreadthDesc },
        { key: 'put_call_options', title: t.putCallOptions, desc: t.putCallOptionsDesc },
        { key: 'market_volatility_vix', title: t.marketVolatility, desc: t.marketVolatilityDesc },
        { key: 'safe_haven_demand', title: t.safeHavenDemand, desc: t.safeHavenDemandDesc },
        { key: 'junk_bond_demand', title: t.junkBondDemand, desc: t.junkBondDemandDesc },
    ];

    return (
        <div className="indicators-grid">
            {subIndicatorsConfig.map(ind => {
                const info = subIndicators[ind.key] || { score: 0, rating: 'N/A' };
                const hist = history[ind.key] || [];
                // Dynamic color based on score (simplified)
                const cardColor = theme === 'dark' ? '#90CAF9' : '#1976D2';
                
                return (
                    <IndicatorCard
                        key={ind.key}
                        title={ind.title}
                        description={ind.desc}
                        score={info.score}
                        rating={info.rating}
                        data={hist}
                        color={cardColor}
                    />
                );
            })}
        </div>
    );
};

const MainLayout: React.FC = () => {
  const [currentData, setCurrentData] = useState<FearGreedData | null>(null);
  const [historyData, setHistoryData] = useState<ChartDataPoint[]>([]);
  const [subIndicatorsHistory, setSubIndicatorsHistory] = useState<Record<string, ChartDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '1Y' | 'ALL'>('1Y');
  const { t } = useLanguage();

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const { current, history, subIndicatorsHistory } = await fetchData();
        setCurrentData(current);
        setHistoryData(history);
        setSubIndicatorsHistory(subIndicatorsHistory);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const getFilteredData = () => {
    if (historyData.length === 0) return [];
    
    // API returns daily data. 
    // 1Y = 365, 3M = 90, 1M = 30
    const len = historyData.length;
    switch (timeRange) {
      case '1M': return historyData.slice(Math.max(0, len - 30));
      case '3M': return historyData.slice(Math.max(0, len - 90));
      case '1Y': return historyData.slice(Math.max(0, len - 365));
      case 'ALL': return historyData;
      default: return historyData;
    }
    // Note: This logic is imperfect for variable length history but sufficient for demo
  };

  return (
    <div className="app-container">
      <Header />

      <main className="dashboard-content">
        <div className="chart-section">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{t.title}</h2>
                <CurrentState data={currentData} loading={loading} />
            </div>
            <div className="range-selector">
                {(['1M', '3M', '1Y', 'ALL'] as const).map(range => (
                <button
                    key={range}
                    className={`range-btn ${timeRange === range ? 'active' : ''}`}
                    onClick={() => setTimeRange(range)}
                >
                    {range === 'ALL' && t.year}
                    {range === '1M' && t.month}
                    {range === '3M' && t.threeDays} 
                    {range === '1Y' && t.year}
                    {range === 'ALL' && '(All)'}
                </button>
                ))}
            </div>
          </div>
          <div className="chart-wrapper">
             <IndexChart data={getFilteredData()} />
          </div>
        </div>

        {/* Sub-Indicators Section */}
        {currentData && (
            <SubIndicatorsGrid 
                subIndicators={currentData.subIndicators} 
                history={subIndicatorsHistory} 
            />
        )}
        
        <LiveBigQueryView />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainLayout />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
