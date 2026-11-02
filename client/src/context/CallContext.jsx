import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import {
  startRingtone,
  stopRingtone,
  startDialTone,
  stopDialTone,
  playEndCallSound
} from '../utils/callSounds';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Call states: 'idle' | 'calling' | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [partner, setPartner] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [callDuration, setCallDuration] = useState(0);
  const [callStatusNotice, setCallStatusNotice] = useState('');

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const queuedCandidatesRef = useRef([]);
  const durationTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const incomingDataRef = useRef(null);

  // Clean up streams & peer connection
  const cleanupMediaAndPeer = () => {
    stopRingtone();
    stopDialTone();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.close();
      } catch (e) {}
      peerConnectionRef.current = null;
    }

    queuedCandidatesRef.current = [];
    incomingDataRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
  };

  // Timer for connected calls
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Create new RTCPeerConnection and bind event handlers
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed' ||
        pc.iceConnectionState === 'closed'
      ) {
        // Handle disconnect if connection is dropped
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Get local user media (camera and/or microphone)
  const acquireMedia = async (type = 'video', currentFacing = 'user') => {
    const constraints = {
      audio: true,
      video:
        type === 'video'
          ? {
              facingMode: currentFacing,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          : false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Media devices request fallback:', err);
      // Fallback: audio only if camera is unavailable or denied
      if (type === 'video') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setCallType('audio');
          return audioStream;
        } catch (audioErr) {
          throw audioErr;
        }
      }
      throw err;
    }
  };

  // Start outgoing call
  const startCall = async ({ recipient, conversationId: convId, callType: requestedType = 'video' }) => {
    if (!socket || !recipient || !recipient._id) return;

    cleanupMediaAndPeer();
    setPartner(recipient);
    setConversationId(convId);
    setCallType(requestedType);
    setCallState('calling');
    setCallStatusNotice('Calling...');

    try {
      startDialTone();

      // Acquire media
      const stream = await acquireMedia(requestedType, facingMode);

      // Create peer connection
      const pc = createPeerConnection(recipient._id);

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send call signaling to partner
      socket.emit('call_user', {
        recipientId: recipient._id,
        conversationId: convId,
        callType: requestedType,
        offer,
        callerInfo: {
          _id: user._id,
          displayName: user.displayName,
          avatar: user.avatar,
          username: user.username
        }
      });

      // Ringing timeout (40 seconds without answer -> auto cancel)
      callTimeoutRef.current = setTimeout(() => {
        if (callState === 'calling') {
          endCall('No answer');
        }
      }, 40000);
    } catch (err) {
      console.error('Failed to initiate call:', err);
      stopDialTone();
      alert('Unable to access microphone or camera. Please grant permissions and try again.');
      cleanupMediaAndPeer();
      setCallState('idle');
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    const data = incomingDataRef.current;
    if (!data || !socket) return;

    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      setCallStatusNotice('Connecting...');

      // Acquire media based on incoming call type
      const stream = await acquireMedia(data.callType, facingMode);

      // Create peer connection
      const pc = createPeerConnection(data.callerId);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      // Process any early received ICE candidates
      if (queuedCandidatesRef.current.length > 0) {
        for (const candidate of queuedCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
        queuedCandidatesRef.current = [];
      }

      // Create answer and set local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer back to caller
      socket.emit('answer_call', {
        targetUserId: data.callerId,
        answer
      });

      setCallState('connected');
    } catch (err) {
      console.error('Failed to accept call:', err);
      alert('Could not start audio/video. Please ensure camera and microphone permissions are enabled.');
      rejectCall();
    }
  };

  // Reject / decline incoming call
  const rejectCall = () => {
    stopRingtone();
    const data = incomingDataRef.current;
    if (data && socket) {
      socket.emit('reject_call', {
        targetUserId: data.callerId,
        reason: 'declined'
      });
    }
    cleanupMediaAndPeer();
    setCallState('idle');
  };

  // End an active or outgoing call
  const endCall = (notice = '') => {
    playEndCallSound();
    if (partner && partner._id && socket) {
      socket.emit('end_call', {
        targetUserId: partner._id
      });
    }

    if (notice) {
      setCallStatusNotice(notice);
      setTimeout(() => setCallStatusNotice(''), 3000);
    }

    cleanupMediaAndPeer();
    setCallState('idle');
  };

  // Toggle microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle camera video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Switch camera (front / back)
  const switchCamera = async () => {
    if (callType !== 'video' || !peerConnectionRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peerConnectionRef.current && localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }

        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }

        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setFacingMode(nextFacing);
      }
    } catch (e) {
      console.warn('Failed to switch camera:', e);
    }
  };

  // Global socket signaling listeners
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming Call received
    const handleIncomingCall = (data) => {
      // If already in a call, reject automatically as busy
      if (callState !== 'idle') {
        socket.emit('reject_call', {
          targetUserId: data.callerId,
          reason: 'busy'
        });
        return;
      }

      incomingDataRef.current = data;
      setPartner(data.callerInfo);
      setConversationId(data.conversationId);
      setCallType(data.callType || 'video');
      setCallState('incoming');
      setCallStatusNotice('Incoming call...');
      startRingtone();

      // Incoming call ringing timeout (40 seconds)
      callTimeoutRef.current = setTimeout(() => {
        stopRingtone();
        cleanupMediaAndPeer();
        setCallState('idle');
      }, 40000);
    };

    // 2. Caller receives Answer from Callee
    const handleCallAnswered = async ({ responderId, answer }) => {
      stopDialTone();
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

          // Process queued ICE candidates
          if (queuedCandidatesRef.current.length > 0) {
            for (const cand of queuedCandidatesRef.current) {
              try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            queuedCandidatesRef.current = [];
          }

          setCallState('connected');
          setCallStatusNotice('');
        } catch (err) {
          console.error('Error applying remote answer:', err);
        }
      }
    };

    // 3. ICE Candidate received
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription &&
        peerConnectionRef.current.remoteDescription.type
      ) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      } else {
        queuedCandidatesRef.current.push(candidate);
      }
    };

    // 4. Call Rejected
    const handleCallRejected = ({ reason }) => {
      stopDialTone();
      stopRingtone();
      playEndCallSound();
      const msg = reason === 'busy' ? 'Partner is currently busy.' : 'Call declined.';
      setCallStatusNotice(msg);
      cleanupMediaAndPeer();
      setCallState('idle');
      setTimeout(() => setCallStatusNotice(''), 3500);
    };

    // 5. Call Ended by peer
    const handleCallEnded = () => {
      stopDialTone();
      stopRingtone();
      playEndCallSound();
      setCallStatusNotice('Call ended');
      cleanupMediaAndPeer();
      setCallState('idle');
      setTimeout(() => setCallStatusNotice(''), 3000);
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_answered', handleCallAnswered);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_answered', handleCallAnswered);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, callState]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        partner,
        conversationId,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        facingMode,
        callDuration,
        callStatusNotice,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  return (
    context || {
      callState: 'idle',
      callType: 'video',
      partner: null,
      conversationId: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      callStatusNotice: '',
      startCall: () => {},
      acceptCall: () => {},
      rejectCall: () => {},
      endCall: () => {},
      toggleMute: () => {},
      toggleVideo: () => {},
      switchCamera: () => {}
    }
  );
};
