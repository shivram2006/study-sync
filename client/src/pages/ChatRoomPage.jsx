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
  Sparkles
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { romanticConfig } from '../utils/romanticConfig';
import { formatLastSeen, formatMessageTime } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

export const ChatRoomPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [selectedMessageMenuId, setSelectedMessageMenuId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversation details & messages
  const loadChatData = async () => {
    try {
      setLoading(true);
      const [convRes, msgRes] = await Promise.all([
        chatService.getConversationById(conversationId),
        chatService.getMessages(conversationId)
      ]);

      if (convRes.success) {
        setConversation(convRes.conversation);
      }
      if (msgRes.success) {
        setMessages(msgRes.messages);
      }
    } catch (err) {
      console.error('Error loading chat room:', err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom('auto'), 150);
    }
  };

  useEffect(() => {
    loadChatData();
  }, [conversationId]);

  // Mark messages as read on view
  useEffect(() => {
    if (!conversationId) return;
    chatService.markAsRead(conversationId).catch(() => {});
    if (socket) {
      socket.emit('mark_seen', { conversationId });
    }
  }, [conversationId, socket]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    const handleNewMessage = ({ message }) => {
      if (message.conversationId.toString() === conversationId.toString()) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        // Mark as seen immediately if active
        socket.emit('mark_seen', { conversationId });
      }
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
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

    const handleMessagesRead = ({ readerId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.senderId._id === user._id && !m.readBy.includes(readerId)) {
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
          if (m.senderId._id === user._id && !m.deliveredTo.includes(userId)) {
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

    socket.on('new_message', handleNewMessage);
    socket.on('message_reaction_updated', handleReaction);
    socket.on('message_deleted', handleDelete);
    socket.on('messages_read', handleMessagesRead);
    socket.on('messages_delivered', handleDelivered);
    socket.on('user_typing', handlePartnerTyping);
    socket.on('user_stop_typing', handlePartnerStopTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message', handleNewMessage);
      socket.off('message_reaction_updated', handleReaction);
      socket.off('message_deleted', handleDelete);
      socket.off('messages_read', handleMessagesRead);
      socket.off('messages_delivered', handleDelivered);
      socket.off('user_typing', handlePartnerTyping);
      socket.off('user_stop_typing', handlePartnerStopTyping);
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

  // Send message
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

    try {
      const payload = {
        conversationId,
        content,
        messageType: 'text',
        replyTo: replyingTo
          ? {
              messageId: replyingTo._id,
              content: replyingTo.content,
              senderName: replyingTo.senderId?.displayName || 'User',
              messageType: replyingTo.messageType
            }
          : undefined
      };

      const res = await chatService.sendMessage(payload);
      if (res.success && res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds the 25MB limit.');
      return;
    }

    try {
      setUploading(true);
      const uploadRes = await chatService.uploadFile(file);
      if (uploadRes.success) {
        const payload = {
          conversationId,
          content: '',
          messageType: uploadRes.fileType,
          fileUrl: uploadRes.fileUrl,
          fileName: uploadRes.fileName,
          fileSize: uploadRes.fileSize,
          replyTo: replyingTo
            ? {
                messageId: replyingTo._id,
                content: replyingTo.content || 'Attachment',
                senderName: replyingTo.senderId?.displayName || 'User',
                messageType: replyingTo.messageType
              }
            : undefined
        };

        const res = await chatService.sendMessage(payload);
        if (res.success && res.message) {
          setMessages((prev) => [...prev, res.message]);
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

  // React to message
  const handleReact = async (messageId, emoji) => {
    setSelectedMessageMenuId(null);
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

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    setSelectedMessageMenuId(null);
    try {
      const res = await chatService.deleteMessage(messageId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted', fileUrl: '' }
              : m
          )
        );
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const partner = conversation?.recipient;
  const isPartnerOnline = partner && (onlineUsers.has(partner._id) || partner.isOnline);

  return (
    <div className="h-screen-dvh flex flex-col bg-[#FAF7F7] text-stone-800 font-sans-clean overflow-hidden select-none">
      {/* Sticky Romantic Header with Safe Area Inset Support */}
      <header className="bg-white/90 backdrop-blur-md border-b border-rose-100/80 pt-safe px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 shadow-xs z-30">
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
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isPartnerOnline ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
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

        {/* Small Disguise / To-Do Switcher */}
        <button
          onClick={() => {
            sessionStorage.removeItem('zenith_sanctuary_unlocked');
            navigate('/');
          }}
          title="Switch to To-Do mode"
          className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <Sparkles size={17} className="text-rose-400" />
        </button>
      </header>

      {/* Romantic Quote Bar */}
      <div className="bg-rose-50/70 border-b border-rose-100/60 px-4 py-1 text-center shrink-0">
        <p className="text-[11px] font-serif-romantic italic text-rose-700 truncate">
          "{partner?.customQuote || romanticConfig.headerQuote}"
        </p>
      </div>

      {/* Message Stream Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage: romanticConfig.backgrounds.chatWallpaper
        }}
        onClick={() => {
          setSelectedMessageMenuId(null);
          setShowEmojiPicker(false);
        }}
      >
        {/* Romantic Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto my-4 p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-rose-100 text-center shadow-xs"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2 border border-rose-100">
            <Heart size={22} className="fill-rose-500" />
          </div>
          <h3 className="font-serif-romantic font-bold text-base text-stone-900">
            {romanticConfig.welcomeSection.greeting}
          </h3>
          <p className="text-xs text-stone-600 mt-2 leading-relaxed whitespace-pre-line font-serif-romantic">
            {romanticConfig.welcomeSection.message}
          </p>
          <span className="inline-block mt-3 text-[11px] font-semibold text-rose-600 uppercase tracking-widest">
            {romanticConfig.welcomeSection.signature}
          </span>
        </motion.div>

        {/* Messages List */}
        {messages.map((msg) => {
          const isMe = msg.senderId?._id === user._id || msg.senderId === user._id;
          const isDelivered = msg.deliveredTo?.length > 0;
          const isRead = msg.readBy?.length > 0;
          const isDeleted = msg.isDeleted;
          const isMenuOpen = selectedMessageMenuId === msg._id;

          return (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group`}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchMove={(e) => {
                touchCurrentXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={() => {
                // Swipe right gesture to trigger reply on mobile
                const diff = touchCurrentXRef.current - touchStartXRef.current;
                if (diff > 65) {
                  setReplyingTo(msg);
                }
              }}
            >
              <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%]">
                {/* Bubble Container */}
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedMessageMenuId(isMenuOpen ? null : msg._id);
                  }}
                  className={`rounded-2xl p-3 shadow-2xs relative transition-all ${
                    isDeleted
                      ? 'bg-stone-100 text-stone-400 italic text-xs border border-stone-200'
                      : isMe
                      ? 'bg-rose-500 text-white rounded-br-xs'
                      : 'bg-white text-stone-800 rounded-bl-xs border border-rose-100'
                  }`}
                >
                  {/* Reply Reference Preview */}
                  {msg.replyTo && msg.replyTo.content && (
                    <div
                      className={`mb-2 p-1.5 rounded-lg text-[11px] border-l-2 ${
                        isMe
                          ? 'bg-rose-600/60 border-white text-rose-50'
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

                  {/* File Attachment Content */}
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
                  {msg.content && (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text">
                      {msg.content}
                    </p>
                  )}

                  {/* Message Timestamp and Delivery Status */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-rose-100' : 'text-stone-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>

                    {/* Delivery & Read Receipts Status for sender's messages */}
                    {isMe && !isDeleted && (
                      <span className="flex items-center ml-0.5">
                        {isRead ? (
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

                {/* Quick Action Button on Hover */}
                {!isDeleted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessageMenuId(isMenuOpen ? null : msg._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 transition-opacity cursor-pointer"
                  >
                    <Smile size={14} />
                  </button>
                )}
              </div>

              {/* Message Context / Action Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute z-30 top-full mt-1 bg-white rounded-2xl shadow-xl border border-rose-100 p-2 text-xs flex flex-col gap-1.5 ${
                      isMe ? 'right-0' : 'left-0'
                    }`}
                  >
                    {/* Emoji Reaction Bar */}
                    <div className="flex items-center gap-1.5 pb-1.5 border-b border-stone-100">
                      {romanticConfig.reactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg._id, emoji)}
                          className="hover:scale-125 transition-transform text-base p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          setSelectedMessageMenuId(null);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-50 text-stone-700 cursor-pointer"
                      >
                        <Reply size={13} />
                        <span>Reply</span>
                      </button>

                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator & Reply Banner Area */}
      <div className="bg-white/95 border-t border-rose-100 shrink-0">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Reply size={14} className="text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-rose-700 block truncate">
                    Replying to {replyingTo.senderId?.displayName || 'User'}
                  </span>
                  <span className="text-stone-500 text-[11px] truncate block">
                    {replyingTo.content || 'Attachment'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Selector Tray */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-white border-b border-rose-100 flex items-center gap-2 overflow-x-auto no-scrollbar"
            >
              {['❤️', '💖', '🥰', '😘', '🌸', '✨', '🥺', '🌹', '🕊️', '💌', '🧸', '🍓'].map(
                (emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                    }}
                    className="text-xl p-1.5 hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Message Composer with Safe Area Inset Support */}
        <div className="p-3 pb-safe max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
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
              placeholder="Send something sweet..."
              className="flex-1 py-2 px-3.5 rounded-2xl bg-stone-100/90 focus:bg-white border border-transparent focus:border-rose-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-30 disabled:hover:bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
