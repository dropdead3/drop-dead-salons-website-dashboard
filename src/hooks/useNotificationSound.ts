import { useCallback, useMemo, useRef } from 'react';
import { useSoundSettings } from '@/contexts/SoundSettingsContext';

type SoundType = 'success' | 'error' | 'achievement';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function playTone(ctx: AudioContext, freq: number, durationMs: number, type: OscillatorType, gainPeak = 0.06) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const now = ctx.currentTime;
  const dur = durationMs / 1000;

  // Envelope: fast attack, gentle release.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + dur);
}

export function useNotificationSound() {
  const { enabled } = useSoundSettings();
  const ctxRef = useRef<AudioContext | null>(null);

  const canPlay = useMemo(() => enabled && !prefersReducedMotion(), [enabled]);

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    ctxRef.current = new Ctx();
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (type: SoundType) => {
      if (!canPlay) return;
      const ctx = ensureContext();
      if (!ctx) return;

      // Resume if needed (iOS / autoplay policies)
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      // Keep it subtle and short.
      if (type === 'success') {
        playTone(ctx, 523.25, 90, 'sine', 0.05); // C5
        setTimeout(() => playTone(ctx, 659.25, 110, 'sine', 0.045), 70); // E5
        return;
      }

      if (type === 'achievement') {
        playTone(ctx, 440, 120, 'triangle', 0.055); // A4
        setTimeout(() => playTone(ctx, 659.25, 140, 'triangle', 0.05), 90); // E5
        setTimeout(() => playTone(ctx, 880, 160, 'triangle', 0.045), 160); // A5
        return;
      }

      // error
      playTone(ctx, 196, 140, 'sine', 0.055); // G3
      setTimeout(() => playTone(ctx, 155.56, 170, 'sine', 0.05), 90); // Eb3-ish
    },
    [canPlay, ensureContext]
  );

  return {
    playSuccess: () => play('success'),
    playError: () => play('error'),
    playAchievement: () => play('achievement'),
    enabled: canPlay,
  };
}

