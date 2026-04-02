import axiosClient from './axiosClient';

export const adminApi = {
  getStats: () => axiosClient.get('/api/admin/stats'),
  getUsers: (params) => axiosClient.get('/api/admin/users', { params }),
  toggleApprove: (id) => axiosClient.put(`/api/admin/users/${id}/approve`),
  // Cập nhật địa chỉ ví blockchain cho user (shop/transporter/citizen)
  setWalletAddress: (id, walletAddress) => axiosClient.put(`/api/admin/users/${id}/wallet`, { walletAddress }),
  getItems: () => axiosClient.get('/api/admin/items'),
  getPublicItems: () => axiosClient.get('/api/admin/items/public'),
  createItem: (data) => axiosClient.post('/api/admin/items', data),
  updateItem: (id, data) => axiosClient.put(`/api/admin/items/${id}`, data),
  deleteItem: (id) => axiosClient.delete(`/api/admin/items/${id}`),
  getCampaigns: () => axiosClient.get('/api/admin/campaigns'),
  toggleCampaign: (id) => axiosClient.put(`/api/admin/campaigns/${id}/toggle`),
  toggleAutoAirdrop: (id) => axiosClient.put(`/api/admin/campaigns/${id}/toggle-auto-airdrop`),
  getProvinceStats: () => axiosClient.get('/api/admin/province-stats'),
  distributeFunds: (id) => axiosClient.put(`/api/admin/campaigns/${id}/distribute-funds`),
  airdrop: (province, amountPerCitizen) =>
    axiosClient.post('/api/admin/airdrop', { province, amountPerCitizen }),
  getLiveFeed: () => axiosClient.get('/api/analytics/live-feed'),
  getTokenFlow: () => axiosClient.get('/api/analytics/token-flow'),
  getDailyStats: () => axiosClient.get('/api/analytics/daily-stats'),
  resolveLostOrder: (id) => axiosClient.post(`/api/orders/${id}/resolve-lost`),
  getDisputedReports: () => axiosClient.get('/api/admin/damage-reports/disputed'),
  resolveDamageDispute: (id, acceptReport) => axiosClient.post(`/api/admin/damage-reports/${id}/resolve?acceptReport=${acceptReport}`),
  // Đồng bộ tỉnh: tạo CampaignPool cho tỉnh có citizen nhưng chưa có pool
  syncProvinces: () => axiosClient.post('/api/admin/campaigns/sync-provinces'),
  // Fix dữ liệu ví bị ghi đè bởi mã chiến dịch
  fixWalletData: () => axiosClient.post('/api/admin/users/fix-wallet-data'),
  // Cấp ví tự động cho 1 user cụ thể
  autoAssignWallet: (id) => axiosClient.post(`/api/admin/users/${id}/auto-wallet`),
  // Cấp ví hàng loạt cho tất cả SHOP/TRANSPORTER chưa có ví
  bulkAssignWallets: () => axiosClient.post('/api/admin/users/bulk-assign-wallets'),
};
