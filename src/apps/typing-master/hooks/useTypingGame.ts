import { useState, useEffect, useCallback } from 'react';
import { generateText, type Difficulty } from '../utils/textGenerator';
import { playClickSound, playErrorSound } from '../utils/sound';

export type GamePhase = 'start' | 'typing' | 'ended';

interface UseTypingGameReturn {
  text: string;
  userInput: string;
  phase: GamePhase;
  startTime: number | null;
  endTime: number | null;
  errors: number;
  difficulty: Difficulty;
  isCaught: boolean;
  setDifficulty: (diff: Difficulty) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  resetGame: () => void;
  calculateWPM: () => number;
  calculateAccuracy: () => number;
  triggerGameOver: (caught: boolean) => void;
}

export const useTypingGame = (soundEnabled: boolean = true): UseTypingGameReturn => {
  const [text, setText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [phase, setPhase] = useState<GamePhase>('start');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errors, setErrors] = useState<number>(0);
  const [difficulty, setDifficultyState] = useState<Difficulty>('Medium');

  const [isCaught, setIsCaught] = useState<boolean>(false);

  const setDifficulty = useCallback((diff: Difficulty) => {
      setDifficultyState(diff);
  }, []);

  const getWordCount = useCallback((diff: Difficulty) => {
      // Random range helper
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      
      switch (diff) {
          case 'Easy': return rand(10, 20); // 10-20 words
          case 'Medium': return rand(30, 50); // 30-50 words
          case 'Hard': return rand(60, 80); // 60-80 words
          case 'Expert': return rand(80, 100); // 80-100 words
          default: return 30;
      }
  }, []);

  const resetGame = useCallback(() => {
    const count = getWordCount(difficulty);
    setText(generateText(count, difficulty)); 
    setUserInput('');
    setPhase('start');
    setStartTime(null);
    setEndTime(null);
    setErrors(0);
    setIsCaught(false);
  }, [difficulty, getWordCount]);

  // Initialize text on mount and when difficulty changes
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const triggerGameOver = useCallback((caught: boolean) => {
      setPhase('ended');
      setEndTime(Date.now());
      setIsCaught(caught);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Global Tab Handler: Quick Restart at any time
    if (e.key === 'Tab') {
      e.preventDefault();
      resetGame();
      // If sound enabled, maybe play a sound?
      return;
    }

    if (phase === 'ended') {
      // Logic handled by Global Tab Handler above
      return;
    }

    const key = e.key;
    
    // Ignore modifier keys and special keys except Backspace
    if (key.length > 1 && key !== 'Backspace') return;
    
    // Global Focus/Start check
    if (phase === 'start') {
        // Space or any valid char starts the game
        if (key === ' ') {
             e.preventDefault(); // Prevent scrolling
        }
        setPhase('typing');
        setStartTime(Date.now());
    }

    if (key === 'Backspace') {
      if (soundEnabled) playClickSound();
      setUserInput(prev => prev.slice(0, -1));
    } else {
        // Simple error tracking logic: compare char at current index
        setUserInput(prev => {
            const nextInput = prev + key;
            const currentIndex = prev.length;
            if (currentIndex < text.length) {
                if (key !== text[currentIndex]) {
                   setErrors(err => err + 1);
                   if (soundEnabled) playErrorSound();
                } else {
                   if (soundEnabled) playClickSound();
                }
            }
            return nextInput;
        });
    }
  }, [phase, text, resetGame, soundEnabled]);
  
  // End game check (end of text)
  useEffect(() => {
    if (phase === 'typing' && userInput.length === text.length) {
        setPhase('ended');
        setEndTime(Date.now());
        setIsCaught(false); // Finished successfully
    }
  }, [userInput, text, phase]);

  const calculateWPM = useCallback(() => {
    const timeEnd = endTime || Date.now();
    const timeStart = startTime || Date.now();
    const timeInSeconds = (timeEnd - timeStart) / 1000;
    const timeInMinutes = timeInSeconds / 60;
    
    if (timeInMinutes === 0) return 0;

    // Standard WPM: (characters / 5) / minutes
    const validChars = userInput.length; // Simplified; ideally correct chars
    return Math.round((validChars / 5) / timeInMinutes);
  }, [userInput, startTime, endTime]);

  const calculateAccuracy = useCallback(() => {
    if (userInput.length === 0) return 100;
    const correctChars = userInput.split('').filter((char, i) => char === text[i]).length;
    return Math.round((correctChars / userInput.length) * 100);
  }, [userInput, text]);

  return {
    text,
    userInput,
    phase,
    startTime,
    endTime,
    errors,
    difficulty,
    isCaught,
    setDifficulty,
    handleKeyDown,
    resetGame,
    calculateWPM,
    calculateAccuracy,
    triggerGameOver
  };
};
