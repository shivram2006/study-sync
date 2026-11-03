import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  Trash2,
  Reply,
  X,
  FileText,
  Download,
  Heart,
  Sparkles,
  Phone,
  Video,
  Mic,
  StopCircle,
  MoreVertical,
  Clock
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { romanticConfig } from '../utils/romanticConfig';
import { formatLastSeen, formatMessageTime } from '../utils/dateUtils';
import { RomanticChatBackground } from '../components/chat/RomanticChatBackground';
import { VoiceNotePlayer } from '../components/chat/VoiceNotePlayer';
import { VideoNotePlayer } from '../components/chat/VideoNotePlayer';
import { VideoNoteRecorderModal } from '../components/chat/VideoNoteRecorderModal';
import { MessageActionModal } from '../components/chat/MessageActionModal';
import { chatCache } from '../utils/chatCache';
import { clearAllNotifications } from '../utils/notificationSound';
import confetti from 'canvas-confetti';

export const ChatRoomPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { startCall } = useCall();

  // Instant 0ms SWR Cache Hydration (zero blank screen / zero pop-in)
  const cachedChat = chatCache.getChat(conversationId);
  const [conversation, setConversation] = useState(() => cachedChat?.conversation || null);
  const [messages, setMessages] = useState(() => cachedChat?.messages || []);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(() => !cachedChat?.messages?.length);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // WhatsApp-style message action sheet & modals
  const [activeActionMessage, setActiveActionMessage] = useState(null);
  const [isVideoNoteOpen, setIsVideoNoteOpen] = useState(false);

  // Voice Note Recording States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceMediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const voiceStreamRef = useRef(null);

  // Long press timer for mobile
  const longPressTimerRef = useRef(null);

  // Dynamic Visual Viewport tracking for iOS Safari & Standalone PWA
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' && window.visualViewport
      ? window.visualViewport.height
      : typeof window !== 'undefined'
      ? window.innerHeight
      : 800
  );
  const [viewportTop, setViewportTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Lock body scroll in chat & strictly align container with visualViewport (fixes iOS PWA keyboard displacement)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.height = '100%';
    document.body.style.width = '100%';

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      const vv = window.visualViewport;
      setViewportHeight(vv.height);
      setViewportTop(vv.offsetTop);

      // Keyboard is open if visual viewport is substantially smaller than window.innerHeight
      const keyboardOpen = window.innerHeight - vv.height > 100;
      setIsKeyboardOpen(keyboardOpen);

      // Force window scroll to 0 to prevent iOS from displacing header off-screen
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.width = originalWidth;
      window.scrollTo(0, 0);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // When keyboard opens or closes, auto-scroll to latest messages
  useEffect(() => {
    if (isKeyboardOpen) {
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 150);
    }
  }, [isKeyboardOpen]);

  // Safe mark-as-seen trigger: ONLY marks messages as read when the tab is actively visible to the user
  const triggerMarkAsSeen = () => {
    if (document.visibilityState !== 'visible') {
      return;
    }
    if (!conversationId) return;

    chatService.markAsRead(conversationId).catch(() => {});
    if (socket && socket.connected) {
      socket.emit('mark_seen', { conversationId });
    }
  };

  // Silent background sync without disrupting the UI
  const syncLatestMessages = async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        chatService.getConversationById(conversationId),
        chatService.getMessages(conversationId)
      ]);

      if (convRes.success && convRes.conversation) {
        setConversation(convRes.conversation);
      }

      if (msgRes.success && msgRes.messages) {
        setMessages((prev) => {
          if (prev.length === 0) return msgRes.messages;
          const prevMap = new Map(prev.map((m) => [m._id, m]));
          let hasChanges = false;

          msgRes.messages.forEach((freshMsg) => {
            const existing = prevMap.get(freshMsg._id);
            if (!existing) {
              prevMap.set(freshMsg._id, freshMsg);
              hasChanges = true;
            } else if (
              existing.isEdited !== freshMsg.isEdited ||
              existing.isDeleted !== freshMsg.isDeleted ||
              (existing.readBy?.length || 0) !== (freshMsg.readBy?.length || 0) ||
              (existing.reactions?.length || 0) !== (freshMsg.reactions?.length || 0)
            ) {
              prevMap.set(freshMsg._id, freshMsg);
              hasChanges = true;
            }
          });

          if (!hasChanges) return prev;
          return Array.from(prevMap.values()).sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });

        chatCache.setChat(conversationId, msgRes.messages, convRes.conversation || conversation);
      }
    } catch (err) {
      console.warn('Silent sync error:', err);
    }
  };

  // Load conversation details & messages
  const loadChatData = async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        chatService.getConversationById(conversationId),
        chatService.getMessages(conversationId)
      ]);

      if (convRes.success) {
        setConversation(convRes.conversation);
      }
      if (msgRes.success) {
        setMessages(msgRes.messages);
        chatCache.setChat(conversationId, msgRes.messages, convRes.conversation);
      }
    } catch (err) {
      console.error('Error loading chat room:', err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  };

  useEffect(() => {
    clearAllNotifications();
    loadChatData();
  }, [conversationId]);

  // Periodic 4.5-second lightweight background sync while chat tab is active
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncLatestMessages();
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Mark messages as read ONLY when user is actively viewing the chat window
  useEffect(() => {
    if (!conversationId) return;

    if (document.visibilityState === 'visible') {
      triggerMarkAsSeen();
      clearAllNotifications();
    }

    const onVisibilityOrFocusChange = () => {
      if (document.visibilityState === 'visible') {
        triggerMarkAsSeen();
        clearAllNotifications();
        if (socket && socket.connected) {
          socket.emit('join_conversation', { conversationId });
        }
        syncLatestMessages();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
    window.addEventListener('focus', onVisibilityOrFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityOrFocusChange);
      window.removeEventListener('focus', onVisibilityOrFocusChange);
    };
  }, [conversationId, socket]);

  // Clean up any ongoing voice recording on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    // When socket reconnects (e.g. mobile wakes up from sleep), automatically re-join & sync!
    const handleSocketConnect = () => {
      socket.emit('join_conversation', { conversationId });
      syncLatestMessages();
    };

    const handleNewMessage = ({ message }) => {
      if (message.conversationId.toString() === conversationId.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;

          // If this replaces an optimistic message sent by me
          const tempIdx = prev.findIndex(
            (m) =>
              typeof m._id === 'string' &&
              m._id.startsWith('temp_') &&
              m.content === message.content &&
              (m.senderId?._id || m.senderId)?.toString() === user?._id?.toString()
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = message;
            return next;
          }

          return [...prev, message];
        });
        scrollToBottom();
        clearAllNotifications();

        const senderId = (message.senderId?._id || message.senderId)?.toString();
        const currentUserId = user?._id?.toString();

        if (senderId && senderId !== currentUserId && document.visibilityState === 'visible') {
          triggerMarkAsSeen();
        }
      }
    };

    const handleUnreadUpdate = ({ conversationId: convId, message }) => {
      if (message && convId.toString() === conversationId.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
        clearAllNotifications();
        triggerMarkAsSeen();
      }
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleEdited = ({ messageId, content, isEdited, editedAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, content, isEdited, editedAt } : m
        )
      );
    };

    const handleDelete = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted', fileUrl: '' }
            : m
        )
      );
    };

    const handleDeleteForMe = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const handleMessagesRead = ({ readerId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          const currentUserId = user?._id?.toString();
          const senderId = (m.senderId?._id || m.senderId)?.toString();
          if (senderId === currentUserId && !m.readBy.some((r) => r.toString() === readerId.toString())) {
            return {
              ...m,
              readBy: [...m.readBy, readerId],
              deliveredTo: [...m.deliveredTo, readerId]
            };
          }
          return m;
        })
      );
    };

    const handleDelivered = ({ userId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          const currentUserId = user?._id?.toString();
          const senderId = (m.senderId?._id || m.senderId)?.toString();
          if (senderId === currentUserId && !m.deliveredTo.some((d) => d.toString() === userId.toString())) {
            return { ...m, deliveredTo: [...m.deliveredTo, userId] };
          }
          return m;
        })
      );
    };

    const handlePartnerTyping = ({ userId }) => {
      if (userId !== user._id) {
        setPartnerTyping(true);
      }
    };

    const handlePartnerStopTyping = ({ userId }) => {
      if (userId !== user._id) {
        setPartnerTyping(false);
      }
    };

    const handleUserStatusChanged = ({ userId, isOnline, lastSeen }) => {
      setConversation((prev) => {
        if (!prev || !prev.recipient) return prev;
        if (prev.recipient._id?.toString() === userId?.toString()) {
          return {
            ...prev,
            recipient: {
              ...prev.recipient,
              isOnline,
              lastSeen: lastSeen || new Date()
            }
          };
        }
        return prev;
      });
    };

    socket.on('connect', handleSocketConnect);
    socket.on('new_message', handleNewMessage);
    socket.on('unread_update', handleUnreadUpdate);
    socket.on('message_reaction_updated', handleReaction);
    socket.on('message_edited', handleEdited);
    socket.on('message_deleted', handleDelete);
    socket.on('message_deleted_for_me', handleDeleteForMe);
    socket.on('messages_read', handleMessagesRead);
    socket.on('messages_delivered', handleDelivered);
    socket.on('user_typing', handlePartnerTyping);
    socket.on('user_stop_typing', handlePartnerStopTyping);
    socket.on('user_status_changed', handleUserStatusChanged);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('connect', handleSocketConnect);
      socket.off('new_message', handleNewMessage);
      socket.off('unread_update', handleUnreadUpdate);
      socket.off('message_reaction_updated', handleReaction);
      socket.off('message_edited', handleEdited);
      socket.off('message_deleted', handleDelete);
      socket.off('message_deleted_for_me', handleDeleteForMe);
      socket.off('messages_read', handleMessagesRead);
      socket.off('messages_delivered', handleDelivered);
      socket.off('user_typing', handlePartnerTyping);
      socket.off('user_stop_typing', handlePartnerStopTyping);
      socket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [socket, conversationId, user]);

  // Typing emitter
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { conversationId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId });
    }, 1800);
  };

  // Send text message (0ms Instant Optimistic UI)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = inputText.trim();
    if (!content) return;

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    if (socket && isTyping) {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId });
    }

    // Instantly append optimistic message for 0ms lag
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const optimisticMessage = {
      _id: tempId,
      conversationId,
      senderId: user,
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      deliveredTo: [],
      readBy: [],
      status: 'sending',
      replyTo: replyingTo
        ? {
            messageId: replyingTo._id,
            content: replyingTo.content,
            senderName: replyingTo.senderId?.displayName || 'User',
            messageType: replyingTo.messageType
          }
        : undefined
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom('smooth');

    try {
      const payload = {
        conversationId,
        content,
        messageType: 'text',
        replyTo: optimisticMessage.replyTo
      };

      const res = await chatService.sendMessage(payload);
      if (res.success && res.message) {
        setMessages((prev) => {
          const updated = prev.map((m) => (m._id === tempId ? res.message : m));
          chatCache.setChat(conversationId, updated, conversation);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  // Handle standard attachment upload (photo, video, document)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await chatService.uploadFile(file);

      if (res.success) {
        const payload = {
          conversationId,
          content: '',
          messageType: res.fileType || 'file',
          fileUrl: res.fileUrl,
          fileName: res.fileName,
          fileSize: res.fileSize,
          replyTo: replyingTo
            ? {
                messageId: replyingTo._id,
                content: replyingTo.content || 'Attachment',
                senderName: replyingTo.senderId?.displayName || 'User',
                messageType: replyingTo.messageType
              }
            : undefined
        };

        const sendRes = await chatService.sendMessage(payload);
        if (sendRes.success && sendRes.message) {
          setMessages((prev) => [...prev, sendRes.message]);
          scrollToBottom();
        }
      }
    } catch (err) {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // WhatsApp-style Edit Message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const res = await chatService.editMessage(messageId, newContent);
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  content: res.message.content,
                  isEdited: true,
                  editedAt: res.message.editedAt
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Error editing message:', err);
      alert(err.response?.data?.message || 'Failed to edit message.');
    }
  };

  // WhatsApp-style Delete Message ('everyone' or 'me')
  const handleDeleteMessage = async (messageId, type = 'everyone') => {
    try {
      const res = await chatService.deleteMessage(messageId, type);
      if (res.success) {
        if (type === 'me') {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId
                ? { ...m, isDeleted: true, content: 'This message was deleted', fileUrl: '' }
                : m
            )
          );
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  // React to message
  const handleReact = async (messageId, emoji) => {
    try {
      const res = await chatService.reactToMessage(messageId, emoji);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];
      setVoiceSeconds(0);

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          voiceChunksRef.current.push(e.data);
        }
      };

      voiceMediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecordingVoice(true);

      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Voice recording error:', err);
      alert('Microphone access denied or not available.');
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (voiceMediaRecorderRef.current && voiceMediaRecorderRef.current.state !== 'inactive') {
      voiceMediaRecorderRef.current.stop();
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
    setIsRecordingVoice(false);
    setVoiceSeconds(0);
    voiceChunksRef.current = [];
  };

  const sendVoiceRecording = async () => {
    if (!voiceMediaRecorderRef.current || !isRecordingVoice) return;
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);

    const duration = voiceSeconds;
    const recorder = voiceMediaRecorderRef.current;

    recorder.onstop = async () => {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(voiceChunksRef.current, { type: mime });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${mime.includes('mp4') ? 'm4a' : 'webm'}`, {
        type: mime
      });

      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((t) => t.stop());
        voiceStreamRef.current = null;
      }
      setIsRecordingVoice(false);
      setVoiceSeconds(0);

      try {
        setUploading(true);
        const res = await chatService.uploadFile(audioFile);
        if (res.success && res.fileUrl) {
          const payload = {
            conversationId,
            content: 'Voice note',
            messageType: 'audio',
            fileUrl: res.fileUrl,
            fileName: audioFile.name,
            fileSize: audioFile.size,
            duration: duration || 1,
            replyTo: replyingTo
              ? {
                  messageId: replyingTo._id,
                  content: replyingTo.content || 'Voice note',
                  senderName: replyingTo.senderId?.displayName || 'User',
                  messageType: replyingTo.messageType
                }
              : undefined
          };

          const sendRes = await chatService.sendMessage(payload);
          if (sendRes.success && sendRes.message) {
            setMessages((prev) => [...prev, sendRes.message]);
            scrollToBottom();
          }
        }
      } catch (err) {
        console.error('Error uploading voice note:', err);
        alert('Failed to send voice note.');
      } finally {
        setUploading(false);
        setReplyingTo(null);
      }
    };

    recorder.stop();
  };

  // Circular Video Note Sending Handler
  const handleSendVideoNote = async (videoBlob, duration) => {
    const videoFile = new File(
      [videoBlob],
      `video-note-${Date.now()}.${videoBlob.type.includes('mp4') ? 'mp4' : 'webm'}`,
      { type: videoBlob.type }
    );

    setUploading(true);
    try {
      const res = await chatService.uploadFile(videoFile);
      if (res.success && res.fileUrl) {
        const payload = {
          conversationId,
          content: 'Video note',
          messageType: 'video_note',
          fileUrl: res.fileUrl,
          fileName: videoFile.name,
          fileSize: videoFile.size,
          duration: duration || 1,
          replyTo: replyingTo
            ? {
                messageId: replyingTo._id,
                content: replyingTo.content || 'Video note',
                senderName: replyingTo.senderId?.displayName || 'User',
                messageType: replyingTo.messageType
              }
            : undefined
        };

        const sendRes = await chatService.sendMessage(payload);
        if (sendRes.success && sendRes.message) {
          setMessages((prev) => [...prev, sendRes.message]);
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Error sending video note:', err);
      alert('Failed to send video note.');
    } finally {
      setUploading(false);
      setReplyingTo(null);
    }
  };

  // Format seconds for recording timer
  const formatVoiceTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const partner = conversation?.recipient;
  // Authoritative real-time online check from SocketContext
  const isPartnerOnline = Boolean(
    partner && partner._id && onlineUsers.has(partner._id.toString())
  );

  return (
    <div
      className="fixed inset-x-0 flex flex-col bg-[#FAF7F7] text-stone-800 font-sans-clean overflow-hidden select-none"
      style={{
        top: `${viewportTop}px`,
        height: viewportHeight ? `${viewportHeight}px` : '100dvh'
      }}
    >
      {/* Sticky Romantic Header with Safe Area Inset Support */}
      <header className="bg-white/95 backdrop-blur-md border-b border-rose-100/80 pt-safe px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate('/private-chat')}
            className="p-1.5 -ml-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="relative shrink-0">
            <img
              src={partner?.avatar || romanticConfig.presetAvatars[0].url}
              alt={partner?.displayName || 'Partner'}
              className="w-10 h-10 rounded-full object-cover border border-rose-200"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors duration-300 ${
                isPartnerOnline ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
              title={isPartnerOnline ? 'Online' : 'Offline'}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900 text-sm truncate leading-snug">
              {partner?.displayName || 'My Love'}
            </h2>
            <p className="text-[11px] text-stone-400 truncate">
              {partnerTyping ? (
                <span className="text-rose-600 font-medium animate-pulse">typing a message...</span>
              ) : isPartnerOnline ? (
                <span className="text-emerald-600 font-medium">Online now</span>
              ) : (
                formatLastSeen(partner?.lastSeen)
              )}
            </p>
          </div>
        </div>

        {/* Audio & Video Calling Buttons + Disguise Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Audio Call Button */}
          <button
            onClick={() =>
              partner &&
              startCall({
                recipient: partner,
                conversationId,
                callType: 'audio'
              })
            }
            disabled={!isPartnerOnline}
            title={isPartnerOnline ? 'Start Audio Call' : 'Partner is currently offline'}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isPartnerOnline
                ? 'text-stone-700 hover:text-rose-600 hover:bg-rose-50 active:scale-95'
                : 'text-stone-300 cursor-not-allowed opacity-50'
            }`}
          >
            <Phone size={18} />
          </button>

          {/* Video Call Button */}
          <button
            onClick={() =>
              partner &&
              startCall({
                recipient: partner,
                conversationId,
                callType: 'video'
              })
            }
            disabled={!isPartnerOnline}
            title={isPartnerOnline ? 'Start Video Call' : 'Partner is currently offline'}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isPartnerOnline
                ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95'
                : 'text-stone-300 cursor-not-allowed opacity-50'
            }`}
          >
            <Video size={18} />
          </button>

          {/* Small Disguise / To-Do Switcher */}
          <button
            onClick={() => {
              sessionStorage.removeItem('zenith_sanctuary_unlocked');
              navigate('/');
            }}
            title="Switch to To-Do mode"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-1"
          >
            <Sparkles size={17} className="text-rose-400" />
          </button>
        </div>
      </header>

      {/* Romantic Quote Bar */}
      <div className="bg-rose-50/85 backdrop-blur-xs border-b border-rose-100/60 px-4 py-1 text-center shrink-0 z-20">
        <p className="text-[11px] font-serif-romantic italic text-rose-700 truncate">
          "{partner?.customQuote || romanticConfig.headerQuote}"
        </p>
      </div>

      {/* Main Chat Body (Holds animated romantic background + scrolling messages) */}
      <div className="flex-1 relative min-h-0 overflow-hidden flex flex-col">
        {/* Animated Romantic Memories Background (Fixed behind messages, vivid & vibrant) */}
        <RomanticChatBackground />

        {/* Message Stream Area */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10 min-h-0"
          onClick={() => {
            setShowEmojiPicker(false);
          }}
        >
          {/* Romantic Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto my-3 p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-rose-100 text-center shadow-xs overflow-hidden"
          >
            {/* Framed Couple Memory Photo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-2.5 rounded-2xl overflow-hidden shadow-md border-2 border-rose-200/90 group cursor-pointer">
              <img
                src="/memories/memory-couple-portrait.jpg"
                alt="Together"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <Heart size={11} className="fill-white" />
              </div>
            </div>

            <h3 className="font-serif-romantic font-bold text-base sm:text-lg text-stone-900">
              {romanticConfig.welcomeSection.greeting}
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed whitespace-pre-line font-serif-romantic">
              {romanticConfig.welcomeSection.message}
            </p>
            <span className="inline-block mt-2.5 text-[10px] font-semibold text-rose-600 uppercase tracking-widest">
              {romanticConfig.welcomeSection.signature}
            </span>
          </motion.div>

          {/* Messages List */}
          {messages.map((msg) => {
            const currentUserId = user?._id?.toString();
            const senderId = (msg.senderId?._id || msg.senderId)?.toString();
            const isMe = senderId === currentUserId;
            const isDelivered = msg.deliveredTo?.length > 0;
            const isRead = msg.readBy?.length > 0;
            const isDeleted = msg.isDeleted;

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0].clientX;
                  // Start long press timer (450ms)
                  longPressTimerRef.current = setTimeout(() => {
                    setActiveActionMessage(msg);
                  }, 450);
                }}
                onTouchMove={(e) => {
                  touchCurrentXRef.current = e.touches[0].clientX;
                  // Moving finger cancels long press
                  if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                }}
                onTouchEnd={() => {
                  if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  // Swipe right gesture to trigger reply on mobile
                  const diff = touchCurrentXRef.current - touchStartXRef.current;
                  if (diff > 65) {
                    setReplyingTo(msg);
                  }
                }}
              >
                <div className="flex items-center gap-1.5 max-w-[88%] sm:max-w-[75%]">
                  {/* Bubble Container */}
                  <div
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveActionMessage(msg);
                    }}
                    className={`rounded-2xl p-3 shadow-xs relative transition-all ${
                      isDeleted
                        ? 'bg-stone-100/95 backdrop-blur-xs text-stone-400 italic text-xs border border-stone-200'
                        : isMe
                        ? 'bg-rose-500 text-white rounded-br-xs shadow-md shadow-rose-500/15'
                        : 'bg-white text-stone-800 rounded-bl-xs border border-rose-100 shadow-sm'
                    }`}
                  >
                    {/* Reply Reference Preview */}
                    {msg.replyTo && msg.replyTo.content && (
                      <div
                        className={`mb-2 p-1.5 rounded-lg text-[11px] border-l-2 ${
                          isMe
                            ? 'bg-rose-600/70 border-white text-rose-50'
                            : 'bg-rose-50 border-rose-400 text-stone-600'
                        }`}
                      >
                        <span className="font-semibold block truncate">
                          {msg.replyTo.senderName}
                        </span>
                        <span className="truncate block opacity-85">
                          {msg.replyTo.content}
                        </span>
                      </div>
                    )}

                    {/* Image Content */}
                    {msg.messageType === 'image' && msg.fileUrl && !isDeleted && (
                      <div className="mb-2 rounded-xl overflow-hidden max-h-72 bg-stone-100">
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Attached image'}
                            className="w-full h-auto object-cover hover:opacity-95 transition-opacity"
                          />
                        </a>
                      </div>
                    )}

                    {/* Voice Note Audio Content */}
                    {msg.messageType === 'audio' && msg.fileUrl && !isDeleted && (
                      <VoiceNotePlayer
                        fileUrl={msg.fileUrl}
                        duration={msg.duration}
                        isMe={isMe}
                      />
                    )}

                    {/* Circular Video Note Content */}
                    {msg.messageType === 'video_note' && msg.fileUrl && !isDeleted && (
                      <VideoNotePlayer
                        fileUrl={msg.fileUrl}
                        isMe={isMe}
                      />
                    )}

                    {/* Regular File Attachment Content */}
                    {msg.messageType === 'file' && msg.fileUrl && !isDeleted && (
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs mb-1 transition-all ${
                          isMe ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        <FileText size={18} className="shrink-0" />
                        <div className="min-w-0 flex-1 truncate">
                          <p className="font-medium truncate">{msg.fileName}</p>
                          <p className="text-[10px] opacity-75">
                            {(msg.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download size={15} className="shrink-0 opacity-80" />
                      </a>
                    )}

                    {/* Text Message Content */}
                    {msg.content && msg.messageType !== 'audio' && msg.messageType !== 'video_note' && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text">
                        {msg.content}
                      </p>
                    )}

                    {/* Message Timestamp, (edited) indicator, and Delivery Status */}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMe ? 'text-rose-100' : 'text-stone-400'
                      }`}
                    >
                      {msg.isEdited && !isDeleted && (
                        <span className="text-[9px] italic opacity-85 mr-0.5">(edited)</span>
                      )}
                      <span>{formatMessageTime(msg.createdAt)}</span>

                      {/* Delivery & Read Receipts Status for sender's messages */}
                      {isMe && !isDeleted && (
                        <span className="flex items-center ml-0.5">
                          {msg.status === 'sending' ? (
                            <Clock size={12} className="text-rose-200 animate-pulse" title="Sending..." />
                          ) : msg.status === 'failed' ? (
                            <span className="text-[9px] text-red-200 font-medium">Failed</span>
                          ) : isRead ? (
                            <CheckCheck size={14} className="text-sky-300 stroke-[2.5]" title="Seen" />
                          ) : isDelivered ? (
                            <CheckCheck size={14} className="text-rose-200 stroke-[2]" title="Delivered" />
                          ) : (
                            <Check size={14} className="text-rose-200" title="Sent" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Attached Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2.5 left-2 flex items-center gap-1 bg-white border border-rose-100 rounded-full px-1.5 py-0.5 shadow-2xs">
                        {msg.reactions.map((r, i) => (
                          <span key={i} className="text-xs" title={r.userName}>
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desktop Quick Action 3-dots Button */}
                  {!isDeleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionMessage(msg);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 hover:bg-white/80 rounded-full transition-opacity cursor-pointer shrink-0"
                      title="Message options"
                    >
                      <MoreVertical size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Area: Reply preview + Input Bar */}
      <div
        className={`bg-white/95 backdrop-blur-md border-t border-rose-100/90 shrink-0 z-30 transition-all duration-150 ${
          isKeyboardOpen ? 'pb-1.5' : 'pb-safe'
        }`}
      >
        {/* Reply Bar Preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden text-xs">
                <Reply size={14} className="text-rose-500 shrink-0" />
                <span className="font-semibold text-rose-700 truncate">
                  Replying to {replyingTo.senderId?.displayName || 'User'}:
                </span>
                <span className="text-stone-600 truncate">{replyingTo.content || 'Photo/File'}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Tray Popover */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-stone-50 border-b border-rose-100 flex flex-wrap gap-2 justify-center max-h-36 overflow-y-auto"
            >
              {[
                '❤️', '💖', '💕', '🥰', '😘', '🌹', '✨', '🥺', '🫂', '💌', '🌸', '🕊️',
                '💐', '💍', '🧸', '🍓', '☕', '🌙', '🌟', '😍', '💋', '🍯', '🍫', '🕯️'
              ].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-xl p-1.5 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Input Controls & Voice Note Live Tray */}
        <div className="p-2.5 sm:p-3">
          {isRecordingVoice ? (
            /* Live Voice Note Recording Tray (WhatsApp Style) */
            <div className="flex items-center gap-3 py-1 px-2 bg-rose-50/90 rounded-2xl border border-rose-200 animate-pulse">
              {/* Blinking red recording dot */}
              <div className="flex items-center gap-2 text-rose-600 font-mono text-xs font-bold shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>{formatVoiceTime(voiceSeconds)}</span>
              </div>

              {/* Animated wave bars */}
              <div className="flex-1 flex items-center justify-center gap-1 h-6">
                {[12, 24, 18, 30, 16, 28, 20, 26, 14, 22].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${(h / 30) * 100}%` }}
                    className="w-[3px] bg-rose-400 rounded-full animate-bounce"
                  />
                ))}
              </div>

              {/* Cancel (Trash) button */}
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2 text-stone-500 hover:text-red-500 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Discard voice note"
              >
                <Trash2 size={17} />
              </button>

              {/* Send Voice Note button */}
              <button
                type="button"
                onClick={sendVoiceRecording}
                disabled={uploading}
                className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                title="Send voice note"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          ) : (
            /* Standard Input Bar */
            <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
              {/* File Upload Hidden Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,application/pdf,application/msword,text/*"
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach photo or document"
                className="p-2 text-stone-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip size={19} />
                )}
              </button>

              {/* Circular Video Note Trigger Button */}
              <button
                type="button"
                onClick={() => setIsVideoNoteOpen(true)}
                title="Record circular video note"
                className="p-2 text-stone-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                <Video size={19} />
              </button>

              {/* Emoji Tray Toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Romantic emojis"
                className="p-2 text-stone-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                <Smile size={19} />
              </button>

              {/* Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onFocus={() => {
                  setTimeout(() => {
                    if (window.visualViewport) {
                      setViewportHeight(window.visualViewport.height);
                      setViewportTop(window.visualViewport.offsetTop);
                      setIsKeyboardOpen(window.innerHeight - window.visualViewport.height > 100);
                    }
                    window.scrollTo(0, 0);
                    scrollToBottom('smooth');
                  }, 120);
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    scrollToBottom('smooth');
                  }, 350);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (window.visualViewport) {
                      setViewportHeight(window.visualViewport.height);
                      setViewportTop(window.visualViewport.offsetTop);
                      setIsKeyboardOpen(window.innerHeight - window.visualViewport.height > 100);
                    }
                    window.scrollTo(0, 0);
                  }, 100);
                }}
                placeholder="Send something sweet..."
                className="flex-1 py-2 px-3.5 rounded-2xl bg-stone-100/90 focus:bg-white border border-transparent focus:border-rose-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none transition-all"
              />

              {/* Toggle Send button OR Mic button (like WhatsApp) */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-30 disabled:hover:bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  aria-label="Record voice note"
                  title="Tap to record voice note"
                  className="w-10 h-10 rounded-2xl bg-rose-500/90 hover:bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Mic size={18} />
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Circular Video Note Recorder Modal */}
      <VideoNoteRecorderModal
        isOpen={isVideoNoteOpen}
        onClose={() => setIsVideoNoteOpen(false)}
        onSendVideoNote={handleSendVideoNote}
      />

      {/* WhatsApp-Style Message Action Modal (Reply, Edit, Delete for everyone/me, Copy, Reactions) */}
      <MessageActionModal
        message={activeActionMessage}
        isMe={
          (activeActionMessage?.senderId?._id || activeActionMessage?.senderId)?.toString() ===
          user?._id?.toString()
        }
        onClose={() => setActiveActionMessage(null)}
        onReply={(msg) => setReplyingTo(msg)}
        onReact={(msgId, emoji) => handleReact(msgId, emoji)}
        onEdit={(msgId, newContent) => handleEditMessage(msgId, newContent)}
        onDelete={(msgId, type) => handleDeleteMessage(msgId, type)}
      />
    </div>
  );
};
