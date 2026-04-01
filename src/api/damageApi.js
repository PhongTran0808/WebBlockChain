import axiosClient from './axiosClient';

export const damageApi = {
  assessDamage: (formData) => {
    return axiosClient.post('/transporter/assess-damage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getPublicReports: () => {
    return axiosClient.get('/public/damage-reports');
  },

  reportDispute: (id) => {
    return axiosClient.post(`/public/damage-reports/${id}/report`);
  },
};
