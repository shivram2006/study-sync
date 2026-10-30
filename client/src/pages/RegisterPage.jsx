import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Lock, User, Smile, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { romanticConfig } from '../utils/romanticConfig';
import { subscribeUserToPush } from '../utils/notificationSound';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(romanticConfig.presetAvatars[0].url);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        password,
        avatar: selectedAvatar
      });

      if (res.success) {
        sessionStorage.setItem('zenith_sanctuary_unlocked', 'true');
        subscribeUserToPush(res.token).catch(() => {});
        navigate('/private-chat');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col justify-center px-4 py-10 relative overflow-hidden font-sans-clean">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Return button */}
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
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2.5 border border-rose-100">
              <Heart size={22} className="fill-rose-500 text-rose-500" />
            </div>
            <h2 className="text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
              Create Our Account
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Set up your profile to connect with your special person.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose Avatar */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-2">
                Choose Your Avatar
              </label>
              <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 no-scrollbar">
                {romanticConfig.presetAvatars.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedAvatar === av.url
                        ? 'border-rose-500 scale-105 shadow-md shadow-rose-500/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                    {selectedAvatar === av.url && (
                      <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                        <Check size={14} className="text-white drop-shadow-md stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Display Name (How you appear to them)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Smile size={16} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. My Princess or Alex"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Username / User ID (For finding each other)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex2006"
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
                  placeholder="At least 6 characters"
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
                <span>Complete Registration</span>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-stone-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
