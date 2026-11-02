import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RotateCcw,
  Maximize2,
  Minimize2,
  Heart,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { romanticConfig } from '../../utils/romanticConfig';

export const CallModal = () => {
  const {
    callState,
    callType,
    partner,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    callStatusNotice,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isMinimized]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, isMinimized]);

  // Format call duration MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' && !callStatusNotice) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element to ensure remote audio always plays through speakers */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Floating Status Notice Toast (e.g. Call Ended / Declined) */}
      <AnimatePresence>
        {callStatusNotice && callState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium shadow-xl flex items-center gap-2 border border-stone-700/60"
          >
            <Sparkles size={14} className="text-rose-400" />
            <span>{callStatusNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          1. INCOMING CALL SCREEN OVERLAY
         ========================================================================= */}
      <AnimatePresence>
        {callState === 'incoming' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-rose-200/80 relative overflow-hidden"
            >
              {/* Romantic background tint */}
              <div className="absolute inset-0 bg-radial from-rose-100/40 via-transparent to-transparent pointer-events-none" />

              {/* Pulsing Avatar */}
              <div className="relative w-28 h-28 mx-auto mb-5">
                <span className="absolute inset-0 rounded-full bg-rose-400/25 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-rose-300/30 animate-pulse" />
                <img
                  src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                  alt={partner?.displayName || 'Partner'}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                  {callType === 'video' ? <Video size={13} /> : <Phone size={13} />}
                </span>
              </div>

              <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
                {partner?.displayName || 'My Love'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">@{partner?.username}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 bg-rose-50 border border-rose-200/60 rounded-full text-[11px] font-medium text-rose-700">
                <Heart size={12} className="fill-rose-500 text-rose-500" />
                <span>
                  Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
                </span>
              </div>

              {/* Action Buttons: Accept / Decline */}
              <div className="flex items-center justify-center gap-6 mt-8">
                {/* Decline Button */}
                <button
                  onClick={rejectCall}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  title="Decline"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 group-hover:shadow-rose-300/50">
                    <PhoneOff size={24} />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-500">Decline</span>
                </button>

                {/* Accept Button */}
                <button
                  onClick={acceptCall}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  title="Accept"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-90 animate-bounce group-hover:shadow-emerald-300/50">
                    <Phone size={24} />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Accept</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          2. OUTGOING CALL SCREEN (Calling...)
         ========================================================================= */}
      <AnimatePresence>
        {callState === 'calling' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-rose-200/80 relative"
            >
              {/* Pulsing Avatar */}
              <div className="relative w-28 h-28 mx-auto mb-5">
                <span className="absolute -inset-3 rounded-full bg-rose-200/40 animate-ping" />
                <img
                  src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                  alt={partner?.displayName || 'Partner'}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                />
              </div>

              <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
                {partner?.displayName || 'My Love'}
              </h3>
              <p className="text-xs text-rose-500 font-medium mt-1 animate-pulse">
                Calling ({callType === 'video' ? 'Video' : 'Audio'})...
              </p>
              <p className="text-[11px] text-stone-400 mt-1">Waiting for partner to answer</p>

              {/* End Call / Cancel Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => endCall('Call cancelled')}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-90">
                    <PhoneOff size={24} />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-500">Cancel</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          3. ACTIVE CONNECTED CALL OVERLAY
         ========================================================================= */}
      <AnimatePresence>
        {callState === 'connected' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed z-50 transition-all duration-300 ${
              isMinimized
                ? 'bottom-20 right-4 w-72 h-44 rounded-2xl shadow-2xl border-2 border-rose-300 overflow-hidden bg-stone-900'
                : 'inset-0 bg-stone-950 flex flex-col justify-between'
            }`}
          >
            {/* Top Bar: Caller Info, Duration, Security & Controls */}
            <div className="p-4 flex items-center justify-between text-white z-20 bg-linear-to-b from-black/75 to-transparent">
              <div className="flex items-center gap-2.5">
                <img
                  src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                  alt={partner?.displayName || 'Partner'}
                  className="w-9 h-9 rounded-full object-cover border border-rose-300"
                />
                <div>
                  <h4 className="text-sm font-semibold truncate leading-tight">
                    {partner?.displayName || 'My Love'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{formatDuration(callDuration)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-stone-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Encrypted</span>
                </span>

                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title={isMinimized ? 'Expand Call' : 'Minimize Call'}
                >
                  {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </button>
              </div>
            </div>

            {/* Main Stage: Remote Video or Romantic Audio Card */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {callType === 'video' ? (
                <>
                  {/* Remote Video Stream */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Fallback if remote stream has no active video */}
                  {!remoteStream?.getVideoTracks().some((t) => t.enabled) && (
                    <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center">
                      <img
                        src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                        alt="Partner"
                        className="w-24 h-24 rounded-full border-2 border-rose-400/60 object-cover shadow-2xl"
                      />
                      <p className="text-xs text-stone-300 mt-3 font-serif-romantic">
                        Partner's camera is off
                      </p>
                    </div>
                  )}

                  {/* Self Picture-in-Picture Preview */}
                  {!isMinimized && (
                    <motion.div
                      drag
                      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                      className="absolute bottom-24 right-4 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/60 bg-stone-900 z-20 cursor-move"
                    >
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${
                          isVideoOff ? 'hidden' : ''
                        } scale-x-[-1]`}
                      />
                      {isVideoOff && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400 p-2 text-center">
                          <VideoOff size={18} className="mb-1" />
                          <span className="text-[10px]">Camera Off</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              ) : (
                /* Audio Call UI */
                <div className="text-center p-6 text-white max-w-sm">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <span className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
                    <span className="absolute -inset-2 rounded-full bg-rose-400/30 animate-pulse" />
                    <img
                      src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                      alt={partner?.displayName}
                      className="relative w-32 h-32 rounded-full object-cover border-4 border-rose-300 shadow-2xl mx-auto"
                    />
                  </div>
                  <h3 className="text-xl font-serif-romantic font-bold">
                    {partner?.displayName || 'My Love'}
                  </h3>
                  <p className="text-xs text-rose-300 mt-1">Audio Call in Progress</p>
                  <p className="text-xs text-stone-400 mt-4 italic font-serif-romantic">
                    "Distance means so little when someone means so much."
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Controls Toolbar */}
            <div className="p-4 sm:p-6 flex items-center justify-center gap-3 sm:gap-5 z-20 bg-linear-to-t from-black/85 via-black/40 to-transparent">
              {/* Mic Toggle */}
              <button
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-90 ${
                  isMuted
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Video Toggle (Only in video calls) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-90 ${
                    isVideoOff
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              {/* Flip Camera (Front / Rear) */}
              {callType === 'video' && (
                <button
                  onClick={switchCamera}
                  className="p-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer active:scale-90"
                  title="Flip Camera"
                >
                  <RotateCcw size={20} />
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={() => endCall('Call ended')}
                className="p-3.5 sm:px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl flex items-center gap-2 transition-all active:scale-90 cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={22} />
                <span className="hidden sm:inline text-xs font-bold">End Call</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
