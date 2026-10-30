import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Save,
  Calendar,
  Quote,
  Smile,
  LogOut,
  Check,
  CheckSquare,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { romanticConfig } from '../utils/romanticConfig';
import {
  playMessageTone,
  sendDisguisedNotification,
  requestNotificationPermission,
  subscribeUserToPush
} from '../utils/notificationSound';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [customQuote, setCustomQuote] = useState(user?.customQuote || '');
  const [relationshipStartDate, setRelationshipStartDate] = useState(
    user?.relationshipStartDate
      ? new Date(user.relationshipStartDate).toISOString().split('T')[0]
      : '2023-06-15'
  );
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar || romanticConfig.presetAvatars[0].url
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushStatus, setPushStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      ? 'active'
      : 'idle'
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavedSuccess(false);

    try {
      const res = await updateProfile({
        displayName,
        bio,
        customQuote,
        relationshipStartDate,
        avatar: selectedAvatar
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col font-sans-clean antialiased pb-20 sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
            Profile & Romantic Settings
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Personalize your avatar, romantic quote, and relationship anniversary date.
          </p>
        </div>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
          >
            <Check size={15} className="text-emerald-600" />
            <span>Profile and romantic settings updated successfully!</span>
          </motion.div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-rose-100/80 space-y-5"
        >
          {/* Avatar Presets Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Choose Avatar
            </label>
            <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
              {romanticConfig.presetAvatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedAvatar === av.url
                      ? 'border-rose-500 scale-105 shadow-md shadow-rose-500/25'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  {selectedAvatar === av.url && (
                    <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                      <Check size={16} className="text-white drop-shadow stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Username (Permanent ID)
            </label>
            <input
              type="text"
              disabled
              value={user?.username || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100/80 border border-stone-200 text-stone-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-rose-500" />
              <span>Special Date / Anniversary Counter</span>
            </label>
            <input
              type="date"
              value={relationshipStartDate}
              onChange={(e) => setRelationshipStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Powers the live "Together Forever" day and time counter on your chat dashboard.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Quote size={14} className="text-rose-500" />
              <span>Our Special Romantic Quote</span>
            </label>
            <textarea
              rows={2}
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
              placeholder="A line that belongs only to the two of you..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all font-serif-romantic italic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Personal Bio / Note
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A gentle note displayed on your discovery card..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Romantic Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Stealth Notifications & Ringtone Test Card */}
        <div className="mt-5 p-5 rounded-3xl bg-white border border-rose-100 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Stealth Notifications & Ringtone
              </h3>
              <p className="text-[11px] text-stone-500">
                Incoming messages ring a sweet chime and show a disguised "New task added" alert.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-rose-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-stone-700 font-medium block">Closed App / Lockscreen Alerts</span>
              <span className="text-[11px] text-stone-500">
                {pushStatus === 'active'
                  ? 'Active on this device: You receive alerts even when phone is locked.'
                  : 'Tap to allow notifications when the app is closed.'}
              </span>
            </div>
            <button
              type="button"
              disabled={pushStatus === 'syncing'}
              onClick={async () => {
                setPushStatus('syncing');
                const sub = await subscribeUserToPush();
                if (sub) {
                  setPushStatus('active');
                } else {
                  setPushStatus('idle');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                pushStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {pushStatus === 'syncing' ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : pushStatus === 'active' ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span>Enabled on Device</span>
                </>
              ) : (
                <>
                  <Bell size={13} />
                  <span>Enable Push Alerts</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-rose-50 flex items-center justify-between">
            <span className="text-xs text-stone-600">Test tone & disguised alert:</span>
            <button
              type="button"
              onClick={async () => {
                await requestNotificationPermission();
                playMessageTone();
                await sendDisguisedNotification();
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Bell size={13} />
              <span>Test Chime & Alert</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
