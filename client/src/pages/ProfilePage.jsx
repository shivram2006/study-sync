import React, { useState, useRef } from 'react';
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
  Bell,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { romanticConfig } from '../utils/romanticConfig';
import { chatService } from '../services/chatService';
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushStatus, setPushStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      ? 'active'
      : 'idle'
  );

  const fileInputRef = useRef(null);

  // Custom photo upload handler
  const handleCustomAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await chatService.uploadFile(file);
      if (res.success && res.fileUrl) {
        setSelectedAvatar(res.fileUrl);
        // Automatically save immediately so user doesn't lose it
        await updateProfile({
          displayName,
          bio,
          customQuote,
          relationshipStartDate,
          avatar: res.fileUrl
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Failed to upload custom avatar. Please try a different image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

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
    <div className="min-h-screen bg-[#FFFBFB] text-stone-800 flex flex-col font-sans-clean antialiased pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif-romantic font-bold text-stone-900 tracking-tight">
            Profile & Romantic Settings
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Personalize your custom profile picture, romantic quotes, and anniversary date.
          </p>
        </div>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs"
          >
            <Check size={15} className="text-emerald-600" />
            <span>Profile and custom picture updated successfully!</span>
          </motion.div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-rose-100/80 space-y-6"
        >
          {/* Custom Profile Picture Uploader Banner */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-radial from-rose-50/60 to-pink-50/30 border border-rose-100/70">
            <div className="relative group mb-3">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-rose-300 shadow-md bg-stone-100">
                <img
                  src={selectedAvatar}
                  alt={displayName || 'Profile'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Upload custom photo"
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              >
                <Camera size={22} />
                <span className="text-[10px] font-semibold mt-1">Change</span>
              </button>

              {/* Camera Action Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-95 transition-all"
                title="Upload custom photo"
              >
                {uploadingAvatar ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
            </div>

            {/* Hidden File Input for Custom Avatar */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomAvatarUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 cursor-pointer active:scale-95 transition-all"
            >
              <Upload size={13} />
              <span>{uploadingAvatar ? 'Uploading Photo...' : 'Upload Custom Photo'}</span>
            </button>
            <p className="text-[11px] text-stone-400 mt-1.5">
              Pick any favorite photo from your camera or gallery
            </p>
          </div>

          {/* Preset Avatars Carousel */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Or Choose from Couple Memory Presets
            </label>
            <div className="flex items-center gap-3 overflow-x-auto py-1.5 no-scrollbar">
              {romanticConfig.presetAvatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedAvatar === av.url
                      ? 'border-rose-500 scale-105 shadow-md shadow-rose-500/25 ring-2 ring-rose-200'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={av.name}
                >
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  {selectedAvatar === av.url && (
                    <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
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
              About / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Something sweet about us..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Push Notifications Configuration */}
        <div className="mt-6 bg-white rounded-3xl p-5 shadow-xs border border-rose-100/80">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-rose-500" />
            <h3 className="text-sm font-semibold text-stone-900">Background Push Notifications</h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed mb-4">
            Receive discrete, disguised notifications for messages and calls even when your browser or app is closed.
          </p>

          <button
            type="button"
            onClick={async () => {
              const res = await subscribeUserToPush();
              if (res.success) {
                setPushStatus('active');
                sendDisguisedNotification('StudySync Alert', 'You have a study reminder pending.');
              } else {
                alert(res.message || 'Push permission could not be granted.');
              }
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              pushStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {pushStatus === 'active' ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span>Background Push Notifications Active</span>
              </>
            ) : (
              <>
                <Bell size={14} />
                <span>Enable Background Push Notifications</span>
              </>
            )}
          </button>
        </div>

        {/* Disguise Switcher & Logout */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('zenith_sanctuary_unlocked');
              window.location.href = '/';
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CheckSquare size={14} className="text-stone-500" />
            <span>Lock & Return to Disguised To-Do Mode</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Log Out of Account</span>
          </button>
        </div>
      </main>
    </div>
  );
};
