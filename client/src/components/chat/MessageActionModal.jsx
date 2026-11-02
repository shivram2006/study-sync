import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Reply,
  Copy,
  Edit3,
  Trash2,
  X,
  Check,
  Smile,
  ShieldAlert
} from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '😂', '🥺', '😮', '😢', '🙏', '🔥', '🌸'];

export const MessageActionModal = ({
  message,
  isMe,
  onClose,
  onReply,
  onReact,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message?.content || '');
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 700);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editedText.trim()) return;
    onEdit(message._id, editedText.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-rose-100 flex flex-col gap-3"
      >
        {/* If Editing Mode */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 font-serif-romantic">
                <Edit3 size={14} />
                <span>Edit Message</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <textarea
              rows={3}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-stone-50 border border-rose-200 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editedText.trim() || editedText.trim() === message.content}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-40"
              >
                <Check size={14} />
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : showDeleteConfirm ? (
          /* WhatsApp-Style Delete Confirmation Dialog */
          <div className="space-y-3 text-center py-1">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
              <Trash2 size={20} />
            </div>

            <h4 className="text-sm font-semibold text-stone-900">Delete Message?</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isMe
                ? 'You can delete this message for everyone or only for yourself.'
                : 'Delete this message for yourself?'}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {isMe && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message._id, 'everyone');
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-98 transition-all"
                >
                  Delete for Everyone
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDelete(message._id, 'me');
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer active:scale-98 transition-all"
              >
                Delete for Me
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-2 text-stone-400 hover:text-stone-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Standard WhatsApp-Style Action Menu */
          <>
            {/* Quick Emoji Reaction Pill */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-stone-50 border border-rose-100 overflow-x-auto no-scrollbar gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message._id, emoji);
                    onClose();
                  }}
                  className="text-xl p-1.5 hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions List */}
            <div className="flex flex-col divide-y divide-rose-50 text-stone-700 text-xs font-medium">
              {/* Reply */}
              <button
                type="button"
                onClick={() => {
                  onReply(message);
                  onClose();
                }}
                className="flex items-center gap-3 py-3 px-2 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer text-left"
              >
                <Reply size={16} className="text-rose-500" />
                <span>Reply</span>
              </button>

              {/* Copy (only if text content) */}
              {message.content && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer text-left"
                >
                  {copied ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <Copy size={16} className="text-rose-500" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              )}

              {/* Edit (only if my own message and text) */}
              {isMe && !message.isDeleted && message.messageType === 'text' && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-rose-50/70 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={16} className="text-rose-500" />
                  <span>Edit Message</span>
                </button>
              )}

              {/* Delete */}
              {!message.isDeleted && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={16} className="text-red-500" />
                  <span>Delete Message</span>
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
