import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    
    // Array of drops - one per column
    // Initialize with random y positions to avoid a "curtain" start effect
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100; // Start above screen
    }

    // Characters: Digits + Latin uppercase + Latin lowercase
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 5, 2, 0.05)'; // Deep green-black tint
      ctx.fillRect(0, 0, width, height);

      // Set text color and font
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        // Classic Matrix Green
        // 5% chance to be bright white (head of the stream), else Matrix Green
        if (Math.random() > 0.95) {
             ctx.fillStyle = '#ccffcc'; // Almost white green
        } else {
             ctx.fillStyle = '#0F0'; // Pure Green
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly after it has crossed the screen
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Increment y coordinate
        drops[i]++;
      }
    };

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 30; // Limit FPS for retro feel and performance
    const interval = 1000 / fps;

    const animate = (time: number) => {
        const deltaTime = time - lastTime;
        
        if (deltaTime > interval) {
            draw();
            lastTime = time - (deltaTime % interval);
        }
        
        animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        // Re-calculate columns if width changes significantly, 
        // but for simple resize just letting drops persist is visually smoother 
        // usually, but let's just keep array same length or extend it safely?
        // Simple: just continue.
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Behind everything
        opacity: 0.3, // Subtle background
        pointerEvents: 'none'
      }}
    />
  );
};

export default MatrixBackground;
