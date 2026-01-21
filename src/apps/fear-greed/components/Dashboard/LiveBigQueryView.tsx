import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BQDataPoint {
  x: number;
  y: number;
  rating: string;
}

interface WebAppResponse {
  fear_and_greed: {
    score: number;
    rating: string;
    timestamp: string;
  };
  fear_and_greed_historical: {
    data: BQDataPoint[];
  };
}

const API_URL = 'https://script.google.com/macros/s/AKfycbxQNg9J6H3N-Giv_38u5iKMGC5-XrxkdIHFP9V_hXgNoHHN03TYuLXQ_kB_CbEahKyh1A/exec';

export const LiveBigQueryView: React.FC = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<BQDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json: WebAppResponse = await response.json();
      
      // Check if data exists in the nested structure
      if (json.fear_and_greed_historical && Array.isArray(json.fear_and_greed_historical.data)) {
        setData(json.fear_and_greed_historical.data);
      } else {
        throw new Error('Invalid Data Structure from GAS');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
    color: theme === 'dark' ? '#fff' : '#000',
    borderRadius: '12px',
    margin: '20px 0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px'
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px',
    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
    backgroundColor: theme === 'dark' ? '#333' : '#eee'
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🔴 Live BigQuery Data (GAS)</h2>
        <button 
          onClick={fetchData} 
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#2962FF',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Fetching...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffcdd2', 
          color: '#d32f2f', 
          borderRadius: '8px',
          marginTop: '15px',
          border: '1px solid #ef5350'
        }}>
          <strong>Error Fetching Data:</strong><br/>
          {error}
          <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#b71c1c' }}>
            Ensure your Web App is deployed as "Anyone" (Anonymous) accessible.
          </div>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
         <p>No data found or empty response.</p>
      )}

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp (UTC)</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{new Date(row.x).toLocaleString()}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: row.y < 25 ? '#d32f2f' : row.y > 75 ? '#2e7d32' : 'inherit' }}>
                  {row.y.toFixed(2)}
                </td>
                <td style={tdStyle}>{row.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
