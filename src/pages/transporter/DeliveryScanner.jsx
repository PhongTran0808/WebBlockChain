import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import QrScanner from '../../components/ui/QrScanner';
import PinModal from '../../components/ui/PinModal';
import ErrorFlash from '../../components/ui/ErrorFlash';
import ConfettiEffect from '../../components/ui/ConfettiEffect';

/**
 * Luồng 2 bước:
 * STEP 1 — Quét QR đơn hàng tại Shop (orderId được encode trong QR)
 *           → gọi markPickup → status: PENDING/READY → IN_TRANSIT
 * STEP 2 — Quét QR wallet citizen khi giao hàng
 *           → citizen nhập PIN → gọi confirmDelivery → status: DELIVERED
 */

const STEPS = {
  IDLE: 'idle',           // chưa làm gì
  SCAN_ORDER: 'scan_order',   // đang quét QR đơn hàng (tại shop)
  PICKUP_DONE: 'pickup_done', // đã lấy hàng, chờ đến nhà dân
  SCAN_CITIZEN: 'scan_citizen', // đang quét QR citizen
  PIN: 'pin',             // citizen nhập PIN
  SUCCESS: 'success',     // giao thành công
};

export default function DeliveryScanner() {
  const [step, setStep] = useState(STEPS.IDLE);
  const [currentOrder, setCurrentOrder] = useState(null);   // order đang xử lý
  const [scannedWallet, setScannedWallet] = useState(null);
  const [errorFlash, setErrorFlash] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [inTransitOrders, setInTransitOrders] = useState([]);

  // Load đơn đang IN_TRANSIT của TNV này
  const loadInTransit = useCallback(() => {
    orderApi.getOrders()
      .then(r => setInTransitOrders(r.data.filter(o => o.status === 'IN_TRANSIT')))
      .catch(() => {});
  }, []);

  useEffect(() => { loadInTransit(); }, [loadInTransit]);

  const vibrate = (pattern = [200]) => navigator.vibrate?.(pattern);

  // ── BƯỚC 1: Quét QR đơn hàng tại shop ──────────────────────────────────
  const handleScanOrder = async (qrText) => {
    if (processing) return;

    // QR đơn hàng encode dạng: "ORDER:{orderId}" hoặc chỉ là số orderId
    let orderId = null;
    if (qrText.startsWith('ORDER:')) {
      orderId = parseInt(qrText.replace('ORDER:', ''), 10);
    } else if (/^\d+$/.test(qrText.trim())) {
      orderId = parseInt(qrText.trim(), 10);
    }

    if (!orderId || isNaN(orderId)) {
      toast.error('QR không hợp lệ — cần quét mã đơn hàng');
      vibrate([100, 50, 100]);
      setErrorFlash(n => n + 1);
      return;
    }

    setProcessing(true);
    try {
      const res = await orderApi.markPickup(orderId);
      setCurrentOrder(res.data);
      setStep(STEPS.PICKUP_DONE);
      toast.success(`Đã nhận đơn #${orderId} — hãy giao cho ${res.data.citizenName}`);
      loadInTransit();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không thể nhận đơn hàng này';
      toast.error(msg);
      vibrate([200, 100, 200]);
      setErrorFlash(n => n + 1);
    } finally {
      setProcessing(false);
    }
  };

  // ── BƯỚC 2: Quét QR wallet citizen ──────────────────────────────────────
  const handleScanCitizen = (walletAddress) => {
    if (!walletAddress || walletAddress.length < 10) {
      toast.error('QR không hợp lệ');
      setErrorFlash(n => n + 1);
      return;
    }
    setScannedWallet(walletAddress);
    setStep(STEPS.PIN);
  };

  // ── Citizen nhập PIN → xác nhận giao hàng ───────────────────────────────
  const handlePinConfirm = async (pin) => {
    const order = currentOrder;
    if (!order) return;

    setStep(STEPS.IDLE);
    setProcessing(true);
    try {
      await orderApi.confirmDelivery(order.id, {
        citizenPin: pin,
        qrData: scannedWallet,
      });
      setConfetti(true);
      setStep(STEPS.SUCCESS);
      setCurrentOrder(null);
      setScannedWallet(null);
      loadInTransit();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác nhận thất bại';
      toast.error(msg);
      vibrate([200, 100, 200]);
      setErrorFlash(n => n + 1);
      setStep(STEPS.SCAN_CITIZEN); // quay lại quét
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep(STEPS.IDLE);
    setCurrentOrder(null);
    setScannedWallet(null);
  };

  // ── Chọn đơn IN_TRANSIT từ danh sách để tiếp tục giao ───────────────────
  const resumeOrder = (order) => {
    setCurrentOrder(order);
    setStep(STEPS.SCAN_CITIZEN);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <ErrorFlash trigger={errorFlash} />
      <ConfettiEffect show={confetti} onDone={() => { setConfetti(false); setStep(STEPS.IDLE); }} />

      {/* ── IDLE: Màn hình chọn hành động ── */}
      {step === STEPS.IDLE && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Giao nhận hàng</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setStep(STEPS.SCAN_ORDER)}
              className="bg-blue-700 text-white rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-blue-800 transition-colors">
              <span className="text-3xl">📦</span>
              <span className="font-semibold text-sm">Lấy hàng tại Shop</span>
              <span className="text-xs opacity-75">Quét QR đơn hàng</span>
            </button>
            <button
              onClick={() => inTransitOrders.length > 0
                ? (inTransitOrders.length === 1 ? resumeOrder(inTransitOrders[0]) : setStep(STEPS.PICKUP_DONE))
                : toast.error('Chưa có đơn nào đang giao')}
              className="bg-green-600 text-white rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-green-700 transition-colors">
              <span className="text-3xl">🏠</span>
              <span className="font-semibold text-sm">Giao cho dân</span>
              <span className="text-xs opacity-75">Quét QR người nhận</span>
            </button>
          </div>

          {/* Đơn đang IN_TRANSIT */}
          {inTransitOrders.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Đơn đang giao ({inTransitOrders.length})</p>
              <div className="space-y-2">
                {inTransitOrders.map(o => (
                  <div key={o.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm
                    flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Đơn #{o.id}</p>
                      <p className="text-sm text-gray-500">👤 {o.citizenName}</p>
                    </div>
                    <button onClick={() => resumeOrder(o)}
                      className="px-3 h-9 bg-green-600 text-white rounded-lg text-xs font-medium">
                      Giao ngay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCAN_ORDER: Quét QR đơn hàng tại shop ── */}
      {step === STEPS.SCAN_ORDER && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
            <div>
              <h2 className="font-bold text-gray-800">Bước 1 — Lấy hàng tại Shop</h2>
              <p className="text-xs text-gray-500">Quét mã QR trên đơn hàng của shop</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
            📋 Yêu cầu shop hiển thị mã QR đơn hàng và quét vào đây
          </div>

          {processing ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Đang xử lý...</p>
            </div>
          ) : (
            <QrScanner
              onSuccess={handleScanOrder}
              onError={() => setErrorFlash(n => n + 1)}
            />
          )}
        </div>
      )}

      {/* ── PICKUP_DONE: Đã lấy hàng, chọn đơn để giao ── */}
      {step === STEPS.PICKUP_DONE && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
            <div>
              <h2 className="font-bold text-gray-800">Bước 2 — Giao cho người dân</h2>
              <p className="text-xs text-gray-500">Chọn đơn cần giao</p>
            </div>
          </div>

          <div className="space-y-3">
            {inTransitOrders.map(o => (
              <div key={o.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800">Đơn #{o.id}</p>
                    <p className="text-sm text-gray-600 mt-0.5">👤 {o.citizenName}</p>
                    <p className="text-sm text-gray-500">🏪 {o.shopName}</p>
                  </div>
                  <span className="text-blue-700 font-bold">{o.shopPrice ?? o.totalTokens} token</span>
                </div>
                <button onClick={() => resumeOrder(o)}
                  className="w-full h-10 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                  🏠 Giao đơn này
                </button>
              </div>
            ))}
            {inTransitOrders.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Không có đơn nào đang giao</p>
            )}
          </div>
        </div>
      )}

      {/* ── SCAN_CITIZEN: Quét QR wallet citizen ── */}
      {step === STEPS.SCAN_CITIZEN && currentOrder && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStep(STEPS.PICKUP_DONE)} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
            <div>
              <h2 className="font-bold text-gray-800">Quét QR người nhận</h2>
              <p className="text-xs text-gray-500">Đơn #{currentOrder.id} — {currentOrder.citizenName}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">
            📱 Yêu cầu người dân mở mã QR trong app và quét vào đây
          </div>

          <QrScanner
            onSuccess={handleScanCitizen}
            onError={() => setErrorFlash(n => n + 1)}
          />
        </div>
      )}

      {/* ── PIN Modal ── */}
      {step === STEPS.PIN && (
        <PinModal
          title={`Người dân nhập PIN xác nhận\nĐơn #${currentOrder?.id}`}
          onConfirm={handlePinConfirm}
          onCancel={() => { setStep(STEPS.SCAN_CITIZEN); setScannedWallet(null); }}
        />
      )}

      {/* ── SUCCESS ── */}
      {step === STEPS.SUCCESS && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">✅</div>
          <h2 className="text-xl font-bold text-gray-800">Giao hàng thành công!</h2>
          <p className="text-sm text-gray-500 text-center">Token đã được mở khóa và chuyển vào ví shop</p>
          <button onClick={reset}
            className="mt-4 px-8 h-12 bg-blue-700 text-white rounded-2xl font-semibold hover:bg-blue-800 transition-colors">
            Giao đơn tiếp theo
          </button>
        </div>
      )}
    </div>
  );
}
