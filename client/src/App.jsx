import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TodoPage } from './pages/TodoPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivateChatDashboard } from './pages/PrivateChatDashboard';
import { DiscoverPage } from './pages/DiscoverPage';
import { RequestsPage } from './pages/RequestsPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { ProfilePage } from './pages/ProfilePage';

// Protected Route Guard
// Ensures:
// 1. Session is unlocked via secret code 2006 in this browser session. If not, redirect to To-Do homepage (/)
// 2. User has a valid authenticated JWT session. If not, redirect to /login
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const isSanctuaryUnlocked = sessionStorage.getItem('zenith_sanctuary_unlocked') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If the secret code 2006 hasn't been entered in this session, show the To-Do disguise
  if (!isSanctuaryUnlocked) {
    return <Navigate to="/" replace />;
  }

  // If unlocked but not logged in, show login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (Login & Register)
// Only accessible if secret code 2006 was entered; if already logged in, skip straight to private chat
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const isSanctuaryUnlocked = sessionStorage.getItem('zenith_sanctuary_unlocked') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If secret code hasn't been entered, disguise as To-Do list
  if (!isSanctuaryUnlocked) {
    return <Navigate to="/" replace />;
  }

  // If already logged in, bypass login screen directly to private chat
  if (isAuthenticated) {
    return <Navigate to="/private-chat" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* The Disguised To-Do Homepage - Always the default landing */}
            <Route path="/" element={<TodoPage />} />

            {/* Authentication (Only accessible via Code 2006) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Romantic Protected Sanctuary Routes (Requires Code 2006 + Login) */}
            <Route
              path="/private-chat"
              element={
                <ProtectedRoute>
                  <PrivateChatDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <DiscoverPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <RequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:conversationId"
              element={
                <ProtectedRoute>
                  <ChatRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback directly to disguised To-Do homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
