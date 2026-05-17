export type ChimeSeverity = 'error' | 'warning' | 'info' | 'success';

interface ChimeParams {
  freq: number;
  duration: number;
  type: OscillatorType;
  freq2?: number;
}

const CHIME_PARAMS: Record<ChimeSeverity, ChimeParams> = {
  error: { freq: 880, duration: 0.55, type: 'sawtooth' },
  warning: { freq: 660, duration: 0.45, type: 'triangle' },
  info: { freq: 440, duration: 0.4, type: 'sine' },
  success: { freq: 523, freq2: 659, duration: 0.5, type: 'sine' },
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function unlockAudioContext(): void {
  const audioCtx = getContext();
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
}

export function playChime(severity: ChimeSeverity, volume: number = 0.5): void {
  const audioCtx = getContext();
  if (audioCtx.state === 'suspended') return;

  const params = CHIME_PARAMS[severity];
  const now = audioCtx.currentTime;

  const playTone = (freq: number, startAt: number, dur: number) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = params.type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), startAt);
    gain.gain.setTargetAtTime(0, startAt + dur * 0.6, 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startAt);
    osc.stop(startAt + dur);
  };

  if (params.freq2 !== undefined) {
    playTone(params.freq, now, params.duration * 0.5);
    playTone(params.freq2, now + params.duration * 0.45, params.duration * 0.55);
  } else {
    playTone(params.freq, now, params.duration);
  }
}

export function getAudioContextState(): AudioContextState | null {
  return ctx?.state ?? null;
}
