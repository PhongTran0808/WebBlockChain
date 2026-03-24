import axiosClient from './axiosClient';

export const paymentApi = {
  qrPayment: (data) => axiosClient.post('/api/payment/qr', data),
  withdraw: (amount) => axiosClient.post('/api/payment/withdraw', { amount }),
};
