import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';

export default function MyQR() {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${user?.walletAddress?.slice(0, 8)}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Mã QR của tôi</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">Cho cửa hàng hoặc shipper quét để xác nhận</p>

      <div ref={canvasRef} className="bg-white p-4 rounded-2xl shadow-lg mb-6">
        {user?.walletAddress ? (
          <QRCodeCanvas
            value={user.walletAddress}
            size={220}
            bgColor="#ffffff"
            fgColor="#1e3a8a"
            level="M"
          />
        ) : (
          <div className="w-56 h-56 bg-gray-200 rounded-xl animate-pulse" />
        )}
      </div>

      <p className="text-xs text-gray-400 font-mono mb-6 break-all text-center px-4">
        {user?.walletAddress}
      </p>

      <button onClick={handleDownload} disabled={!user?.walletAddress}
        className="w-full max-w-xs h-12 bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
        Tải mã QR về máy
      </button>
    </div>
  );
}
