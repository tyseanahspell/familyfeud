type SoundName =
  | 'reveal'
  | 'strike'
  | 'buzzer'
  | 'win'
  | 'steal'
  | 'ding'
  | 'theme'
  | 'timer'
  | 'fastMoneyReveal'
  | 'applause';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.18,
  delay = 0,
): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.02);
}

function noiseBurst(duration: number, gain = 0.2): void {
  const ctx = getCtx();
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start();
}

const players: Record<SoundName, () => void> = {
  reveal: () => {
    tone(523.25, 0.12, 'square', 0.12);
    tone(659.25, 0.14, 'square', 0.12, 0.08);
    tone(783.99, 0.22, 'triangle', 0.14, 0.16);
  },
  strike: () => {
    tone(180, 0.35, 'sawtooth', 0.22);
    tone(120, 0.4, 'square', 0.15, 0.05);
    noiseBurst(0.25, 0.15);
  },
  buzzer: () => {
    tone(140, 0.55, 'sawtooth', 0.25);
    tone(110, 0.55, 'square', 0.18, 0.02);
  },
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(f, 0.2, 'triangle', 0.14, i * 0.1);
    });
  },
  steal: () => {
    tone(392, 0.15, 'square', 0.14);
    tone(523.25, 0.18, 'square', 0.14, 0.12);
    tone(659.25, 0.25, 'triangle', 0.16, 0.24);
  },
  ding: () => {
    tone(880, 0.18, 'sine', 0.15);
    tone(1320, 0.25, 'triangle', 0.1, 0.05);
  },
  theme: () => {
    const notes = [392, 493.88, 587.33, 783.99, 587.33, 783.99];
    notes.forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, i * 0.14));
  },
  timer: () => {
    tone(660, 0.08, 'square', 0.08);
  },
  fastMoneyReveal: () => {
    tone(440, 0.1, 'square', 0.12);
    tone(554.37, 0.12, 'square', 0.12, 0.1);
    tone(659.25, 0.28, 'triangle', 0.15, 0.2);
  },
  applause: () => {
    noiseBurst(0.6, 0.12);
    tone(523.25, 0.3, 'triangle', 0.08, 0.05);
    tone(659.25, 0.3, 'triangle', 0.08, 0.15);
  },
};

export function playSound(name: SoundName, enabled = true): void {
  if (!enabled) return;
  try {
    players[name]();
  } catch {
    // Ignore audio failures (autoplay policies, etc.)
  }
}

export function unlockAudio(): void {
  try {
    getCtx();
  } catch {
    // ignore
  }
}

export type { SoundName };
