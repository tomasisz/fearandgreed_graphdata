import { useState, useCallback } from 'react';

// Use proxy in dev to avoid CORS, direct URL in prod (requires correct CORS setup on server or same domain)
const GAS_API_URL = import.meta.env.DEV 
    ? '/api/gas' 
    : 'https://script.google.com/macros/s/AKfycbwtx4Z7Avptb4WDM2RVMkGuQ9WynqyNoJsWHZFbqbMQv8CMMfeae2BOnVqhuKlzi4NT7g/exec';

export interface LeaderboardEntry {
  username: string;
  wpm: number;
  accuracy: number;
  date: string;
  difficulty: string;
  isWin: boolean;
  score: number;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
  submitScore: (username: string, wpm: number, accuracy: number, difficulty: string, isWin: boolean) => Promise<boolean>;
  deleteScore: (date: string) => Promise<boolean>;
  deleteUserScores: (username: string) => Promise<boolean>;
}

export const useLeaderboard = (): UseLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for Score Calculation
  const calculateScoreValue = (d: string, wpm: number, acc: number, isWin: boolean) => {
      const diffCoeff = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Expert': 4 }[d] || 1;
      const winCoeff = isWin ? 100 : 1;
      return diffCoeff * wpm * acc * winCoeff;
  };

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GAS_API_URL);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      // GAS returns HTML login page if permissions are wrong
      if (text.trim().startsWith('<!DOCTYPE html') || text.includes('Google Accounts')) {
          setError('Deployment Error: Script not public');
      } else {
          try {
              const data = JSON.parse(text);
              if (data.status === 'success') {
                const rawData: LeaderboardEntry[] = data.data;

                // Filter to keep only BEST SCORE per user per difficulty
                const bestScoresMap = new Map<string, LeaderboardEntry>();
                
                rawData.forEach(entry => {
                    // Safe normalization
                    const username = (entry.username || '').trim();
                    const diffName = (entry.difficulty || 'Unknown').trim();
                    const wpm = Number(entry.wpm) || 0;
                    const accuracy = Number(entry.accuracy) || 0;
                    const isWin = entry.isWin !== undefined ? entry.isWin : true; // Default to true for legacy data
                    
                    if (!username) return; // Skip empty users

                    const key = `${username}-${diffName}`;
                    
                    // Fallback calc if score is missing from backend or 0 (old data)
                    let score = Number(entry.score);
                    if (!score || score <= 0 || isNaN(score)) {
                        score = calculateScoreValue(diffName, wpm, accuracy, isWin);
                    }
                    
                    const processedEntry: LeaderboardEntry = { 
                        ...entry, 
                        username, 
                        difficulty: diffName,
                        wpm,
                        accuracy,
                        isWin,
                        score: score || 0 // Ensure no NaN
                    };
                    
                    const existing = bestScoresMap.get(key);
                    
                    if (!existing) {
                        bestScoresMap.set(key, processedEntry);
                    } else {
                        // Keep highest score
                        if ((score || 0) > (existing.score || 0)) {
                           bestScoresMap.set(key, processedEntry);
                        }
                    }
                });
                
                setLeaderboard(Array.from(bestScoresMap.values()));
              } else {
                setError(data.message || 'Failed to fetch');
              }
          } catch {
              setError('Invalid JSON response');
          }
      }
    } catch (err) {
      if (typeof err === 'string' && err.includes('Script not public')) {
          setError('Deployment Error: Script not public');
      } else {
          setError('Network error (CORS or setup)');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(async (username: string, wpm: number, accuracy: number, difficulty: string, isWin: boolean) => {
    try {
      // Calculate score before sending
      const score = calculateScoreValue(difficulty, wpm, accuracy, isWin);

      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'add', username, wpm, accuracy, difficulty, isWin, score })
      });
      const data = await response.json();
      return data.status === 'success';
    } catch (err) {
      console.error('Submit error:', err);
      return false;
    }
  }, []);

  const deleteScore = useCallback(async (date: string) => {
      try {
          const response = await fetch(GAS_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'delete', date })
          });
          const data = await response.json();
          if (data.status === 'success') {
              setLeaderboard(prev => prev.filter(item => item.date !== date));
              return true;
          }
          return false;
      } catch (err) {
          console.error('Delete error:', err);
          return false;
      }
  }, []);

  const deleteUserScores = useCallback(async (username: string) => {
      try {
          const response = await fetch(GAS_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'delete_user', username })
          });
          const data = await response.json();
          if (data.status === 'success') {
              setLeaderboard(prev => prev.filter(item => item.username !== username));
              return true;
          }
          return false;
      } catch (err) {
          console.error('Delete user error:', err);
          return false;
      }
  }, []);

  return { leaderboard, loading, error, fetchLeaderboard, submitScore, deleteScore, deleteUserScores };
};
