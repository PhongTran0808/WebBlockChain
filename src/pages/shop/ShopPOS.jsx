import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import QrScanner from '../../components/ui/QrScanner';
import ErrorFlash from '../../components/ui/ErrorFlash';
import TransactionLedger from '../../components/ui/TransactionLedger';
import { Link } from 'react-router-dom';

const beep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

export default function ShopPOS() {
  const [orders, setOrders] = useState([]);
  const [errorFlash, setErrorFlash] = useState(0);
  const [popup, setPopup] = useState(null);
  const [tab, setTab] = useState('pos');
  const [scannerOn, setScannerOn] = useState(false); // mặc định TẮT

  useEffect(() => {
    orderApi.getOrders().then(r => setOrders(r.data)).catch(() => {});
  }, []);

  // Tắt scanner khi chuyển tab
  useEffect(() => {
    if (tab !== 'pos') setScannerOn(false);
  }, [tab]);

  const handleScan = (walletAddress) => {
    beep();
    setScannerOn(false); // tắt camera sau khi quét
    setPopup({ walletAddress });
  };

  const handleConfirmPayment = async () => {
    try {
      const res = await paymentApi.qrPayment({
        citizenWalletAddress: popup.walletAddress,
        tokenId: 1,
        amount: 10,
      });
      toast.success(`Thanh toán thành công! TX: ${res.data.txHash?.slice(0, 10)}...`);
    } catch {} finally {
      setPopup(null);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  return (
    <div className="flex flex-col h-full">
      <ErrorFlash trigger={errorFlash} />

      {/* Tabs */}
      <div className="flex gap-2 p-4 pb-0">
        {[['pos','Thanh toán QR'],['ledger','Sao kê']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 h-9 rounded-xl text-sm font-medium transition-colors
              ${tab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'pos' && (
        <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">
          {/* Orders list */}
          <div className="lg:w-1/2">
            <h3 className="font-semibold text-gray-700 mb-3">Đơn hàng chờ ({pendingOrders.length})</h3>
            <div className="space-y-2">
              {pendingOrders.map(o => (
                <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="font-medium">Đơn #{o.id}</p>
                  <p className="text-sm text-gray-500">{o.citizenName} — {o.totalTokens} token</p>
                </div>
              ))}
              {pendingOrders.length === 0 && <p className="text-gray-400 text-sm">Không có đơn hàng chờ</p>}
            </div>
          </div>

          {/* Scanner với toggle */}
          <div className="lg:w-1/2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Quét QR thanh toán</h3>
              <button
                onClick={() => setScannerOn(v => !v)}
                className={`flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium transition-colors
                  ${scannerOn
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                <span>{scannerOn ? '⏹' : '▶'}</span>
                {scannerOn ? 'Tắt máy quét' : 'Bật máy quét'}
              </button>
            </div>

            {scannerOn ? (
              <QrScanner onSuccess={handleScan} onError={() => setErrorFlash(n => n + 1)} />
            ) : (
              <div className="bg-gray-100 rounded-2xl flex flex-col items-center justify-center h-56 gap-3 text-gray-400">
                <span className="text-5xl">📷</span>
                <p className="text-sm">Bấm "Bật máy quét" để mở camera</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Giao dịch gần đây</h3>
            <Link to="/history" className="text-sm text-blue-600 font-medium hover:underline">
              Xem toàn bộ sao kê →
            </Link>
          </div>
          <TransactionLedger limit={10} />
        </div>
      )}

      {/* Confirm popup */}
      {popup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="font-bold text-lg mb-2">Xác nhận thanh toán</h3>
            <p className="text-sm text-gray-500 mb-1">Wallet:</p>
            <p className="text-xs font-mono text-gray-700 break-all mb-4">{popup.walletAddress}</p>
            <div className="flex gap-2">
              <button onClick={handleConfirmPayment} className="flex-1 h-11 bg-green-600 text-white rounded-xl font-medium">Xác nhận</button>
              <button onClick={() => setPopup(null)} className="flex-1 h-11 bg-gray-100 rounded-xl">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
