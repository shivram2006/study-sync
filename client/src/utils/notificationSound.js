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
 * Converts a URL-safe Base64 string into a Uint8Array for applicationServerKey
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Subscribes the current device/PWA to Web Push notifications.
 * This registers with Apple (iOS 16.4+) or Google FCM (Android) so that
 * when the app is completely CLOSED or phone is LOCKED, the phone still
 * receives the disguised "New task added" push alert!
 */
export const subscribeUserToPush = async (authToken = null) => {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    console.warn('Web Push is not supported in this browser environment');
    return null;
  }

  try {
    // 1. Request notification permission if not yet granted
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      console.log('Notification permission not granted by user:', perm);
      return null;
    }

    // 2. Wait for Service Worker to be active and ready
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      console.warn('Service worker pushManager not available');
      return null;
    }

    // 3. Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // 4. If no active subscription, subscribe with VAPID key
    if (!subscription) {
      const vapidRes = await fetch('/api/users/vapid-key');
      const vapidData = await vapidRes.json();

      if (!vapidData.success || !vapidData.publicKey) {
        throw new Error('Could not fetch VAPID public key from server');
      }

      const convertedKey = urlBase64ToUint8Array(vapidData.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // 5. Sync subscription with backend database
    const token = authToken || localStorage.getItem('zenith_auth_token');
    if (token && subscription) {
      await fetch('/api/users/subscribe-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });
      console.log('✅ Background WebPush registered & synced with server');
    }

    return subscription;
  } catch (error) {
    console.error('Error during Web Push subscription:', error);
    return null;
  }
};

/**
 * Dispatches a stealthy, disguised To-Do notification when foreground app is active
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
