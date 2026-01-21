import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TypingAreaProps {
  text: string;
  userInput: string;
  phase: 'start' | 'typing' | 'ended';
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, userInput, phase }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll logic could go here if text is long

  return (
    <div 
      className="typing-area glass-panel" 
      ref={containerRef}
      style={{
        fontSize: '1.5rem',
        lineHeight: '1.6',
        letterSpacing: '1px',
        textAlign: 'center',
        minHeight: '200px',
        cursor: 'text',
        position: 'relative',
        marginBottom: '2rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: "'Roboto Mono', monospace" // Ideally load a monospace font
      }}
    >
        {phase === 'start' && userInput.length === 0 && (
            <div style={{
                position: 'absolute', top: '-30px', left: 0, width: '100%', textAlign: 'center', 
                color: 'var(--text-sub)', fontSize: '0.9rem',
                display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
                <span>{t('typing_start')}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>[Tab] Restart &nbsp;|&nbsp; [Space] Start</span>
            </div>
        )}
        
      {text.split('').map((char, index) => {
        let className = 'text-pending';
        let isCursor = false;

        if (index < userInput.length) {
          if (userInput[index] === char) {
            className = 'text-correct';
          } else {
            className = 'text-error';
          }
        }
        
        if (index === userInput.length) {
          isCursor = true;
          // Apply cursor style specifically to this char placeholder
          // or render a caret
        }

        return (
          <span 
            key={index} 
            className={className}
            style={{ 
                position: 'relative',
                borderLeft: isCursor ? '2px solid var(--primary)' : 'none',
                // Optional: add background highlight for current word
            }}
          >
            {char}
            {isCursor && <span style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '2px',
                background: 'var(--primary)',
                animation: 'pulse 1s infinite'
            }} />}
          </span>
        );
      })}
    </div>
  );
};

export default TypingArea;
