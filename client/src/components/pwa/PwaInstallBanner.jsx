import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallBanner = ({ isInstalled, onInstall }) => {
  const [dismissed, setDismissed] = useState(false);

  // If already installed or dismissed, completely remove the banner from UI
  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-stone-100 px-4 py-2.5 shadow-sm border-b border-stone-800/80"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-stone-700/80 flex items-center justify-center shrink-0 text-emerald-400">
              <Smartphone size={14} />
            </div>
            <span className="truncate font-medium text-stone-200">
              Click to Download & Add to Home Screen
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onInstall}
              className="bg-stone-100 hover:bg-white text-stone-900 font-semibold px-3.5 py-1 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              <span>Install App</span>
            </button>

            <button
              onClick={() => {
                setDismissed(true);
                try {
                  localStorage.setItem('zenith_pwa_dismissed', 'true');
                } catch (e) {}
              }}
              aria-label="Dismiss banner"
              className="text-stone-400 hover:text-stone-200 p-1 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
