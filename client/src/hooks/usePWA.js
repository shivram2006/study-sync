import { useState, useEffect } from 'react';

export const usePWA = () => {
  // Check if running as installed standalone PWA or previously marked installed
  const checkIsInstalled = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('zenith_pwa_installed') === 'true'
    );
  };

  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== 'undefined' ? window.__pwaInstallPrompt : null)
  );
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS (iPhone/iPad/iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIos(isApple);

    // Initial check
    if (checkIsInstalled()) {
      setIsInstalled(true);
    }

    // Capture prompt if it was already stored in window.__pwaInstallPrompt
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handlePromptReady = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
      }
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      try {
        localStorage.setItem('zenith_pwa_installed', 'true');
      } catch (err) {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (isInstalled) return;

    // On iOS Safari, browsers don't support programmatic install prompts, show swift guide
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('zenith_pwa_installed', 'true');
          } catch (e) {}
        }
        setDeferredPrompt(null);
        window.__pwaInstallPrompt = null;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // If browser hasn't fired beforeinstallprompt yet or already installed
      if ('standalone' in navigator && navigator.standalone) {
        setIsInstalled(true);
        localStorage.setItem('zenith_pwa_installed', 'true');
      } else {
        // Fallback for browsers that require standard menu action
        alert(
          'Please tap your browser menu (⋮ or Share icon) and choose "Add to Home Screen" or "Install App".'
        );
      }
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    isIos,
    showIosGuide,
    setShowIosGuide,
    triggerInstall,
    canInstall: !isInstalled
  };
};
