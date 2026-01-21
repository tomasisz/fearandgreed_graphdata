
import './index.css';
import './i18n';
import { UserProvider, useUser } from './context/UserContext';
import GameContainer from './components/GameContainer';
import UserLogin from './components/UserLogin';
import Leaderboard from './components/Leaderboard';
import YearProgress from './components/YearProgress';
import UserManagement from './components/UserManagement';

import { Calendar, Keyboard, Trophy, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import MatrixBackground from './components/MatrixBackground';


function AppContent() {
  const { username, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="App" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', /* Center content vertically in the available space */
        width: '100%'
    }}>
       <MatrixBackground />
       <header style={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center', 
           marginBottom: '3rem',
           paddingBottom: '1rem',
           borderBottom: '1px solid var(--glass-border)',
       }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{t('app_title')}</h1>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <button 
                   onClick={() => navigate('/typing-master/year-progress')} 
                   style={{ 
                       borderColor: isActive('/typing-master/year-progress') ? 'var(--primary)' : 'transparent',
                       color: isActive('/typing-master/year-progress') ? 'var(--primary)' : 'var(--text-main)',
                       whiteSpace: 'nowrap',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem'
                   }}
               >
                   <Calendar size={18} />
                   {t('nav_year')}
               </button>

               <button 
                   onClick={() => navigate('/typing-master')} 
                   style={{ 
                       borderColor: isActive('/typing-master') ? 'var(--primary)' : 'transparent',
                       color: isActive('/typing-master') ? 'var(--primary)' : 'var(--text-main)',
                       whiteSpace: 'nowrap',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem'
                   }}
               >
                   <Keyboard size={18} />
                   {t('nav_practice')}
               </button>
               
               {username && (
                 <button 
                     onClick={() => navigate('/typing-master/leaderboard')} 
                     style={{ 
                         borderColor: isActive('/typing-master/leaderboard') || isActive('/typing-master/user-management') ? 'var(--primary)' : 'transparent',
                         color: isActive('/typing-master/leaderboard') || isActive('/typing-master/user-management') ? 'var(--primary)' : 'var(--text-main)',
                         whiteSpace: 'nowrap',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem'
                     }}
                 >
                     <Trophy size={18} />
                     {t('nav_leaderboard')}
                 </button>
               )}

               {username && (
                   <>
                       <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>
                       <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{username}</span>
                       <button onClick={logout} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: 'var(--error)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                           <LogOut size={14} />
                           {t('nav_logout')}
                       </button>
                   </>
               )}
               
               {/* Language Switcher */}
               <LanguageSwitcher />
           </div>
       </header>

       <main style={{ 
           flex: 1, 
           display: 'flex', 
           flexDirection: 'column', 
           justifyContent: 'center', 
           width: '100%',
           minHeight: 0 /* Important for flex child scrolling/sizing */
       }}>
           <Routes>
               <Route path="/" element={!username ? <UserLogin /> : <GameContainer />} />
               <Route path="/year-progress" element={<YearProgress />} />
               <Route path="/leaderboard" element={username ? <Leaderboard /> : <Navigate to="/typing-master" replace />} />
               <Route path="/user-management" element={username ? <UserManagement /> : <Navigate to="/typing-master" replace />} />
               <Route path="*" element={<Navigate to="/typing-master" replace />} />
           </Routes>
       </main>
    </div>
  );
}

function App() {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
}

export default App;
