import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ChevronRight, Eye, SunMedium } from 'lucide-react';
import { romanticConfig } from '../../utils/romanticConfig';

// Cinematic Ken Burns animation presets for each photo in the cycle (Clear, Sharp & Vibrant)
const ANIMATION_VARIANTS = [
  {
    // Slide 0: Warm slow zoom in & gentle drift
    initial: { opacity: 0, scale: 1.02, x: 0, y: -6 },
    animate: {
      opacity: 0.82,
      scale: 1.12,
      x: 0,
      y: 10,
      transition: {
        opacity: { duration: 1.8, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        y: { duration: 7.5, ease: 'linear' }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.16,
      transition: { duration: 1.6, ease: 'easeInOut' }
    }
  },
  {
    // Slide 1: Soft zoom out & pan right
    initial: { opacity: 0, scale: 1.14, x: -8, y: 0 },
    animate: {
      opacity: 0.80,
      scale: 1.03,
      x: 8,
      y: 6,
      transition: {
        opacity: { duration: 1.8, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        x: { duration: 7.5, ease: 'linear' }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: { duration: 1.6, ease: 'easeInOut' }
    }
  },
  {
    // Slide 2: Slow zoom in with gentle tilt
    initial: { opacity: 0, scale: 1.03, rotate: -0.5 },
    animate: {
      opacity: 0.84,
      scale: 1.13,
      rotate: 0.5,
      transition: {
        opacity: { duration: 1.8, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        rotate: { duration: 7.5, ease: 'linear' }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.16,
      transition: { duration: 1.6, ease: 'easeInOut' }
    }
  },
  {
    // Slide 3: Warm drift up & zoom in
    initial: { opacity: 0, scale: 1.04, y: 12 },
    animate: {
      opacity: 0.82,
      scale: 1.12,
      y: -8,
      transition: {
        opacity: { duration: 1.8, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        y: { duration: 7.5, ease: 'linear' }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.15,
      transition: { duration: 1.6, ease: 'easeInOut' }
    }
  },
  {
    // Slide 4: Cozy zoom out & pan left
    initial: { opacity: 0, scale: 1.15, x: 10 },
    animate: {
      opacity: 0.82,
      scale: 1.04,
      x: -6,
      transition: {
        opacity: { duration: 1.8, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        x: { duration: 7.5, ease: 'linear' }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: { duration: 1.6, ease: 'easeInOut' }
    }
  }
];

export const RomanticChatBackground = () => {
  const memories = useMemo(() => romanticConfig.memories || [], []);
  const [index, setIndex] = useState(0);
  const [vividMode, setVividMode] = useState(true); // High visibility by default

  // Preload all 5 images on mount for zero-latency seamless crossfades
  useEffect(() => {
    memories.forEach((mem) => {
      const img = new Image();
      img.src = mem.url;
    });
  }, [memories]);

  // Infinitely loop through the 5 photos every 7 seconds
  useEffect(() => {
    if (memories.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % memories.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [memories.length]);

  const currentPhoto = memories[index] || memories[0];
  const variant = ANIMATION_VARIANTS[index % ANIMATION_VARIANTS.length];

  // Helper to manually jump to the next memory on tap
  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % memories.length);
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#FAF7F7]">
      {/* Animated Photo Layer with Crossfade & Vibrant Ken Burns Motion */}
      <AnimatePresence mode="sync">
        {currentPhoto && (
          <motion.div
            key={currentPhoto.id || index}
            initial={variant.initial}
            animate={{
              ...variant.animate,
              opacity: vividMode ? 0.85 : 0.60
            }}
            exit={variant.exit}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentPhoto.url})`,
              transformOrigin: 'center center'
            }}
          />
        )}
      </AnimatePresence>

      {/* Gentle Romantic Gradient Tint - Keeps photos clearly visible while ensuring chat readability */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: vividMode
            ? 'radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, rgba(255,242,245,0.28) 60%, rgba(254,226,233,0.45) 100%)'
            : 'radial-gradient(circle at center, rgba(255,255,255,0.35) 0%, rgba(255,242,245,0.55) 60%, rgba(254,226,233,0.65) 100%)'
        }}
      />

      {/* Soft Vignette Edge */}
      <div className="absolute inset-0 bg-linear-to-b from-white/35 via-transparent to-white/40 pointer-events-none" />

      {/* Gently Drifting Romantic Micro-Hearts & Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: '8%', top: '22%', delay: 0, duration: 8.5, size: 14 },
          { left: '82%', top: '35%', delay: 2, duration: 9.8, size: 12 },
          { left: '22%', top: '68%', delay: 4, duration: 9.0, size: 16 },
          { left: '76%', top: '78%', delay: 1, duration: 11.2, size: 11 },
          { left: '50%', top: '15%', delay: 3, duration: 10.5, size: 13 },
          { left: '92%', top: '18%', delay: 2.5, duration: 12.0, size: 10 }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [-15, -45, -15],
              opacity: [0.2, 0.65, 0.2],
              rotate: [-6, 8, -6]
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              left: item.left,
              top: item.top
            }}
            className="text-rose-500/60 pointer-events-none drop-shadow-xs"
          >
            {i % 2 === 0 ? (
              <Heart size={item.size} className="fill-rose-400/60" />
            ) : (
              <Sparkles size={item.size} className="text-rose-400/65" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Romantic Memory Chip (Top Right) */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-auto flex items-center gap-1.5">
        <motion.button
          key={currentPhoto?.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 0.92, y: 0 }}
          exit={{ opacity: 0 }}
          whileHover={{ opacity: 1, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleNextPhoto}
          title="Click to jump to next photo"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-rose-200/90 shadow-xs text-[11px] font-semibold text-rose-700 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="truncate max-w-[130px] sm:max-w-[190px]">
            {currentPhoto?.tag || 'Memory'} ({index + 1}/{memories.length})
          </span>
          <ChevronRight size={12} className="text-rose-500 -mr-0.5" />
        </motion.button>

        {/* Toggle between Vivid & Soft opacity */}
        <button
          type="button"
          onClick={() => setVividMode(!vividMode)}
          title={vividMode ? 'Switch to Soft Background' : 'Switch to Vivid Photo'}
          className="p-1 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-rose-200/90 text-rose-600 shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <SunMedium size={13} className={vividMode ? 'text-amber-500' : 'text-stone-400'} />
        </button>
      </div>
    </div>
  );
};
