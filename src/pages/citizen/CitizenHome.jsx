import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { walletApi } from '../../api/walletApi';
import toast from 'react-hot-toast';
import TransactionLedger from '../../components/ui/TransactionLedger';

// ── Tỷ lệ quy đổi ────────────────────────────────────────────────────────────
const TOKEN_TO_VND = 1000;        // 1 token = 1.000 VNĐ
const TOPUP_PRESETS = [50000, 100000, 200000, 500000]; // VNĐ

// ── Component PIN pad 6 số ────────────────────────────────────────────────────
function PinInput({ value, onChange, label = 'Mã PIN 6 số' }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••••"
        className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-11 text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
      />
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Modal Nạp token ───────────────────────────────────────────────────────────
function TopupModal({ onClose, onSuccess }) {
  const [vndInput, setVndInput]   = useState('');
  const [pin, setPin]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const selectedVnd = Number(String(vndInput).replace(/\D/g, '')) || 0;
  const tokenAmount = Math.floor(selectedVnd / TOKEN_TO_VND);

  const handlePreset = (vnd) => {
    setVndInput(vnd.toLocaleString('vi-VN'));
    setError('');
  };

  const validate = () => {
    if (selectedVnd <= 0) return 'Vui lòng nhập số tiền';
    if (selectedVnd % 50000 !== 0) return 'Số tiền phải chia hết cho 50.000 VNĐ';
    if (pin.length < 6) return 'Nhập đủ 6 số PIN';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await walletApi.topUp(tokenAmount, pin);
      toast.success(`Nạp thành công ${tokenAmount.toLocaleString('vi-VN')} token!`);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Nạp tiền thất bại');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Nạp Token" icon="💳" onClose={onClose}>
      {/* Preset buttons */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">Chọn mệnh giá nhanh (VNĐ)</p>
        <div className="grid grid-cols-2 gap-2">
          {TOPUP_PRESETS?.map(v => (
            <button key={v} onClick={() => handlePreset(v)}
              className={`h-11 rounded-xl text-sm font-semibold border-2 transition-colors
                ${selectedVnd === v
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400'}`}>
              {v.toLocaleString('vi-VN')}₫
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <label className="text-xs text-gray-500 font-medium">Hoặc nhập số khác (VNĐ)</label>
        <input
          type="text"
          inputMode="numeric"
          value={vndInput}
          onChange={e => {
            const raw = e.target.value.replace(/\D/g, '');
            setVndInput(raw ? Number(raw).toLocaleString('vi-VN') : '');
            setError('');
          }}
          placeholder="0"
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-11 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        {selectedVnd > 0 && (
          <p className="text-xs text-blue-600 mt-1 text-right font-medium">
            = {tokenAmount.toLocaleString('vi-VN')} token
          </p>
        )}
      </div>

      <PinInput value={pin} onChange={setPin} />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full h-12 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50">
        {loading ? 'Đang xử lý...' : `💳 Nạp ${tokenAmount > 0 ? tokenAmount.toLocaleString('vi-VN') + ' token' : ''}`}
      </button>
    </Modal>
  );
}

// ── Modal Quyên góp ───────────────────────────────────────────────────────────
function DonateModal({ onClose, onSuccess, balance }) {
  const [provinces, setProvinces] = useState([]);
  const [province, setProvince]   = useState('');
  const [amount, setAmount]       = useState('');
  const [pin, setPin]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    walletApi.getActiveProvinces()
      .then(r => setProvinces(r.data))
      .catch(() => setProvinces([]));
  }, []);

  const tokenAmt = Number(amount) || 0;
  const vnd = tokenAmt * TOKEN_TO_VND;

  const validate = () => {
    if (!province) return 'Chọn tỉnh/thành muốn quyên góp';
    if (tokenAmt <= 0) return 'Nhập số token muốn quyên góp';
    if (balance !== null && tokenAmt > balance) return `Số dư ví không đủ (hiện có ${balance?.toLocaleString('vi-VN')} token)`;
    if (pin.length < 6) return 'Nhập đủ 6 số PIN';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await walletApi.donate(province, tokenAmt, pin);
      toast.success(`Quyên góp thành công ${tokenAmt.toLocaleString('vi-VN')} token cho ${province}!`);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Quyên góp thất bại');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Quyên Góp" icon="🤝" onClose={onClose}>
      {/* Chọn tỉnh */}
      <div>
        <label className="text-xs text-gray-500 font-medium">Tỉnh/Thành nhận quyên góp</label>
        <select value={province} onChange={e => { setProvince(e.target.value); setError(''); }}
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
          <option value="">-- Chọn tỉnh/thành --</option>
          {provinces?.map(p => (
            <option key={p.province} value={p.province}>{p.province}</option>
          ))}
        </select>
        {provinces.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Đang tải danh sách tỉnh...</p>
        )}
      </div>

      {/* Số token */}
      <div>
        <label className="text-xs text-gray-500 font-medium">Số token quyên góp</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(''); }}
          placeholder="0"
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-11 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        {tokenAmt > 0 && (
          <p className="text-xs text-green-600 mt-1 text-right font-medium">
            ≈ {vnd.toLocaleString('vi-VN')} VNĐ
          </p>
        )}
      </div>

      <PinInput value={pin} onChange={setPin} />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full h-12 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50">
        {loading ? 'Đang xử lý...' : `🤝 Quyên góp${tokenAmt > 0 ? ' ' + tokenAmt.toLocaleString('vi-VN') + ' token' : ''}`}
      </button>
    </Modal>
  );
}

// ── Modal Rút token ───────────────────────────────────────────────────────────
function WithdrawModal({ onClose, onSuccess, balance }) {
  const [amount, setAmount] = useState('');
  const [pin, setPin]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const tokenAmt = Number(String(amount).replace(/\D/g, '')) || 0;
  const vnd = tokenAmt * TOKEN_TO_VND;

  const validate = () => {
    if (tokenAmt <= 0) return 'Nhập số token muốn rút';
    if (balance !== null && tokenAmt > balance) return `Số dư không đủ (hiện có ${balance?.toLocaleString('vi-VN')} token)`;
    if (pin.length < 6) return 'Nhập đủ 6 số PIN';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await walletApi.withdraw(tokenAmt, pin);
      toast.success(`Rút thành công! Nhận ${vnd.toLocaleString('vi-VN')} VNĐ`);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || 'Rút tiền thất bại');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Rút Token" icon="💰" onClose={onClose}>
      {/* Số dư hiện tại */}
      {balance !== null && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-blue-700">Số dư hiện tại</span>
          <span className="font-bold text-blue-800">{balance.toLocaleString('vi-VN')} token</span>
        </div>
      )}

      {/* Số token muốn rút */}
      <div>
        <label className="text-xs text-gray-500 font-medium">Số token muốn rút</label>
        <input
          type="number"
          min="1"
          max={balance || undefined}
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(''); }}
          placeholder="0"
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 h-11 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
        {tokenAmt > 0 && (
          <p className="text-xs text-amber-600 mt-1 text-right font-medium">
            = {vnd.toLocaleString('vi-VN')} VNĐ (tỷ lệ 1:1.000)
          </p>
        )}
      </div>

      <PinInput value={pin} onChange={setPin} />

      <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-700">
        ℹ️ Tính năng mô phỏng. Token sẽ được ghi nhận "Rút tiền mặt tái thiết".
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full h-12 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50">
        {loading ? 'Đang xử lý...' : `💰 Rút${tokenAmt > 0 ? ' ' + tokenAmt.toLocaleString('vi-VN') + ' token' : ''}`}
      </button>
    </Modal>
  );
}

// ── CitizenHome ───────────────────────────────────────────────────────────────
export default function CitizenHome() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // 'topup' | 'donate' | 'withdraw'
  const [refreshKey, setRefreshKey] = useState(0);

  const loadBalance = useCallback(() => {
    setLoading(true);
    walletApi.getTransactions()
      .then(r => {
        const bal = r.data.reduce((sum, tx) => {
          let txAmt = Number(tx.amount || 0);
          if (tx.toUserId === user?.userId) return sum + txAmt;
          if (tx.fromUserId === user?.userId) return sum - txAmt;
          
          if (tx.type === 'IN') return sum + txAmt;
          if (tx.type === 'OUT') return sum - txAmt;
          return sum;
        }, 0);
        setBalance(Math.max(0, bal));
      })
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { loadBalance(); }, [loadBalance, refreshKey]);

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
    loadBalance();
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Xin chào 👋</h1>
          <p className="text-sm text-gray-500">{user?.fullName || user?.username}</p>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          Đăng xuất
        </button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl p-5 mb-4 shadow-lg">
        <p className="text-sm opacity-80 mb-1">Số dư ví</p>
        {loading ? (
          <div className="h-9 w-40 bg-blue-600 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-bold">
            {balance !== null ? balance.toLocaleString('vi-VN') : '---'}
            <span className="text-base font-normal ml-2 opacity-80">token</span>
          </p>
        )}
        {balance !== null && (
          <p className="text-sm opacity-70 mt-1">
            ≈ {(balance * TOKEN_TO_VND).toLocaleString('vi-VN')} VNĐ
          </p>
        )}
        <p className="text-xs opacity-50 mt-2 font-mono truncate">{user?.walletAddress}</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ActionBtn icon="💳" label="Nạp Token"   color="blue"   onClick={() => setModal('topup')} />
        <ActionBtn icon="🤝" label="Quyên Góp"   color="green"  onClick={() => setModal('donate')} />
        <ActionBtn icon="💰" label="Rút Token"    color="amber"  onClick={() => setModal('withdraw')} />
      </div>

      {/* Transaction history */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-700">Giao dịch gần nhất</h2>
        <Link to="/history" className="text-xs text-blue-600 font-medium hover:underline">
          Xem tất cả →
        </Link>
      </div>
      <TransactionLedger key={refreshKey} limit={5} />

      {/* Modals */}
      {modal === 'topup'    && <TopupModal    onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === 'donate'   && <DonateModal   onClose={() => setModal(null)} onSuccess={handleSuccess} balance={balance} />}
      {modal === 'withdraw' && <WithdrawModal onClose={() => setModal(null)} onSuccess={handleSuccess} balance={balance} />}
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick }) {
  const colors = {
    blue:  'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100',
  };
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 font-medium text-xs transition-colors ${colors[color]}`}>
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  );
}
