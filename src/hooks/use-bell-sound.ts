import { useCallback } from 'react';

export function useBellSound() {
  const playBellSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a bell-like sound with harmonics
      const playTone = (frequency: number, startTime: number, duration: number, gain: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Bell-like envelope with quick attack and slow decay
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };

      // Play a triumphant bell chord (C major with octave)
      // First strike
      playTone(523.25, 0, 1.5, 0.3);      // C5
      playTone(659.25, 0, 1.5, 0.2);      // E5
      playTone(783.99, 0, 1.5, 0.15);     // G5
      playTone(1046.50, 0, 1.2, 0.1);     // C6 (octave)
      
      // Second strike (slightly delayed)
      playTone(523.25, 0.15, 1.3, 0.25);
      playTone(659.25, 0.15, 1.3, 0.15);
      playTone(783.99, 0.15, 1.3, 0.12);
      
      // High shimmer
      playTone(2093, 0.05, 0.8, 0.05);    // C7
      playTone(2637, 0.08, 0.6, 0.03);    // E7
      
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }, []);

  return { playBellSound };
}
