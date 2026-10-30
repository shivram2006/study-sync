import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Heart,
  Plus,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navbar } from '../components/common/Navbar';
import { RelationshipCounter } from '../components/romantic/RelationshipCounter';
import { romanticConfig } from '../utils/romanticConfig';
import { formatLastSeen, formatMessageTime } from '../utils/dateUtils';

export const PrivateChatDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time socket updates for unread counts and new conversations
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    const handleAccepted = () => {
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('friend_request_accepted', handleAccepted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('friend_request_accepted', handleAccepted);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col font-sans-clean antialiased pb-20 sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 sm:py-7">
        {/* Live Relationship Counter Banner */}
        <RelationshipCounter
          startDate={user?.relationshipStartDate || romanticConfig.relationshipStartDate}
          customQuote={user?.customQuote || romanticConfig.headerQuote}
        />

        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
              Private Conversations
            </h1>
            <p className="text-xs text-stone-500">
              Only verified and accepted friends can exchange private messages.
            </p>
          </div>

          <button
            onClick={() => navigate('/discover')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Discover Partner</span>
          </button>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-20 bg-white/70 rounded-2xl animate-pulse border border-rose-50"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-6 bg-white/80 rounded-3xl border border-rose-100 shadow-xs"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <Heart size={26} className="fill-rose-400 text-rose-500" />
            </div>
            <h3 className="text-lg font-serif-romantic font-semibold text-stone-900 mb-1">
              No Private Chats Yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Find your partner or special person using the User Discovery directory, send a request,
              and start sharing romantic messages once accepted!
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Users size={15} />
              <span>Discover & Connect Now</span>
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {conversations.map((conv) => {
              const partner = conv.recipient;
              const isPartnerOnline = partner && (onlineUsers.has(partner._id) || partner.isOnline);
              const lastMsg = conv.lastMessage;

              return (
                <motion.div
                  key={conv._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/chat/${conv._id}`)}
                  className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/90 hover:bg-white border border-rose-100/90 shadow-2xs hover:shadow-md hover:border-rose-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Partner Avatar with Online Indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={partner?.avatar || romanticConfig.presetAvatars[0].url}
                        alt={partner?.displayName || 'Partner'}
                        className="w-12 h-12 rounded-full object-cover border border-rose-100"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isPartnerOnline ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                        title={isPartnerOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-stone-900 text-sm truncate">
                          {partner?.displayName || 'My Love'}
                        </h4>
                        <span className="text-[11px] text-stone-400">@{partner?.username}</span>
                      </div>

                      <p className="text-xs text-stone-500 truncate mt-0.5 max-w-[220px] sm:max-w-md">
                        {lastMsg ? (
                          lastMsg.isDeleted ? (
                            <span className="italic text-stone-400">Message deleted</span>
                          ) : lastMsg.messageType === 'image' ? (
                            <span className="text-rose-500 font-medium">📷 Photo</span>
                          ) : lastMsg.messageType === 'file' ? (
                            <span className="text-stone-600 font-medium">📎 Attachment</span>
                          ) : (
                            lastMsg.content
                          )
                        ) : (
                          <span className="italic text-rose-500">
                            Say something sweet to start the conversation ❤️
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    <span className="text-[11px] text-stone-400">
                      {lastMsg ? formatMessageTime(lastMsg.createdAt) : ''}
                    </span>

                    {conv.unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs animate-pulse">
                        {conv.unreadCount} new
                      </span>
                    ) : (
                      <ArrowRight
                        size={15}
                        className="text-stone-300 group-hover:text-rose-500 transition-colors"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
