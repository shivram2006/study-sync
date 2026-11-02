import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { romanticConfig } from '../../utils/romanticConfig';
import confetti from 'canvas-confetti';

export const MemoriesGallery = () => {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const memories = romanticConfig.memories || [];

  const handleOpenPhoto = (idx) => {
    setSelectedIdx(idx);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#fb7185', '#f43f5e', '#fda4af', '#fecdd3']
    });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIdx((prev) => (prev > 0 ? prev - 1 : memories.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIdx((prev) => (prev < memories.length - 1 ? prev + 1 : 0));
  };

  const currentItem = selectedIdx !== null ? memories[selectedIdx] : null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-rose-500" />
          <h2 className="text-sm font-serif-romantic font-bold text-stone-900 tracking-tight">
            Our Scrapbook & Little Moments
          </h2>
        </div>
        <span className="text-[11px] text-rose-500 font-medium font-serif-romantic italic">
          {memories.length} treasured memories
        </span>
      </div>

      {/* Horizontal Polaroid Carousel */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar snap-x snap-mandatory">
        {memories.map((item, index) => {
          // Playful alternating rotation angles for natural polaroid look
          const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'];
          const rotationClass = rotations[index % rotations.length];

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05, rotate: 0, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenPhoto(index)}
              className={`shrink-0 w-36 sm:w-44 bg-white p-2.5 pb-3 rounded-2xl shadow-sm hover:shadow-xl border border-rose-100/90 transition-all cursor-pointer transform ${rotationClass} snap-start group`}
            >
              {/* Photo Container */}
              <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-rose-50/50 mb-2">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-md">
                    <Eye size={15} />
                  </div>
                </div>
                {/* Romantic Tag Pill */}
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/90 text-rose-700 backdrop-blur-xs shadow-xs">
                  {item.tag}
                </span>
              </div>

              {/* Polaroid Caption */}
              <div className="text-center px-0.5">
                <p className="font-serif-romantic text-xs font-bold text-stone-900 truncate">
                  {item.title}
                </p>
                <p className="text-[10px] text-stone-500 truncate mt-0.5 font-serif-romantic italic">
                  {item.caption}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Fullscreen Modal */}
      <AnimatePresence>
        {currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIdx(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIdx(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
            >
              <X size={20} />
            </button>

            {/* Previous Photo Button */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 p-2 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer z-50"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Next Photo Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 p-2 sm:p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer z-50"
            >
              <ChevronRight size={22} />
            </button>

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-3 sm:p-4 max-w-sm sm:max-w-md w-full shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="relative rounded-2xl overflow-hidden bg-stone-900 max-h-[65vh] flex items-center justify-center">
                <img
                  src={currentItem.url}
                  alt={currentItem.title}
                  className="w-full h-auto max-h-[65vh] object-contain mx-auto"
                />
                <button
                  onClick={() =>
                    confetti({
                      particleCount: 40,
                      spread: 60,
                      origin: { y: 0.6 },
                      colors: ['#fb7185', '#f43f5e', '#fda4af']
                    })
                  }
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-rose-500/90 text-white shadow-lg active:scale-90 transition-transform cursor-pointer"
                  title="Send Heart"
                >
                  <Heart size={16} className="fill-white" />
                </button>
              </div>

              {/* Caption & Title */}
              <div className="p-3 text-center">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 uppercase tracking-widest mb-1">
                  <Heart size={11} className="fill-rose-500 text-rose-500" />
                  <span>{currentItem.tag}</span>
                </div>
                <h3 className="font-serif-romantic text-lg font-bold text-stone-900 leading-snug">
                  {currentItem.title}
                </h3>
                <p className="font-serif-romantic italic text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  "{currentItem.caption}"
                </p>
                <div className="mt-2 text-[10px] text-stone-400">
                  {selectedIdx + 1} of {memories.length}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
