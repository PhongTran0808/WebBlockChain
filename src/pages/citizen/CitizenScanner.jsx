import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { walletApi } from '../../api/walletApi';

export default function CitizenScanner() {
  const navigate = useNavigate();
  const [scannedShop, setScannedShop] = useState(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const scannerRef = useRef(null);

  // Load balance (Mô phỏng như CitizenHome)
  useEffect(() => {
    walletApi.getTransactions()
      .then(r => {
        const bal = r.data.reduce((sum, tx) => {
          let txAmt = Number(tx.amount || 0);
          if (tx.isPlus === true) return sum + txAmt;
          if (tx.isPlus === false) return sum - txAmt;
          return sum; // Fallback
        }, 0);
        setBalance(Math.max(0, bal));
      })
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => {
    if (scannedShop) return; // Dừng QR nếu đã quét xong

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    }, false);

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data && data.shopId && data.shopName) {
            setScannedShop(data);
            scanner.clear();
            toast.success(`Đã quét Cửa hàng: ${data.shopName}`);
          } else {
            toast.error('Mã QR không hợp lệ. Vui lòng thử lại!');
          }
        } catch (e) {
          toast.error('Định dạng QR không đúng!');
        }
      },
      (error) => {
        // Ignored, happens when nothing is in front of camera
      }
    );

    return () => {
      try {
        scanner.clear();
      } catch (e) { }
    };
  }, [scannedShop]);

  const handlePay = async () => {
    const tokenAmount = Number(amount);
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (balance !== null && tokenAmount > balance) {
      toast.error(`Số dư không đủ. Hiện có ${balance.toLocaleString('vi-VN')} token.`);
      return;
    }
    if (pin.length < 6) {
      toast.error('Vui lòng nhập đủ 6 số mã PIN');
      return;
    }

    setLoading(true);
    try {
      await walletApi.payShopDirect(scannedShop.shopId, tokenAmount, pin);
      toast.success('Thanh toán thành công!');
      navigate('/citizen');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">Quét Thanh Toán</h1>
        <div className="w-6"></div>
      </div>

      {!scannedShop ? (
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100">
          <p className="text-center text-sm text-gray-500 mb-4">
            Đưa mã QR của Cửa hàng vào vùng camera để tiếp tục
          </p>
          <div id="qr-reader" className="overflow-hidden rounded-2xl w-full border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 animation-slideUp">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
              🏪
            </div>
            <h2 className="text-lg font-bold text-gray-800">Thanh toán cho</h2>
            <p className="text-xl text-blue-700 font-extrabold">{scannedShop.shopName}</p>
            <p className="text-xs text-gray-400 mt-1 break-all px-2">{scannedShop.walletAddress}</p>
          </div>

          {balance !== null && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center mb-5">
              <span className="text-sm text-blue-700">Số dư hiện tại</span>
              <span className="font-bold text-blue-800">{balance.toLocaleString('vi-VN')} token</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium ml-1">Số token cần thanh toán</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 h-12 text-right text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium ml-1">Xác thực mã PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-12 text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full h-14 bg-blue-700 text-white rounded-2xl font-bold text-base hover:bg-blue-800 transition-colors shadow-blue mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : 'Xác nhận thanh toán'}
            </button>
            <button
              onClick={() => setScannedShop(null)}
              disabled={loading}
              className="w-full h-10 mt-1 text-gray-500 font-medium text-sm hover:text-gray-700 disabled:opacity-50"
            >
              Hủy / Quét lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
