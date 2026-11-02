import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

export const VoiceNotePlayer = ({ fileUrl, duration: initialDuration = 0, isMe }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const cycleSpeed = (e) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * (duration || audioRef.current?.duration || 1);
    if (audioRef.current && !isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Visual pseudo-waveform bars
  const waveBars = [30, 60, 45, 80, 50, 90, 70, 40, 85, 60, 95, 45, 65, 80, 35, 75, 55, 90, 40, 70];

  return (
    <div className="flex items-center gap-2.5 py-1 px-0.5 min-w-[200px] sm:min-w-[240px]">
      <audio ref={audioRef} src={fileUrl} preload="metadata" />

      {/* Play/Pause Circle */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all ${
          isMe
            ? 'bg-white text-rose-600 hover:bg-rose-50'
            : 'bg-rose-500 text-white hover:bg-rose-600'
        }`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      {/* Waveform Scrubber & Timers */}
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="h-7 flex items-center gap-[2.5px] cursor-pointer group"
          title="Click to seek"
        >
          {waveBars.map((height, i) => {
            const barProgress = (i / waveBars.length) * 100;
            const isFilled = barProgress <= progressPercent;
            return (
              <span
                key={i}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors ${
                  isFilled
                    ? isMe
                      ? 'bg-white'
                      : 'bg-rose-600'
                    : isMe
                    ? 'bg-rose-300/60 group-hover:bg-rose-200'
                    : 'bg-stone-300 group-hover:bg-stone-400'
                }`}
              />
            );
          })}
        </div>

        <div
          className={`flex items-center justify-between text-[10px] mt-0.5 font-mono ${
            isMe ? 'text-rose-100' : 'text-stone-500'
          }`}
        >
          <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.2 rounded-md font-sans text-[9px] font-bold cursor-pointer transition-colors ${
              isMe
                ? 'bg-rose-600/60 hover:bg-rose-600 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
