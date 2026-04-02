import axiosClient from './axiosClient';

export const batchApi = {
  // Admin
  createBatch: (data) => axiosClient.post('/api/batches', data),
  getAllBatches: () => axiosClient.get('/api/batches/all'),
  deleteBatch: (id) => axiosClient.delete(`/api/batches/${id}`),
  getProvinceStats: (province) => axiosClient.get('/api/batches/province-stats', { params: { province } }),

  // TNV
  getAvailable: (province) => axiosClient.get('/api/batches/available', { params: province ? { province } : {} }),
  getMyBatches: () => axiosClient.get('/api/batches/mine'),
  claimBatch: (id, shopId) => axiosClient.post(`/api/batches/${id}/claim`, { shopId }),
  pickupBatch: (id, qrData) => axiosClient.post(`/api/batches/${id}/pickup`, { qrData }),
  deliverToOneCitizen: (id, citizenWallet) => axiosClient.post(`/api/batches/${id}/deliver`, { citizenWallet }),

  // Shop
  getShopPending: () => axiosClient.get('/api/batches/shop/pending'),
  getShopAll: () => axiosClient.get('/api/batches/shop/all'),
  getBatchById: (id) => axiosClient.get(`/api/batches/${id}`),
  acceptBatch: (id) => axiosClient.post(`/api/batches/${id}/accept`),
  rejectBatch: (id) => axiosClient.post(`/api/batches/${id}/reject`),
};
