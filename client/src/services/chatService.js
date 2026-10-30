import api from './api';

export const chatService = {
  async getConversations() {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  async getConversationById(id) {
    const res = await api.get(`/chat/conversations/${id}`);
    return res.data;
  },

  async getMessages(conversationId) {
    const res = await api.get(`/chat/messages/${conversationId}`);
    return res.data;
  },

  async sendMessage(payload) {
    const res = await api.post('/chat/messages', payload);
    return res.data;
  },

  async reactToMessage(messageId, emoji) {
    const res = await api.post(`/chat/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  async deleteMessage(messageId) {
    const res = await api.delete(`/chat/messages/${messageId}`);
    return res.data;
  },

  async markAsRead(conversationId) {
    const res = await api.post(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
