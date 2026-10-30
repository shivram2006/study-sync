import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, Check, X } from 'lucide-react';

export const IosInstallModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full sm:max-w-md bg-stone-50 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-stone-200 text-stone-800 pb-safe"
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Install on iPhone (Safari)</h3>
              <p className="text-xs text-stone-500">Add Zenith to your Home Screen in 3 easy steps</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="py-5 space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-stone-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Share size={17} />
              </div>
              <div>
                <p className="font-semibold text-stone-800">1. Tap the Share button</p>
                <p className="text-stone-500 text-xs">At the bottom of your Safari browser toolbar.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-stone-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <PlusSquare size={17} />
              </div>
              <div>
                <p className="font-semibold text-stone-800">2. Select "Add to Home Screen"</p>
                <p className="text-stone-500 text-xs">Scroll down the sharing sheet until you see this option.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-stone-100 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Check size={17} />
              </div>
              <div>
                <p className="font-semibold text-stone-800">3. Tap "Add"</p>
                <p className="text-stone-500 text-xs">In the top right corner of the confirmation screen.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-stone-50 font-medium text-xs sm:text-sm hover:bg-stone-800 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
