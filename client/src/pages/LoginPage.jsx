import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Lock, User, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeUserToPush } from '../utils/notificationSound';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      if (res.success) {
        sessionStorage.setItem('zenith_sanctuary_unlocked', 'true');
        subscribeUserToPush(res.token).catch(() => {});
        navigate('/private-chat');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col justify-center px-4 py-12 relative overflow-hidden font-sans-clean">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Return to Todo button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 bg-white/70 px-3 py-1.5 rounded-full border border-stone-200 shadow-2xs backdrop-blur-sm"
        >
          <ArrowLeft size={14} />
          <span>Back to Zenith Tasks</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-950/5 border border-rose-100/80"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100 shadow-xs">
              <Heart size={24} className="fill-rose-500 text-rose-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
              Welcome Back, My Love
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Enter your secret credentials to enter our private world.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Username / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sweetheart"
                  autoCapitalize="none"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-sm shadow-md shadow-rose-500/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Enter Private Sanctuary</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
