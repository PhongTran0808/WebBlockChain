import { useState } from 'react';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api/paymentApi';

export default function Liquidity() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Nhập số tiền hợp lệ'); return; }
    setLoading(true);
    try {
      await paymentApi.withdraw(Number(amount));
      toast.success('Yêu cầu rút tiền đã được ghi nhận');
      setAmount('');
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Thanh khoản</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <p className="text-sm text-gray-500 mb-1">Tổng Token Khả Dụng</p>
        <p className="text-3xl font-bold text-blue-700">— token</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Yêu cầu rút tiền VND</h3>
        <input type="number" placeholder="Số tiền VND" value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full border rounded-xl px-4 h-12 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleWithdraw} disabled={loading}
          className="w-full h-12 bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
          {loading ? 'Đang xử lý...' : 'Gửi yêu cầu rút tiền'}
        </button>
      </div>
    </div>
  );
}
