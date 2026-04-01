import axiosClient from './axiosClient';

export const damageApi = {
  assessDamage: (formData) => {
    return axiosClient.post('/transporter/assess-damage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  assessDamageByWallet: (formData) => {
    return axiosClient.post('/api/transporter/assess-damage-wallet', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getPublicReports: () => {
    return axiosClient.get('/api/public/damage-reports');
  },

  reportDispute: (id) => {
    return axiosClient.post(`/api/public/damage-reports/${id}/report`);
  },
};
