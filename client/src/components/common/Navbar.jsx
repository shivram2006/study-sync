import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Users,
  UserPlus,
  User,
  CheckSquare,
  LogOut,
  Heart,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { friendService } from '../../services/friendService';
import { useSocket } from '../../context/SocketContext';
import {
  playMessageTone,
  sendDisguisedNotification,
  requestNotificationPermission
} from '../../utils/notificationSound';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const res = await friendService.getRequests();
      if (res.success && res.incoming) {
        setPendingRequestsCount(res.incoming.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [location.pathname]);

  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = () => {
      setPendingRequestsCount((prev) => prev + 1);
    };
    socket.on('friend_request_received', handleNewRequest);
    return () => {
      socket.off('friend_request_received', handleNewRequest);
    };
  }, [socket]);

  const navItems = [
    {
      to: '/private-chat',
      label: 'Chats',
      icon: MessageCircle
    },
    {
      to: '/discover',
      label: 'Discover',
      icon: Users
    },
    {
      to: '/requests',
      label: 'Friends',
      icon: UserPlus,
      badge: pendingRequestsCount
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User
    }
  ];

  const handleLogout = async () => {
    sessionStorage.removeItem('zenith_sanctuary_unlocked');
    await logout();
    navigate('/');
  };

  const handleSwitchToTodo = () => {
    sessionStorage.removeItem('zenith_sanctuary_unlocked');
    navigate('/');
  };

  const handleTestNotification = async () => {
    await requestNotificationPermission();
    playMessageTone();
    await sendDisguisedNotification();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100/70 pt-safe">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/private-chat" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
            <Heart size={16} className="fill-rose-500" />
          </div>
          <span className="font-serif-romantic text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Our Sanctuary
          </span>
        </Link>

        {/* Center / Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {Boolean(item.badge) && item.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions: Test Tone, Disguise Switcher to To-Do & Logout */}
        <div className="flex items-center gap-2">
          {/* Test Chime and Disguised Notification */}
          <button
            onClick={handleTestNotification}
            title="Test Message Tone & Disguised Notification"
            className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Bell size={16} />
          </button>

          {/* Quick disguise button to lock and go back to To-Do list */}
          <button
            onClick={handleSwitchToTodo}
            title="Disguise as To-Do List"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-all cursor-pointer shadow-2xs"
          >
            <CheckSquare size={14} className="text-stone-500" />
            <span className="hidden xs:inline">To-Do Mode</span>
          </button>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for responsive mobile-first experience) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100/70 pb-safe shadow-lg">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                <div className="relative">
                  <Icon size={19} />
                  {Boolean(item.badge) && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
