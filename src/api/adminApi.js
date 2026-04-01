import axiosClient from './axiosClient';

export const adminApi = {
  getStats: () => axiosClient.get('/api/admin/stats'),
  getUsers: (params) => axiosClient.get('/api/admin/users', { params }),
  toggleApprove: (id) => axiosClient.put(`/api/admin/users/${id}/approve`),
  getItems: () => axiosClient.get('/api/admin/items'),
  getPublicItems: () => axiosClient.get('/api/admin/items/public'),
  createItem: (data) => axiosClient.post('/api/admin/items', data),
  updateItem: (id, data) => axiosClient.put(`/api/admin/items/${id}`, data),
  deleteItem: (id) => axiosClient.delete(`/api/admin/items/${id}`),
  getCampaigns: () => axiosClient.get('/api/admin/campaigns'),
  toggleCampaign: (id) => axiosClient.put(`/api/admin/campaigns/${id}/toggle`),
  toggleAutoAirdrop: (id) => axiosClient.put(`/api/admin/campaigns/${id}/toggle-auto-airdrop`),
  airdrop: (province, amountPerCitizen) =>
    axiosClient.post('/api/admin/airdrop', { province, amountPerCitizen }),
  getLiveFeed: () => axiosClient.get('/api/analytics/live-feed'),
  getTokenFlow: () => axiosClient.get('/api/analytics/token-flow'),
  getDailyStats: () => axiosClient.get('/api/analytics/daily-stats'),
  resolveLostOrder: (id) => axiosClient.post(`/api/orders/${id}/resolve-lost`),
  getDisputedReports: () => axiosClient.get('/api/admin/damage-reports/disputed'),
  resolveDamageDispute: (id, acceptReport) => axiosClient.post(`/api/admin/damage-reports/${id}/resolve?acceptReport=${acceptReport}`),
};
