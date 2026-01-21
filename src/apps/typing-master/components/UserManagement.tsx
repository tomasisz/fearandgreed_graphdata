
import React, { useState, useEffect, useMemo } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Trash2, Users, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UserManagement: React.FC = () => {
    const { leaderboard, deleteUserScores, fetchLeaderboard, loading } = useLeaderboard();
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Initial fetch to ensure data is fresh
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // Unique Users for Management
    const uniqueUsers = useMemo(() => {
        return Array.from(new Set(leaderboard.map(e => e.username))).sort();
    }, [leaderboard]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(uniqueUsers));
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (user: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(user)) {
            newSet.delete(user);
        } else {
            newSet.add(user);
        }
        setSelectedUsers(newSet);
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // ...

    const handleBatchDeleteClick = () => {
        if (selectedUsers.size === 0) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);
        try {
            let successCount = 0;
            let failCount = 0;

            for (const user of Array.from(selectedUsers)) {
                const success = await deleteUserScores(user);
                if (success) successCount++;
                else failCount++;
            }
            
            // Refresh data
            await fetchLeaderboard();
            
            setSelectedUsers(new Set());
            
            if (failCount > 0) {
                alert(`删除完成: ${successCount} 个成功, ${failCount} 个失败。\n如果依然失败，请检查 Google Script 是否已重新部署 (Latest Deployment).`);
            } else {
                alert(`成功删除 ${successCount} 位用户的所有存档。`);
            }
        } catch (err) { 
            console.error("Error during batch deletion:", err);
            alert("删除过程中发生错误，请检查控制台。");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button 
                    onClick={() => navigate('/leaderboard')}
                    style={{ 
                        background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-sub)',
                        width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    title={t('user_mgmt_back')}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Users size={28} color="var(--primary)" />
                    {t('user_mgmt_title')}
                </h2>
            </div>

            {/* Main Panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                
                {/* Toolbar */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                        onClick={() => handleSelectAll(selectedUsers.size < uniqueUsers.length)}
                        style={{ 
                            background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold'
                        }}
                    >
                        {selectedUsers.size === uniqueUsers.length && uniqueUsers.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                        {t('user_mgmt_select_all')} ({uniqueUsers.length})
                    </button>
                    
                    <span style={{ color: 'var(--text-sub)' }}>
                        {t('user_mgmt_selected')}: <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{selectedUsers.size}</span>
                    </span>
                </div>

                {/* List Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)' }}>{t('leaderboard_loading')}</div>
                    ) : uniqueUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)' }}>{t('leaderboard_empty')}</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {uniqueUsers.map(user => (
                                <div key={user} 
                                    onClick={() => handleSelectUser(user)}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: '1rem', 
                                        padding: '1rem', borderRadius: '12px',
                                        background: selectedUsers.has(user) ? 'rgba(0, 255, 136, 0.1)' : 'var(--glass-bg)',
                                        border: selectedUsers.has(user) ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid var(--glass-border)',
                                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                                    }}
                                >
                                    {selectedUsers.has(user) ? 
                                        <CheckSquare size={20} color="var(--primary)" style={{ flexShrink: 0 }} /> : 
                                        <Square size={20} color="var(--text-sub)" style={{ flexShrink: 0 }} />
                                    }
                                    <span style={{ fontWeight: selectedUsers.has(user) ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={handleBatchDeleteClick}
                        disabled={isDeleting || selectedUsers.size === 0}
                        style={{
                            padding: '0.8rem 2rem', borderRadius: '8px', border: 'none',
                            background: isDeleting || selectedUsers.size === 0 ? 'var(--glass-border)' : 'var(--error)',
                            color: '#fff', cursor: isDeleting || selectedUsers.size === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold',
                            boxShadow: isDeleting || selectedUsers.size === 0 ? 'none' : '0 4px 15px rgba(255, 0, 85, 0.3)'
                        }}
                    >
                        <Trash2 size={18} />
                        {t('user_mgmt_delete', { count: selectedUsers.size })}
                    </button>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div style={{
                        background: 'rgba(30, 30, 40, 0.95)', border: '1px solid var(--glass-border)',
                        borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                    }}>
                        <div style={{ 
                            width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 68, 68, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                        }}>
                            <Trash2 size={30} color="var(--error)" />
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>{t('user_mgmt_confirm_title')}</h3>
                        <p style={{ color: 'var(--text-sub)', marginBottom: '2rem', whiteSpace: 'pre-line' }}>
                            {t('user_mgmt_confirm_msg', { count: selectedUsers.size })}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                    background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem'
                                }}
                            >
                                {t('user_mgmt_cancel')}
                            </button>
                            <button 
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
                                    background: 'var(--error)', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'
                                }}
                            >
                                {isDeleting ? t('user_mgmt_deleting') : t('user_mgmt_confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
