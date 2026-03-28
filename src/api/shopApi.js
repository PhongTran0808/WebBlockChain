import axiosClient from './axiosClient';

export const shopApi = {
  getInventory: () => axiosClient.get('/api/shop/inventory'),
  addToInventory: (data) => axiosClient.post('/api/shop/inventory', data),
  updateInventory: (id, data) => axiosClient.put(`/api/shop/inventory/${id}`, data),
};
