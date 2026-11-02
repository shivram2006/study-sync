// Web Audio API Sound Generator for Calls
// Generates realistic and pleasant ringtones, dial tones, and hangup sounds without external files.

let audioCtx = null;
let ringtoneInterval = null;
let dialToneInterval = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Play a pleasant romantic chime chord for incoming calls
const playChimeNote = (freq, startTime, duration, gainValue = 0.15) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const startRingtone = () => {
  stopRingtone();
  stopDialTone();

  const ctx = getAudioContext();
  if (!ctx) return;

  const playSequence = () => {
    try {
      const now = ctx.currentTime;
      // Romantic melodic chime pattern (F#4, A#4, C#5, F5)
      playChimeNote(370.0, now + 0.0, 0.45, 0.12);
      playChimeNote(466.16, now + 0.18, 0.45, 0.14);
      playChimeNote(554.37, now + 0.36, 0.55, 0.15);
      playChimeNote(698.46, now + 0.54, 0.9, 0.16);

      // Repeat after short gap
      playChimeNote(554.37, now + 1.2, 0.4, 0.12);
      playChimeNote(698.46, now + 1.4, 0.8, 0.15);
    } catch (e) {
      console.warn('Ringtone playback error:', e);
    }
  };

  playSequence();
  ringtoneInterval = setInterval(playSequence, 2800);
};

export const stopRingtone = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

export const startDialTone = () => {
  stopRingtone();
  stopDialTone();

  const ctx = getAudioContext();
  if (!ctx) return;

  const playDialBeep = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(480, now); // B4

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 0.8);
      gain.gain.linearRampToValueAtTime(0, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Dial tone error:', e);
    }
  };

  playDialBeep();
  dialToneInterval = setInterval(playDialBeep, 2500);
};

export const stopDialTone = () => {
  if (dialToneInterval) {
    clearInterval(dialToneInterval);
    dialToneInterval = null;
  }
};

export const playEndCallSound = () => {
  stopRingtone();
  stopDialTone();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    playChimeNote(440, now, 0.15, 0.1);
    playChimeNote(330, now + 0.15, 0.25, 0.1);
  } catch (e) {}
};
