import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';
import { friendService } from '../services/friendService';
import { Navbar } from '../components/common/Navbar';
import { useSocket } from '../context/SocketContext';
import { romanticConfig } from '../utils/romanticConfig';
import { formatLastSeen } from '../utils/dateUtils';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [messageNotice, setMessageNotice] = useState('');

  const fetchUsers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await friendService.discoverUsers(searchQuery);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Discover users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleSendRequest = async (receiverId) => {
    setActionLoadingId(receiverId);
    setMessageNotice('');
    try {
      const res = await friendService.sendRequest(receiverId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === receiverId ? { ...u, relationshipStatus: 'sent' } : u
          )
        );
        setMessageNotice('Romantic friend request sent! Waiting for their acceptance.');
      }
    } catch (err) {
      setMessageNotice(err.response?.data?.message || 'Could not send request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col font-sans-clean antialiased pb-20 sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
            Discover Our People
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Search for your partner by username to establish our private, encrypted connection.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or display name..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-white border border-rose-100/90 text-stone-800 placeholder-stone-400 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 cursor-pointer transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {messageNotice && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Sparkles size={14} className="shrink-0" />
            <span>{messageNotice}</span>
          </div>
        )}

        {/* User Discovery Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 bg-white/70 rounded-2xl animate-pulse border border-rose-50"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-rose-200">
            <p className="text-stone-500 text-sm">No registered users matched your search.</p>
            <p className="text-stone-400 text-xs mt-1">
              Ask your partner to register with a username so you can connect here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {users.map((item) => {
              const isOnline = onlineUsers.has(item._id) || item.isOnline;
              const isLoading = actionLoadingId === item._id;

              return (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white border border-rose-100/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={item.avatar || romanticConfig.presetAvatars[0].url}
                        alt={item.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-rose-100"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-stone-900 text-sm truncate">
                        {item.displayName}
                      </h3>
                      <p className="text-xs text-stone-400 truncate">@{item.username}</p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        {isOnline ? (
                          <span className="text-emerald-600 font-medium">Online now</span>
                        ) : (
                          formatLastSeen(item.lastSeen)
                        )}
                      </p>
                    </div>
                  </div>

                  {item.bio && (
                    <p className="text-xs text-stone-500 mt-2.5 line-clamp-1 italic font-serif-romantic">
                      "{item.bio}"
                    </p>
                  )}

                  {/* Actions depending on relationship status */}
                  <div className="mt-3.5 pt-3 border-t border-rose-50 flex items-center justify-end">
                    {item.relationshipStatus === 'friends' ? (
                      <button
                        onClick={() => navigate(`/chat/${item.conversationId}`)}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageCircle size={14} />
                        <span>Open Private Chat</span>
                      </button>
                    ) : item.relationshipStatus === 'sent' ? (
                      <div className="w-full py-1.5 px-3 rounded-xl bg-stone-100 text-stone-500 text-xs font-medium flex items-center justify-center gap-1.5">
                        <Clock size={13} />
                        <span>Request Pending</span>
                      </div>
                    ) : item.relationshipStatus === 'received' ? (
                      <button
                        onClick={() => navigate('/requests')}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Respond to Request</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(item._id)}
                        disabled={isLoading}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Send Friend Request</span>
                          </>
                        )}
                      </button>
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
