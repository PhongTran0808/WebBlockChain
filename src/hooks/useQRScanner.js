import { useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook quản lý logic quét mã QR
 * Áp dụng Anti-bounce (Throttling / Lock scan) và Validate định dạng
 */
export const useQRScanner = (onValidScan, validateFunc) => {
  const lastScanned = useRef('');
  const lock = useRef(false);

  const handleScan = (data) => {
    if (!data || lock.current) return;
    
    // Nếu có hàm custom validate thì xài hàm đó báo lỗi
    if (validateFunc) {
       const [isValid, errMsg] = validateFunc(data);
       if (!isValid) {
          toast.error(errMsg || 'Mã QR không đúng định dạng!');
          debounceLock(3000);
          return;
       }
    } else {
        // Fallback mặc định
        const isCitizenID = /^\d{15}$/.test(data);
        const isCTMBScheme = data.startsWith('CTMB:');
        if (!isCitizenID && !isCTMBScheme) {
          toast.error('Mã QR này không đúng định dạng của Hệ thống Cứu Trợ!');
          debounceLock(3000);
          return;
        }
    }

    // 2. Chặn quét đúp (Zebra striping edge case)
    if (data === lastScanned.current) return; 

    // Nếu lọt qua hết, nhận mã!
    lastScanned.current = data;
    lock.current = true;
    onValidScan(data);
    
    // Đóng băng đầu scan khoảng 3 giây giúp người dùng cất điện thoại mà không scan lại
    debounceLock(3000);
  };

  const debounceLock = (ms = 2000) => {
    lock.current = true;
    setTimeout(() => { 
        lock.current = false; 
        lastScanned.current = ''; 
    }, ms);
  };

  return { handleScan };
};
