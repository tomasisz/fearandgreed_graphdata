import React, { useEffect, useState } from 'react';
import { useTypingGame } from '../hooks/useTypingGame';
import TypingArea from './TypingArea';
import StatsBoard from './StatsBoard';
import ResultModal from './ResultModal';
import ChaseAnimation from './ChaseAnimation';
import { useTranslation, Trans } from 'react-i18next';

const GameContainer: React.FC = () => {
  const { t } = useTranslation();

  // Real-time stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { 
    text, 
    userInput, 
    phase, 
    errors, 
    difficulty,
    isCaught,
    setDifficulty,
    handleKeyDown, 
    resetGame, 
    calculateWPM, 
    calculateAccuracy,
    triggerGameOver
  } = useTypingGame(soundEnabled); 

  // Update stats periodically or on input
  useEffect(() => {
    if (phase === 'typing' || phase === 'ended') {
        setWpm(calculateWPM());
        setAccuracy(calculateAccuracy());
    } else {
        setWpm(0);
        setAccuracy(100);
    }
  }, [userInput, phase, calculateWPM, calculateAccuracy]);

  // Handle modal visibility based on phase
  useEffect(() => {
      if (phase === 'ended') {
          setShowModal(true);
      } else {
          setShowModal(false);
      }
  }, [phase]);

  // Global key listener
  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleKeyDown]);

  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'] as const;
  
  // Calculate user progress percentage
  const userPercent = text.length > 0 ? (userInput.length / text.length) * 100 : 0;

  return (
    <div className="game-container" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '2rem', 
        alignItems: 'stretch', // Stretch to make heights equal if possible
        justifyContent: 'center'
      }}>
        {/* Left Column: Game Controls & Area */}
        <div style={{ flex: '2 1 450px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
              {difficulties.map((diff) => (
                  <button 
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          background: difficulty === diff ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                          color: difficulty === diff ? '#000' : 'var(--text-main)',
                          borderColor: difficulty === diff ? 'var(--primary)' : 'var(--glass-border)',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flex: 1
                      }}
                  >
                      {t(`difficulty_${diff.toLowerCase()}`)}
                  </button>
              ))}
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                    padding: '0.5rem 1rem',
                    fontSize: '1.2rem',
                    background: 'rgba(0,0,0,0.3)',
                    color: soundEnabled ? 'var(--primary)' : 'var(--text-sub)',
                    borderColor: 'var(--glass-border)',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginLeft: '0.5rem'
                }}
                title={soundEnabled ? t('game_mute') : t('game_unmute')}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>

            <StatsBoard wpm={wpm} accuracy={accuracy} errors={errors} />
            
            <TypingArea text={text} userInput={userInput} phase={phase} />
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', color: 'var(--text-sub)', marginTop: '0.5rem' }}>
               <span>
                  <Trans i18nKey="game_restart_hint">
                    Press <b>Tab</b> to Restart
                  </Trans>
               </span>
            </div>
        </div>

        {/* Right Column: Animation */}
        <div style={{ flex: '1 1 350px', minWidth: '300px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            <ChaseAnimation 
              userPercent={userPercent} 
              difficulty={difficulty} 
              phase={phase}
              onCaught={() => triggerGameOver(true)} 
              totalChars={text.length}
              accuracy={accuracy}
              soundEnabled={soundEnabled}
            />
        </div>
      </div>

      {showModal && phase === 'ended' && (
        <ResultModal 
          wpm={wpm} 
          accuracy={accuracy} 
          errors={errors} 
          difficulty={difficulty}
          isCaught={isCaught}
          onRestart={resetGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default GameContainer;
