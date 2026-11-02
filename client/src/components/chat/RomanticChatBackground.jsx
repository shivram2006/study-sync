import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ChevronRight } from 'lucide-react';
import { romanticConfig } from '../../utils/romanticConfig';

// Cinematic Ken Burns animation presets for each photo in the cycle
const ANIMATION_VARIANTS = [
  {
    // Slide 0: Warm slow zoom in & gentle drift
    initial: { opacity: 0, scale: 1.02, x: 0, y: -5, filter: 'blur(3px)' },
    animate: {
      opacity: 0.32,
      scale: 1.14,
      x: 0,
      y: 12,
      filter: 'blur(1px)',
      transition: {
        opacity: { duration: 2.0, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        y: { duration: 7.5, ease: 'linear' },
        filter: { duration: 1.8 }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.18,
      filter: 'blur(3px)',
      transition: { duration: 1.8, ease: 'easeInOut' }
    }
  },
  {
    // Slide 1: Soft zoom out & pan right
    initial: { opacity: 0, scale: 1.15, x: -10, y: 0, filter: 'blur(3px)' },
    animate: {
      opacity: 0.30,
      scale: 1.03,
      x: 10,
      y: 5,
      filter: 'blur(1px)',
      transition: {
        opacity: { duration: 2.0, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        x: { duration: 7.5, ease: 'linear' },
        filter: { duration: 1.8 }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      filter: 'blur(3px)',
      transition: { duration: 1.8, ease: 'easeInOut' }
    }
  },
  {
    // Slide 2: Slow zoom in with gentle tilt
    initial: { opacity: 0, scale: 1.03, rotate: -0.6, filter: 'blur(3px)' },
    animate: {
      opacity: 0.34,
      scale: 1.15,
      rotate: 0.6,
      filter: 'blur(1px)',
      transition: {
        opacity: { duration: 2.0, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        rotate: { duration: 7.5, ease: 'linear' },
        filter: { duration: 1.8 }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.18,
      filter: 'blur(3px)',
      transition: { duration: 1.8, ease: 'easeInOut' }
    }
  },
  {
    // Slide 3: Warm drift up & zoom in
    initial: { opacity: 0, scale: 1.04, y: 15, filter: 'blur(3px)' },
    animate: {
      opacity: 0.32,
      scale: 1.13,
      y: -10,
      filter: 'blur(1px)',
      transition: {
        opacity: { duration: 2.0, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        y: { duration: 7.5, ease: 'linear' },
        filter: { duration: 1.8 }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.17,
      filter: 'blur(3px)',
      transition: { duration: 1.8, ease: 'easeInOut' }
    }
  },
  {
    // Slide 4: Cozy zoom out & pan left
    initial: { opacity: 0, scale: 1.16, x: 12, filter: 'blur(3px)' },
    animate: {
      opacity: 0.32,
      scale: 1.04,
      x: -8,
      filter: 'blur(1px)',
      transition: {
        opacity: { duration: 2.0, ease: 'easeInOut' },
        scale: { duration: 7.5, ease: 'linear' },
        x: { duration: 7.5, ease: 'linear' },
        filter: { duration: 1.8 }
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      filter: 'blur(3px)',
      transition: { duration: 1.8, ease: 'easeInOut' }
    }
  }
];

export const RomanticChatBackground = () => {
  const memories = useMemo(() => romanticConfig.memories || [], []);
  const [index, setIndex] = useState(0);

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
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Animated Photo Layer with Crossfade & Cinematic Ken Burns Motion */}
      <AnimatePresence mode="sync">
        {currentPhoto && (
          <motion.div
            key={currentPhoto.id || index}
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentPhoto.url})`,
              transformOrigin: 'center center'
            }}
          />
        )}
      </AnimatePresence>

      {/* Romantic Frosted Veil: Guarantees 100% Crisp Legibility of Chat Bubbles */}
      <div className="absolute inset-0 bg-radial from-white/55 via-[#FFF9FA]/70 to-rose-100/75 backdrop-blur-[2px]" />

      {/* Ambient Warm Rose Vignette */}
      <div className="absolute inset-0 bg-linear-to-b from-rose-100/30 via-transparent to-pink-100/40" />

      {/* Gently Drifting Romantic Micro-Hearts & Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: '10%', top: '20%', delay: 0, duration: 8.5, size: 14 },
          { left: '80%', top: '35%', delay: 2, duration: 9.8, size: 12 },
          { left: '25%', top: '65%', delay: 4, duration: 9.0, size: 16 },
          { left: '75%', top: '78%', delay: 1, duration: 11.2, size: 11 },
          { left: '48%', top: '15%', delay: 3, duration: 10.5, size: 13 },
          { left: '90%', top: '18%', delay: 2.5, duration: 12.0, size: 10 },
          { left: '15%', top: '85%', delay: 4.5, duration: 9.5, size: 15 }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [-15, -45, -15],
              opacity: [0.12, 0.45, 0.12],
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
            className="text-rose-400/45 pointer-events-none"
          >
            {i % 2 === 0 ? (
              <Heart size={item.size} className="fill-rose-300/45" />
            ) : (
              <Sparkles size={item.size} className="text-rose-300/50" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Discreet Romantic Memory Watermark Pill (Top Right, non-intrusive) */}
      <div className="absolute top-2.5 right-3 z-10 pointer-events-auto">
        <motion.button
          key={currentPhoto?.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 0.85, y: 0 }}
          exit={{ opacity: 0 }}
          whileHover={{ opacity: 1, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleNextPhoto}
          title="Click to jump to next memory"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/75 hover:bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-2xs text-[10px] font-medium text-rose-700 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {currentPhoto?.tag || 'Memory'} ({index + 1}/{memories.length})
          </span>
          <ChevronRight size={11} className="text-rose-400 -mr-0.5" />
        </motion.button>
      </div>
    </div>
  );
};
