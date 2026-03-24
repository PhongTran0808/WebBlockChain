import axiosClient from './axiosClient';

export const orderApi = {
  getOrders: () => axiosClient.get('/api/orders'),
  createOrder: (data) => axiosClient.post('/api/orders', data),
  markReady: (id) => axiosClient.put(`/api/orders/${id}/ready`),
  markPickup: (id) => axiosClient.put(`/api/orders/${id}/pickup`),
  confirmDelivery: (id, data) => axiosClient.post(`/api/orders/${id}/deliver`, data),
  syncOfflineQueue: (items) => axiosClient.post('/api/sync/offline-queue', items),
};
