import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Video, StopCircle } from 'lucide-react';

export const VideoNoteRecorderModal = ({ isOpen, onClose, onSendVideoNote }) => {
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // front camera by default
  const [uploading, setUploading] = useState(false);

  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      return;
    }

    startCamera(facingMode);

    return () => {
      cleanupStream();
    };
  }, [isOpen, facingMode]);

  const cleanupStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordedBlob(null);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startCamera = async (mode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 480 }, height: { ideal: 480 } },
        audio: true
      });
      setStream(newStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera and microphone for video note.');
      onClose();
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    setRecordingSeconds(0);

    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(250);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 59) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setUploading(true);
    try {
      await onSendVideoNote(recordedBlob, recordingSeconds);
      onClose();
    } catch (err) {
      console.error('Error sending video note:', err);
      alert('Failed to send video note.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative flex flex-col items-center bg-stone-900/90 border border-rose-500/30 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <h3 className="text-sm font-semibold text-rose-300 mb-4 flex items-center gap-1.5 font-serif-romantic">
            <Video size={16} />
            <span>Record Video Note</span>
          </h3>

          {/* Circular Viewfinder */}
          <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-rose-500 shadow-xl bg-black">
            {previewUrl ? (
              <video
                src={previewUrl}
                playsInline
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}

            {/* Live recording ring / badge */}
            {isRecording && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-600/90 text-[11px] font-mono font-bold flex items-center gap-1 shadow-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-6">
            {!previewUrl ? (
              <>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title="Start recording"
                  >
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 text-rose-500 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title="Stop recording"
                  >
                    <StopCircle size={28} />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  disabled={uploading}
                  className="p-3 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all cursor-pointer"
                  title="Retake"
                >
                  <RotateCcw size={18} />
                </button>

                <button
                  onClick={handleSend}
                  disabled={uploading}
                  className="px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Video Note</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-stone-400 mt-4 text-center">
            {previewUrl
              ? 'Preview your video note before sending'
              : isRecording
              ? 'Tap stop when done (max 60s)'
              : 'Tap to start recording circular video note'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
