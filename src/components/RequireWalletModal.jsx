import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function RequireWalletModal() {
  const { user, updateWallet } = useAuth();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shouldShow = user &&
    ['SHOP', 'TRANSPORTER'].includes(user.role) &&
    !user.walletAddress;

  if (!shouldShow) return null;

  const handleConnectMetaMask = async () => {
    if (!window.ethereum) {
      setError('MetaMask chưa được cài đặt. Vui lòng cài tại metamask.io rồi thử lại.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
      setError('');
    } catch (err) {
      setError('Không thể kết nối MetaMask. Vui lòng thử lại.');
    }
  };

  const handleConfirm = async () => {
    if (!WALLET_REGEX.test(address)) {
      setError('Địa chỉ ví không hợp lệ. Định dạng yêu cầu: 0x theo sau bởi 40 ký tự hex (0-9, a-f, A-F).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.put('/api/users/me/wallet', { walletAddress: address });
      updateWallet(data.walletAddress);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="text-center mb-4">
          <span className="text-4xl">🔐</span>
          <h2 className="text-xl font-bold text-gray-800 mt-2">Cập nhật địa chỉ ví</h2>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống vừa nâng cấp. Vui lòng cập nhật địa chỉ ví để tiếp tục sử dụng.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={address}
            onChange={e => { setAddress(e.target.value); setError(''); }}
            placeholder="0x..."
            className="w-full border rounded-xl px-4 h-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleConnectMetaMask}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            🦊 Kết nối MetaMask
          </button>

          {error && (
            <p className="text-red-500 text-xs px-1">{error}</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full h-12 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
