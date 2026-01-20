import axios from 'axios';
import { format, subDays, parseISO } from 'date-fns';
import localHistoryData from '../data/fear_and_greed_historical.json';

export interface SubIndicatorDataPoint {
  x: number; // timestamp ms
  y: number; // value
  rating: string;
}

export interface SubIndicator {
  data: SubIndicatorDataPoint[];
  rating: string;
  score: number;
  timestamp: string;
}

export interface CNNFearGreedData {
  fear_and_greed: {
    score: number;
    rating: string;
    timestamp: string;
    previous_close: number;
    previous_1_year: number;
  };
  fear_and_greed_historical: {
    timestamp: number;
    score: number;
    rating: string;
    data: {
      x: number; // timestamp ms
      y: number; // score
      rating: string;
    }[];
  };
  market_momentum_sp500?: SubIndicator;
  stock_price_strength?: SubIndicator;
  stock_price_breadth?: SubIndicator;
  put_call_options?: SubIndicator;
  market_volatility_vix?: SubIndicator;
  junk_bond_demand?: SubIndicator;
  safe_haven_demand?: SubIndicator;
}

export interface SubIndicatorSummary {
  score: number;
  rating: string;
}

export interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string; // timestamp in seconds
  time_until_update?: string;
  // Sub-indicators (Current State)
  subIndicators?: {
    [key: string]: SubIndicatorSummary;
  };
}

// Normalized history for charting
export interface ChartDataPoint {
  time: string; // 'yyyy-mm-dd'
  value: number;
}

// DAILY UPDATE URL - configured for specific date as requested
const DAILY_DATA_URL = '/cnn-api/index/fearandgreed/graphdata/2026-01-20';

// Helper to map CNN sub-indicator to normalized format
const mapSubIndicatorHistory = (sub?: SubIndicator): ChartDataPoint[] => {
    if (!sub || !sub.data) return [];
    return sub.data.map(item => ({
        time: format(new Date(item.x), 'yyyy-MM-dd'),
        value: item.y
    })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

const mapLocalSubHistory = (subData: any): ChartDataPoint[] => {
    if (!subData || !subData.data) return [];
    return subData.data.map((item: any) => ({
        time: format(new Date(item.x), 'yyyy-MM-dd'),
        value: item.y
    })).sort((a: ChartDataPoint, b: ChartDataPoint) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

export const fetchData = async (): Promise<{ 
    current: FearGreedData, 
    history: ChartDataPoint[],
    subIndicatorsHistory: Record<string, ChartDataPoint[]> 
}> => {
  // 1. Initialize with Local History Data
  let history: ChartDataPoint[] = [];
  let subIndicatorsHistory: Record<string, ChartDataPoint[]> = {};
  let current: FearGreedData;

  try {
      // Process Local History
      // @ts-ignore
      const localData = localHistoryData as CNNFearGreedData;
      
      history = localData.fear_and_greed_historical.data.map(item => ({
        time: format(new Date(item.x), 'yyyy-MM-dd'),
        value: Math.round(item.y)
      })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      subIndicatorsHistory = {
          market_momentum_sp500: mapSubIndicatorHistory(localData.market_momentum_sp500),
          stock_price_strength: mapSubIndicatorHistory(localData.stock_price_strength),
          stock_price_breadth: mapSubIndicatorHistory(localData.stock_price_breadth),
          put_call_options: mapSubIndicatorHistory(localData.put_call_options),
          market_volatility_vix: mapSubIndicatorHistory(localData.market_volatility_vix),
          safe_haven_demand: mapSubIndicatorHistory(localData.safe_haven_demand),
          junk_bond_demand: mapSubIndicatorHistory(localData.junk_bond_demand),
      };

      // Set initial current from local data (will be overwritten by API if successful)
      current = {
          value: Math.round(localData.fear_and_greed.score),
          value_classification: localData.fear_and_greed.rating,
          timestamp: (new Date(localData.fear_and_greed.timestamp).getTime() / 1000).toString(),
          subIndicators: {
            market_momentum_sp500: { 
                score: localData.market_momentum_sp500?.score || 0, 
                rating: localData.market_momentum_sp500?.rating || 'Neutral' 
            },
            stock_price_strength: { 
                score: localData.stock_price_strength?.score || 0, 
                rating: localData.stock_price_strength?.rating || 'Neutral' 
            },
            stock_price_breadth: { 
                score: localData.stock_price_breadth?.score || 0, 
                rating: localData.stock_price_breadth?.rating || 'Neutral' 
            },
            put_call_options: { 
                score: localData.put_call_options?.score || 0, 
                rating: localData.put_call_options?.rating || 'Neutral' 
            },
            market_volatility_vix: { 
                score: localData.market_volatility_vix?.score || 0, 
                rating: localData.market_volatility_vix?.rating || 'Neutral' 
            },
            safe_haven_demand: { 
                score: localData.safe_haven_demand?.score || 0, 
                rating: localData.safe_haven_demand?.rating || 'Neutral' 
            },
            junk_bond_demand: { 
                score: localData.junk_bond_demand?.score || 0, 
                rating: localData.junk_bond_demand?.rating || 'Neutral' 
            },
          }
      };

  } catch (err) {
      console.error("Error loading local history:", err);
      // Generate mock if local load fails
      const mockHistory = generateMockData(365);
      return { 
          current: { 
              value: 50, 
              value_classification: 'Neutral', 
              timestamp: (Date.now()/1000).toString(),
              subIndicators: {}
          }, 
          history: mockHistory, 
          subIndicatorsHistory: {}
      };
  }

  // 2. Fetch Daily Update from API
  try {
    const response = await axios.get<CNNFearGreedData>(DAILY_DATA_URL);
    const dailyData = response.data;

    if (dailyData.fear_and_greed) {
        // Update Current State
        current = {
            value: Math.round(dailyData.fear_and_greed.score),
            value_classification: dailyData.fear_and_greed.rating,
            timestamp: (new Date(dailyData.fear_and_greed.timestamp).getTime() / 1000).toString(),
            subIndicators: {
                market_momentum_sp500: { 
                    score: dailyData.market_momentum_sp500?.score || 0, 
                    rating: dailyData.market_momentum_sp500?.rating || 'Neutral' 
                },
                stock_price_strength: { 
                    score: dailyData.stock_price_strength?.score || 0, 
                    rating: dailyData.stock_price_strength?.rating || 'Neutral' 
                },
                stock_price_breadth: { 
                    score: dailyData.stock_price_breadth?.score || 0, 
                    rating: dailyData.stock_price_breadth?.rating || 'Neutral' 
                },
                put_call_options: { 
                    score: dailyData.put_call_options?.score || 0, 
                    rating: dailyData.put_call_options?.rating || 'Neutral' 
                },
                market_volatility_vix: { 
                    score: dailyData.market_volatility_vix?.score || 0, 
                    rating: dailyData.market_volatility_vix?.rating || 'Neutral' 
                },
                safe_haven_demand: { 
                    score: dailyData.safe_haven_demand?.score || 0, 
                    rating: dailyData.safe_haven_demand?.rating || 'Neutral' 
                },
                junk_bond_demand: { 
                    score: dailyData.junk_bond_demand?.score || 0, 
                    rating: dailyData.junk_bond_demand?.rating || 'Neutral' 
                },
            }
        };

        // Merge History Logic:
        // Check if dailyData has a new point not in history
        // IMPORTANT: The daily API endpoint usually returns a full object but `fear_and_greed_historical.data` might only have one point or a subset.
        // We will take the single point from `fear_and_greed_historical` if available, or just use the current score as a point.
        
        // Strategy: Create a point from the daily valid data and upsert it into history
        const dailyDateStr = format(new Date(dailyData.fear_and_greed.timestamp), 'yyyy-MM-dd');
        
        // Main Index Upsert
        const newPoint: ChartDataPoint = {
            time: dailyDateStr,
            value: Math.round(dailyData.fear_and_greed.score)
        };
        upsertDataPoint(history, newPoint);

        // Sub-indicators Upsert
        const subKeys = [
            'market_momentum_sp500', 'stock_price_strength', 'stock_price_breadth', 
            'put_call_options', 'market_volatility_vix', 'safe_haven_demand', 'junk_bond_demand'
        ];

        subKeys.forEach(key => {
            // @ts-ignore
            const sub = dailyData[key] as SubIndicator | undefined;
            if (sub) {
                const subPoint: ChartDataPoint = {
                   time: dailyDateStr, // Assuming sub-indicators share the same timestamp or use sub.timestamp
                   value: sub.score // Map score to chart value
                };
                if (!subIndicatorsHistory[key]) subIndicatorsHistory[key] = [];
                upsertDataPoint(subIndicatorsHistory[key], subPoint);
            }
        });
    }

  } catch (error) {
    console.warn('Failed to fetch daily update, showing local history only:', error);
  }

  return { current, history, subIndicatorsHistory };
};

// Helper: Insert or Update data point in sorted array
const upsertDataPoint = (array: ChartDataPoint[], point: ChartDataPoint) => {
    const existingIndex = array.findIndex(p => p.time === point.time);
    if (existingIndex >= 0) {
        array[existingIndex] = point; // Update
    } else {
        array.push(point); // Insert
        // Re-sort to be safe, though usually appending is enough for new days
        array.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }
};

// Mock data generator for fallback (kept for safety)
const generateMockData = (days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = subDays(now, i);
    const baseValue = 50 + Math.sin(i / 10) * 30; 
    let value = Math.round(baseValue);
    value = Math.max(0, Math.min(100, value));
    
    data.push({
      time: format(date, 'yyyy-MM-dd'),
      value
    });
  }
  return data.reverse();
};
