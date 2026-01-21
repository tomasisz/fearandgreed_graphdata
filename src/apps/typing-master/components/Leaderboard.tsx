import React, { useState, useEffect } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Leaderboard: React.FC = () => {
    const { leaderboard, loading, error, fetchLeaderboard } = useLeaderboard();
    const [filterDiff, setFilterDiff] = useState<'All' | 'Easy' | 'Medium' | 'Hard' | 'Expert'>('All');
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    // Initial fetch on component mount
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Sorting & Filtering Logic
    const processedLeaderboard = React.useMemo(() => {
        let data = [...leaderboard];
        
        // 1. Filter by Difficulty
        if (filterDiff !== 'All') {
            data = data.filter(item => item.difficulty === filterDiff);
        }

        // 2. Sort by Score (Desc) -> WPM (Desc) -> Accuracy (Desc)
        return data.sort((a, b) => {
            // Use stored score (calculated in hook)
            const scoreA = a.score || 0; 
            const scoreB = b.score || 0;
            
            if (scoreB !== scoreA) return scoreB - scoreA; // Score first
            if (b.wpm !== a.wpm) return b.wpm - a.wpm;     // Then Speed
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy; // Then Acc
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [leaderboard, filterDiff]);

    if (loading) return <div style={{ color: 'var(--text-main)', padding: '2rem', textAlign: 'center' }}>{t('leaderboard_loading')}</div>;
    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
            Error: {error}
            <div style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-sub)' }}>
                请检查后端部署是否公开 (Everyone)
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['All', 'Easy', 'Medium', 'Hard', 'Expert'] as const).map(diff => (
                        <button
                            key={diff}
                            onClick={() => setFilterDiff(diff)}
                            style={{
                                padding: '0.4rem 1rem',
                                fontSize: '0.9rem',
                                borderRadius: '20px',
                                border: 'none',
                                background: filterDiff === diff ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                color: filterDiff === diff ? '#000' : 'var(--text-main)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: filterDiff === diff ? 'bold' : 'normal'
                            }}
                        >
                            {t(`difficulty_${diff.toLowerCase()}`)}
                        </button>
                    ))}
                </div>

                {/* Manage Users Button */}
                <button
                    onClick={() => navigate('/user-management')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-sub)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    <Users size={16} />
                    {t('leaderboard_manage_users')}
                </button>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_rank')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'left' }}>{t('leaderboard_col_user')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_diff')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_score')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_wpm')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_acc')}</th>
                            <th style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>{t('leaderboard_col_date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedLeaderboard.map((entry, index) => {
                            const dateObj = new Date(entry.date);
                            const MM = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                            const DD = dateObj.getDate().toString().padStart(2, '0');
                            const HH = dateObj.getHours().toString().padStart(2, '0');
                            const mm = dateObj.getMinutes().toString().padStart(2, '0');
                            const ss = dateObj.getSeconds().toString().padStart(2, '0');
                            const formattedDate = `${dateObj.getFullYear()}-${MM}-${DD} ${HH}:${mm}:${ss}`;

                            const rank = index + 1;

                            return (
                                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.5rem', color: rank <= 3 ? 'var(--primary)' : 'inherit', textAlign: 'center' }}>
                                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'left' }}>{entry.username}</td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-sub)', textAlign: 'center' }}>
                                        {entry.difficulty ? t(`difficulty_${entry.difficulty.toLowerCase()}`, entry.difficulty) : ''}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'center' }}>
                                        {entry.score !== undefined && entry.score !== null ? Math.floor(entry.score).toLocaleString() : '0'}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>{entry.wpm}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{entry.accuracy}%</td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-sub)', textAlign: 'center' }}>
                                        {formattedDate}
                                    </td>
                                </tr>
                            );
                        })}
                        {processedLeaderboard.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                                    {t('leaderboard_empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;

