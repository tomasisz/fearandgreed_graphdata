import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { Difficulty } from '../utils/textGenerator';
import type { GamePhase } from '../hooks/useTypingGame';
import { startSiren, stopSiren } from '../utils/sound';

interface ChaseAnimationProps {
  userPercent: number; // 0-100
  difficulty: Difficulty;
  phase: GamePhase;
  onCaught: () => void;
  totalChars: number;
  accuracy: number;
  soundEnabled: boolean;
}

interface Segment {
    len: number;
    start: [number, number]; // [x, y]
    end: [number, number];   // [x, y]
}

const ChaseAnimation: React.FC<ChaseAnimationProps> = ({ userPercent, difficulty, phase, onCaught, totalChars, accuracy, soundEnabled }) => {
  const [policePercent, setPolicePercent] = useState(0);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  const HEAD_START_CHARS = 20; 
  const AVG_WORD_LEN = 5;

  // --- Static Snake Path (Square Maze) ---
  const { segments, pathData, totalUnits } = useMemo(() => {
     // Grid: 0-100. 
     // Rows at Y: 10, 30, 50, 70, 90
     // X range: 10 to 90
     
     const generatedSegments: Segment[] = [];
     let d = "M 10 10";
     let currentTotal = 0;

     // Row 1: Right
     generatedSegments.push({ len: 80, start: [10, 10], end: [90, 10] });
     d += " H 90"; currentTotal += 80;

     // Drop 1
     generatedSegments.push({ len: 20, start: [90, 10], end: [90, 30] });
     d += " V 30"; currentTotal += 20;

     // Row 2: Left
     generatedSegments.push({ len: 80, start: [90, 30], end: [10, 30] });
     d += " H 10"; currentTotal += 80;

     // Drop 2
     generatedSegments.push({ len: 20, start: [10, 30], end: [10, 50] });
     d += " V 50"; currentTotal += 20;

     // Row 3: Right
     generatedSegments.push({ len: 80, start: [10, 50], end: [90, 50] });
     d += " H 90"; currentTotal += 80;

     // Drop 3
     generatedSegments.push({ len: 20, start: [90, 50], end: [90, 70] });
     d += " V 70"; currentTotal += 20;

     // Row 4: Left
     generatedSegments.push({ len: 80, start: [90, 70], end: [10, 70] });
     d += " H 10"; currentTotal += 80;

     // Drop 4
     generatedSegments.push({ len: 20, start: [10, 70], end: [10, 90] });
     d += " V 90"; currentTotal += 20;

     // Row 5: Right
     generatedSegments.push({ len: 80, start: [10, 90], end: [90, 90] });
     d += " H 90"; currentTotal += 80;

     return { segments: generatedSegments, pathData: d, totalUnits: currentTotal };
  }, []); // Static, no dependency

  // Refs for loop
  const stateRef = useRef({
      userPercent,
      accuracy,
      totalChars,
      difficulty,
      length: totalChars > 0 ? totalChars : 100
  });

  useEffect(() => {
      stateRef.current = {
          userPercent,
          accuracy,
          totalChars,
          difficulty,
          length: totalChars > 0 ? totalChars : 100
      };
  }, [userPercent, accuracy, totalChars, difficulty]);

  const length = totalChars > 0 ? totalChars : 100;
  
  // Head start 
  const headStartPercent = (HEAD_START_CHARS / length) * 100;
  
  const rawUserPercent = userPercent * (accuracy / 100); 
  const effectiveUserPercent = Math.min(rawUserPercent + headStartPercent, 100);

  // --- Siren Logic ---
  useEffect(() => {
    if (phase !== 'typing' || !soundEnabled) {
        stopSiren();
        return;
    }

    const percentDiff = effectiveUserPercent - policePercent;
    const charsDiff = (percentDiff / 100) * length;
    const wordsDiff = charsDiff / AVG_WORD_LEN;

    if (wordsDiff > 0 && wordsDiff <= 5 && effectiveUserPercent < 100) {
        startSiren();
    } else {
        stopSiren();
    }
  }, [policePercent, effectiveUserPercent, phase, soundEnabled, length]);
  
  // --- Animation Loop ---
  useEffect(() => {
    // Police WPM Configuration
    const POLICE_WPM: Record<Difficulty, number> = {
        Easy: 30,    // Slow
        Medium: 60,  // Average
        Hard: 90,    // Fast
        Expert: 120  // Competitive
    };

    if (phase === 'typing') {
      startTimeRef.current = null;
      
      const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsedSeconds = (time - startTimeRef.current) / 1000;
        
        const { difficulty: currentDiff, length: currentLength, userPercent: currentUserPercent, accuracy: currentAccuracy } = stateRef.current;

        const wpm = POLICE_WPM[currentDiff];
        const cpm = wpm * 5; 
        const charsTyped = (cpm / 60) * elapsedSeconds;
        
        // Calculate Percent
        const currentPolicePercent = Math.min((charsTyped / currentLength) * 100, 100);

        setPolicePercent(currentPolicePercent);

        // Collision Check
        const loopHeadStartPercent = (HEAD_START_CHARS / currentLength) * 100;
        const loopRawUserPercent = currentUserPercent * (currentAccuracy / 100); 
        const liveEffectiveUserPercent = Math.min(loopRawUserPercent + loopHeadStartPercent, 100);

        // Catch if police overtakes (- 1% buffer to be fair visually)
        if (currentPolicePercent > 2 && currentPolicePercent > liveEffectiveUserPercent && currentUserPercent < 100) {
            onCaught();
            return; 
        }

        if (currentPolicePercent < 100) {
             requestRef.current = requestAnimationFrame(animate);
        }
      };

      requestRef.current = requestAnimationFrame(animate);
    } else {
      setPolicePercent(0);
      cancelAnimationFrame(requestRef.current!);
      stopSiren(); 
    }

    return () => {
        cancelAnimationFrame(requestRef.current!);
        stopSiren(); 
    };
  }, [phase, onCaught, HEAD_START_CHARS]); 
 

  // Path Interpolation
  const getCoordinates = (p: number) => {
    const progress = Math.min(Math.max(p, 0), 100);
    const distance = (progress / 100) * totalUnits;

    let covered = 0;
    for (const seg of segments) {
      if (distance <= covered + seg.len) {
        const segP = (distance - covered) / seg.len;
        const x = seg.start[0] + (seg.end[0] - seg.start[0]) * segP;
        const y = seg.start[1] + (seg.end[1] - seg.start[1]) * segP;
        const dir = seg.start[1] === seg.end[1] ? (seg.end[0] > seg.start[0] ? 0 : 180) : (seg.end[1] > seg.start[1] ? 90 : -90);
        return { x, y, dir }; // Added rotation
      }
      covered += seg.len;
    }
    const last = segments[segments.length - 1];
    return { x: last.end[0], y: last.end[1], dir: 0 };
  };
  
  const userPos = getCoordinates(effectiveUserPercent);
  const policePos = getCoordinates(policePercent);

  return (
    <div className="glass-panel" style={{ 
      width: '100%', 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '20px',
      position: 'relative',
      height: '100%', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 10, 20, 0.6)'
    }}>
      <svg 
        viewBox="0 0 100 100" 
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Track */}
        <path d={pathData} fill="none" stroke="var(--text-sub)" strokeWidth="4" strokeOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathData} fill="none" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 4" />
        
        {/* Start/End Markers */}
        <circle cx="10" cy="10" r="2" fill="var(--success)" opacity="0.5" />
        <text x="5" y="5" fontSize="4" fill="var(--success)" opacity="0.7">START</text>
        <text x="90" y="95" fontSize="4" fill="var(--primary)" opacity="0.7" textAnchor="end">FINISH</text>

        {/* User (Runner) - Cyan Diamond */}
        <g transform={`translate(${userPos.x}, ${userPos.y})`} style={{ transition: 'transform 0.1s linear' }}>
            <circle r="4" fill="var(--primary)" opacity="0.1" />
            <circle r="2" fill="var(--primary)" />
            <circle r="1" fill="#fff" />
        </g>

        {/* Police (Chaser) - Red Triangle/Dart */}
        <g transform={`translate(${policePos.x}, ${policePos.y}) rotate(${policePos.dir})`} style={{ transition: 'transform 0.1s linear' }}>
            {/* Warning Radius */}
            <circle r="5" fill="var(--error)" opacity={policePercent > 0 ? 0.1 : 0}>
                <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="0.5s" repeatCount="indefinite" />
            </circle>
            {/* Triangle pointing right (0 deg) */}
            <path d="M -3 -3 L 4 0 L -3 3 Z" fill="var(--error)" />
        </g>
      </svg>
    </div>
  );
};

export default ChaseAnimation;
