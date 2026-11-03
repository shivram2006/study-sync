/**
 * INSTANT CHAT CACHE (SWR Pattern)
 * --------------------------------
 * Provides 0ms instant loading for conversations & active chat rooms.
 * Uses sessionStorage so data stays fresh within session and survives page switches.
 */

const CACHE_PREFIX = 'zenith_chat_room_';
const CONV_LIST_KEY = 'zenith_conversations_list';

export const chatCache = {
  // Get cached messages & conversation info
  getChat(conversationId) {
    if (typeof window === 'undefined' || !conversationId) return null;
    try {
      const data = sessionStorage.getItem(CACHE_PREFIX + conversationId);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Save messages & conversation info to fast cache
  setChat(conversationId, messages = [], conversation = null) {
    if (typeof window === 'undefined' || !conversationId) return;
    try {
      sessionStorage.setItem(
        CACHE_PREFIX + conversationId,
        JSON.stringify({
          messages: messages.slice(-100), // store up to last 100 messages for instantaneous rendering
          conversation,
          cachedAt: Date.now()
        })
      );
    } catch (e) {
      console.warn('Chat cache write error:', e);
    }
  },

  // Get cached conversations list
  getConversations() {
    if (typeof window === 'undefined') return null;
    try {
      const data = sessionStorage.getItem(CONV_LIST_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Save conversations list
  setConversations(conversations = []) {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(CONV_LIST_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Conversation list cache write error:', e);
    }
  }
};
