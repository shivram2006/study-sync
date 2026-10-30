import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Clock,
  MessageCircle,
  Heart,
  Trash2,
  Sparkles,
  Inbox
} from 'lucide-react';
import { friendService } from '../services/friendService';
import { Navbar } from '../components/common/Navbar';
import { romanticConfig } from '../utils/romanticConfig';
import { formatLastSeen } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

export const RequestsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('incoming'); // incoming | outgoing | friends
  const [data, setData] = useState({ incoming: [], outgoing: [], friends: [] });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await friendService.getRequests();
      if (res.success) {
        setData({
          incoming: res.incoming || [],
          outgoing: res.outgoing || [],
          friends: res.friends || []
        });
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (requestId, action) => {
    setActionId(requestId);
    try {
      const res = await friendService.respondToRequest(requestId, action);
      if (res.success) {
        if (action === 'accept') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#fb7185', '#fda4af']
          });
        }
        await fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (requestId) => {
    setActionId(requestId);
    try {
      const res = await friendService.cancelRequest(requestId);
      if (res.success) {
        await fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling request');
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await friendService.removeFriend(friendId);
      await fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing friend');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col font-sans-clean antialiased pb-20 sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
            Friendships & Requests
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Accepting a request activates a private, encrypted chat room between you two.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-2xl mb-6 max-w-sm">
          {[
            { id: 'incoming', label: `Incoming (${data.incoming.length})` },
            { id: 'outgoing', label: `Sent (${data.outgoing.length})` },
            { id: 'friends', label: `Accepted (${data.friends.length})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 bg-white/70 rounded-2xl animate-pulse border border-rose-50" />
            ))}
          </div>
        ) : tab === 'incoming' ? (
          data.incoming.length === 0 ? (
            <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-rose-200">
              <Inbox size={28} className="text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">No incoming friend requests.</p>
              <p className="text-stone-400 text-xs mt-1">
                When someone sends you a connection request, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.incoming.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-2xl bg-white border border-rose-100/90 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={req.senderId?.avatar || romanticConfig.presetAvatars[0].url}
                      alt={req.senderId?.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-rose-100"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-stone-900 text-sm truncate">
                        {req.senderId?.displayName}
                      </h4>
                      <p className="text-xs text-stone-400">@{req.senderId?.username}</p>
                      {req.senderId?.bio && (
                        <p className="text-xs text-stone-500 italic mt-0.5 line-clamp-1">
                          "{req.senderId.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRespond(req._id, 'accept')}
                      disabled={actionId === req._id}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <UserCheck size={14} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleRespond(req._id, 'reject')}
                      disabled={actionId === req._id}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium cursor-pointer transition-all"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'outgoing' ? (
          data.outgoing.length === 0 ? (
            <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-rose-200">
              <Clock size={28} className="text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">No outgoing pending requests.</p>
              <p className="text-stone-400 text-xs mt-1">
                You haven't sent any requests that are currently pending.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.outgoing.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-2xl bg-white border border-rose-100/90 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={req.receiverId?.avatar || romanticConfig.presetAvatars[0].url}
                      alt={req.receiverId?.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-rose-100"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-stone-900 text-sm truncate">
                        {req.receiverId?.displayName}
                      </h4>
                      <p className="text-xs text-stone-400">@{req.receiverId?.username}</p>
                      <span className="inline-block mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                        Awaiting acceptance
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancel(req._id)}
                    disabled={actionId === req._id}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )
        ) : data.friends.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-rose-200">
            <Heart size={28} className="text-rose-300 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No connected friends yet.</p>
            <p className="text-stone-400 text-xs mt-1">
              Once you or your partner accept a request, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.friends.map((friend) => (
              <div
                key={friend._id}
                className="p-4 rounded-2xl bg-white border border-rose-100/90 shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={friend.avatar || romanticConfig.presetAvatars[0].url}
                      alt={friend.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-rose-100"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-stone-900 text-sm truncate">
                      {friend.displayName}
                    </h4>
                    <p className="text-xs text-stone-400">@{friend.username}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {friend.isOnline ? (
                        <span className="text-emerald-600 font-medium">Online now</span>
                      ) : (
                        formatLastSeen(friend.lastSeen)
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {friend.conversationId && (
                    <button
                      onClick={() => navigate(`/chat/${friend.conversationId}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveFriend(friend._id)}
                    title="Remove Friend"
                    className="p-2 rounded-xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
