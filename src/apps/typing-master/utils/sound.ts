// Sound utility using Web Audio API

// Singleton AudioContext
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

export const playClickSound = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Mechanical switch sound simulation
        // Short, high pitch burst
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export const playErrorSound = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Error buzz
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        // Ignore
    }
};

// Siren state
let sirenNodes: { osc: OscillatorNode, gain: GainNode, lfa: OscillatorNode } | null = null;

export const startSiren = () => {
    if (sirenNodes) return; // Already playing

    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfa = ctx.createOscillator(); // Low Frequency Oscillator for modulation
        const lfaGain = ctx.createGain();

        // Siren effect: Modulate frequency
        // Carrier (Main sound)
        osc.type = 'sawtooth';
        osc.frequency.value = 600; // Base freq

        // Modulator (LFO)
        lfa.type = 'sine';
        lfa.frequency.value = 2; // 2 Hz (cycles per second)
        lfaGain.gain.value = 200; // Modulation depth (+- 200Hz)

        // Connect LFO to Carrier Frequency
        lfa.connect(lfaGain);
        lfaGain.connect(osc.frequency);

        // Connect Carrier to Output
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Volume
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);

        osc.start();
        lfa.start();

        sirenNodes = { osc, gain, lfa };
    } catch (e) {
        console.error("Siren start failed", e);
    }
};

export const stopSiren = () => {
    if (!sirenNodes) return;

    try {
        const ctx = getAudioContext();
        const { osc, gain, lfa } = sirenNodes;
        
        // Fade out
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

        osc.stop(ctx.currentTime + 0.2);
        lfa.stop(ctx.currentTime + 0.2);

        setTimeout(() => {
            osc.disconnect();
            lfa.disconnect();
            gain.disconnect();
        }, 250);

        sirenNodes = null;
    } catch (e) {
        sirenNodes = null;
    }
};
