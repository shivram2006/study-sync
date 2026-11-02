import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export const VideoNotePlayer = ({ fileUrl, isMe }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative my-1">
      {/* Circular Video Container */}
      <div
        onClick={togglePlay}
        className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-lg border-3 border-rose-400 bg-stone-900 cursor-pointer group"
      >
        <video
          ref={videoRef}
          src={fileUrl}
          playsInline
          loop
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Play/Pause Center Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity">
            <div className="w-12 h-12 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-md">
              <Play size={20} className="ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Mute/Unmute Badge */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  );
};
