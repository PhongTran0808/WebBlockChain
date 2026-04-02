import axios from 'axios';

// Thay bằng token thật từ Pinata
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT || 'YOUR_PINATA_JWT';

/**
 * Tải file lên IPFS (Pinata) với cơ chế tự động Retry 
 * Hữu ích cho môi trường mạng yếu, hay timeout.
 */
export const uploadToIPFSWithRetry = async (file, retries = 3, interval = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const config = { 
        timeout: 15000, // Chờ 15s để báo timeout
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
        }
      };
      
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, config);
      return response.data.IpfsHash; 
    } catch (error) {
      if (attempt === retries) throw new Error("Mạng chập chờn, tải file IPFS thất bại sau nhiều lần thử.");
      console.warn(`[IPFS] Upload timeout/lỗi! Đang thử lại lần thứ ${attempt}...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};
