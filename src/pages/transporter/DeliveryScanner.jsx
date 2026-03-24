import { useState } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import QrScanner from '../../components/ui/QrScanner';
import PinModal from '../../components/ui/PinModal';
import ErrorFlash from '../../components/ui/ErrorFlash';
import ConfettiEffect from '../../components/ui/ConfettiEffect';

export default function DeliveryScanner() {
  const [scannedWallet, setScannedWallet] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [errorFlash, setErrorFlash] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleScan = (data) => {
    // data = walletAddress, need to find matching order
    // For MVP: prompt for orderId manually or use first IN_TRANSIT order
    setScannedWallet(data);
    setShowPin(true);
  };

  const handleScanError = () => {
    navigator.vibrate?.([200, 100, 200]);
    setErrorFlash(n => n + 1);
  };

  const handlePinConfirm = async (pin) => {
    setShowPin(false);
    if (!orderId) {
      toast.error('Không tìm thấy đơn hàng phù hợp');
      return;
    }
    try {
      await orderApi.confirmDelivery(orderId, { citizenPin: pin, qrData: scannedWallet });
      setConfetti(true);
    } catch {
      navigator.vibrate?.([200, 100, 200]);
      setErrorFlash(n => n + 1);
    } finally {
      setScannedWallet(null);
    }
  };

  return (
    <div className="p-4">
      <ErrorFlash trigger={errorFlash} />
      <ConfettiEffect show={confetti} onDone={() => setConfetti(false)} />

      <h2 className="text-xl font-bold text-gray-800 mb-4">Quét QR Giao hàng</h2>

      <div className="mb-4">
        <label className="text-sm text-gray-600 mb-1 block">Mã đơn hàng</label>
        <input type="number" placeholder="Nhập ID đơn hàng" value={orderId || ''}
          onChange={e => setOrderId(e.target.value ? Number(e.target.value) : null)}
          className="w-full border rounded-xl px-4 h-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <QrScanner onSuccess={handleScan} onError={handleScanError} />

      {showPin && (
        <PinModal
          title="Citizen nhập PIN xác nhận"
          onConfirm={handlePinConfirm}
          onCancel={() => { setShowPin(false); setScannedWallet(null); }}
        />
      )}
    </div>
  );
}
