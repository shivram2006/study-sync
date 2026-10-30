import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  playMessageTone,
  sendDisguisedNotification,
  initAudioContext,
  requestNotificationPermission,
  subscribeUserToPush
} from '../utils/notificationSound';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const notifiedMessageIdsRef = useRef(new Set());

  // Unlock audio on first user touch/click on the document
  useEffect(() => {
    const unlockAudio = () => {
      initAudioContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Sync Web Push subscription for closed/locked background notifications
  useEffect(() => {
    if (isAuthenticated && token) {
      subscribeUserToPush(token).catch((err) => {
        console.warn('Background Web Push registration notice:', err);
      });
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected as user:', user?.username);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('user_status_changed', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Helper to trigger disguised notification and tone for incoming messages
    const handleIncomingMessageNotification = (msg) => {
      if (!msg || !msg._id) return;
      const currentUserId = user?._id?.toString();
      const senderId = (msg.senderId?._id || msg.senderId)?.toString();

      // If message is from partner and not already notified
      if (senderId && senderId !== currentUserId) {
        if (!notifiedMessageIdsRef.current.has(msg._id)) {
          notifiedMessageIdsRef.current.add(msg._id);

          // Play message tone
          playMessageTone();

          // Send disguised notification: "New task added"
          sendDisguisedNotification();

          // Keep set memory bounded
          if (notifiedMessageIdsRef.current.size > 200) {
            const first = notifiedMessageIdsRef.current.values().next().value;
            notifiedMessageIdsRef.current.delete(first);
          }
        }
      }
    };

    // Global listener for new messages & unread updates
    newSocket.on('new_message', ({ message }) => {
      handleIncomingMessageNotification(message);
    });

    newSocket.on('unread_update', ({ message }) => {
      handleIncomingMessageNotification(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        requestNotificationPermission,
        subscribeUserToPush
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return (
    context || {
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      requestNotificationPermission: () => {},
      subscribeUserToPush: () => Promise.resolve(null)
    }
  );
};
