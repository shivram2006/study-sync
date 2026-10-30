/**
 * DISGUISED NOTIFICATION & AUDIO CHIME UTILITIES
 * -----------------------------------------------
 * Plays a pleasant, warm message tone using Web Audio API (zero external assets needed)
 * and dispatches disguised productivity notifications ("New task added") so that
 * notifications appearing on the lock screen or phone look 100% like a genuine To-Do list.
 */

let audioCtx = null;

// Initialize or unlock AudioContext on user interaction
export const initAudioContext = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('AudioContext init error:', err);
  }
};

/**
 * Play a sweet, pleasant romantic chime on message arrival
 */
export const playMessageTone = () => {
  try {
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // Harmonic chord notes: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
    const notes = [
      { freq: 523.25, start: now, duration: 0.28 },
      { freq: 659.25, start: now + 0.08, duration: 0.32 },
      { freq: 783.99, start: now + 0.16, duration: 0.45 }
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      // Smooth envelope to avoid popping
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(start);
      osc.stop(start + duration);
    });

    // Trigger haptic phone vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }
  } catch (err) {
    console.warn('Could not play message tone:', err);
  }
};

/**
 * Request system notification permissions
 */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      return false;
    }
  }

  return false;
};

/**
 * Dispatches a stealthy, disguised To-Do notification
 */
export const sendDisguisedNotification = async (customMessage = '') => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const title = 'New task added';
  const disguisedBodies = [
    'A new task was added to your daily focus list.',
    'Daily rhythm item synchronized successfully.',
    'New priority goal scheduled for today.',
    'Check your daily list for an updated item.'
  ];

  // Pick a realistic disguised body
  const body =
    disguisedBodies[Math.floor(Math.random() * disguisedBodies.length)];

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'zenith-task-update',
    renotify: true,
    silent: false // Browser handles sound or our audioCtx plays chime
  };

  try {
    // Try service worker notification first (better on mobile PWAs)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    }

    // Fallback to desktop window Notification
    new Notification(title, options);
  } catch (err) {
    console.warn('Notification error:', err);
  }
};
