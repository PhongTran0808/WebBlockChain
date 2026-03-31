import axiosClient from './axiosClient';

export const walletApi = {
  topUp:    (amount, pin) => axiosClient.post('/api/wallet/topup',    { amount, pin }),
  donate:   (province, amount, pin) => axiosClient.post('/api/wallet/donate', { province, amount, pin }),
  withdraw: (amount, pin) => axiosClient.post('/api/wallet/withdraw', { amount, pin }),
  payShopDirect: (shopId, amount, pin) => axiosClient.post('/api/transactions/pay-shop-direct', { shopId, amount, pin }),
  getTransactions: () => axiosClient.get('/api/wallet/transactions'),
  getHistory: () => axiosClient.get('/api/transactions/history'),
  getUserName: (id) => axiosClient.get(`/api/users/${id}/name`),
  getActiveProvinces: () => axiosClient.get('/api/admin/campaigns/active'),
};

