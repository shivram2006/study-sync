import api from './api';

export const friendService = {
  async discoverUsers(search = '') {
    const res = await api.get('/users/discover', { params: { search } });
    return res.data;
  },

  async getRequests() {
    const res = await api.get('/friends/requests');
    return res.data;
  },

  async sendRequest(receiverId) {
    const res = await api.post('/friends/request', { receiverId });
    return res.data;
  },

  async respondToRequest(requestId, action) {
    const res = await api.post(`/friends/respond/${requestId}`, { action });
    return res.data;
  },

  async cancelRequest(requestId) {
    const res = await api.delete(`/friends/cancel/${requestId}`);
    return res.data;
  },

  async removeFriend(friendId) {
    const res = await api.delete(`/friends/remove/${friendId}`);
    return res.data;
  }
};
