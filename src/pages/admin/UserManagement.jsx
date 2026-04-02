import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  CITIZEN: 'bg-blue-100 text-blue-700',
  SHOP: 'bg-green-100 text-green-700',
  TRANSPORTER: 'bg-orange-100 text-orange-700',
};

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Export to CSV
function exportCSV(users) {
  const headers = ['ID', 'Tên đăng nhập', 'Họ tên', 'Role', 'Tỉnh', 'Đã duyệt', 'Ví Blockchain'];
  const rows = users.map(u => [
    u.id, u.username, u.fullName, u.role, u.province || '', u.isApproved ? 'Có' : 'Không',
    u.walletAddress || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Modal set wallet address
function WalletModal({ user, onClose, onSaved }) {
  const [wallet, setWallet] = useState(user.walletAddress || '');
  const [saving, setSaving] = useState(false);
  const isValid = /^0x[0-9a-fA-F]{40}$/.test(wallet);

  const handleSave = async () => {
    if (!isValid) { toast.error('Địa chỉ ví không đúng định dạng'); return; }
    setSaving(true);
    try {
      const res = await adminApi.setWalletAddress(user.id, wallet);
      toast.success(`Đã cập nhật ví cho ${user.fullName}`);
      onSaved(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg mb-1">Cập nhật ví Blockchain</h3>
        <p className="text-sm text-gray-500 mb-4">
          {user.fullName} ({user.role})
        </p>
        <input
          value={wallet}
          onChange={e => setWallet(e.target.value.trim())}
          placeholder="0x1234...abcd (42 ký tự)"
          className={`w-full border rounded-xl px-3 h-11 text-sm font-mono focus:outline-none focus:ring-2 mb-1
            ${wallet && !isValid ? 'border-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`}
        />
        {wallet && !isValid && (
          <p className="text-xs text-red-500 mb-3">Phải bắt đầu bằng 0x và có đúng 42 ký tự</p>
        )}
        {!wallet && <p className="text-xs text-gray-400 mb-3">Nhập địa chỉ ví Ethereum/Polygon</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} disabled={saving || !isValid}
            className="flex-1 h-11 bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu địa chỉ ví'}
          </button>
          <button onClick={onClose}
            className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [approvedFilter, setApprovedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletModal, setWalletModal] = useState(null); // user object hoặc null
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.q = debouncedSearch;
    adminApi.getUsers(params).then(r => setUsers(r.data)).catch(() => {});
  }, [debouncedSearch]);

  const handleToggle = async (id) => {
    try {
      const res = await adminApi.toggleApprove(id);
      setUsers(u => u.map(x => x.id === id ? res.data : x));
      toast.success('Đã cập nhật trạng thái');
    } catch {}
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (approvedFilter === 'APPROVED' && !u.isApproved) return false;
    if (approvedFilter === 'PENDING' && u.isApproved) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Quản lý Người dùng</h2>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', 'ADMIN', 'CITIZEN', 'SHOP', 'TRANSPORTER'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors
              ${roleFilter === r ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-56">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const params = {};
                if (searchQuery) params.q = searchQuery;
                adminApi.getUsers(params).then(r => setUsers(r.data)).catch(() => {});
              }
            }}
            placeholder="Tìm theo tên hoặc số CCCD... (Enter để tìm)"
            className="w-full border rounded-lg pl-8 pr-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>

        <select
          value={approvedFilter}
          onChange={e => setApprovedFilter(e.target.value)}
          className="border rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="APPROVED">✅ Đã duyệt</option>
          <option value="PENDING">⏳ Chưa duyệt</option>
        </select>

        <button
          onClick={() => exportCSV(filtered)}
          className="ml-auto px-4 h-10 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <span>📥</span> Xuất Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {['ID', 'Tên đăng nhập', 'Họ tên', 'Role', 'Tỉnh', 'Ví Blockchain', 'Duyệt'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ''}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.province || '—'}</td>
                <td className="px-4 py-3">
                  {u.walletAddress ? (
                    <button onClick={() => setWalletModal(u)}
                      className="font-mono text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded hover:bg-green-100 transition-colors max-w-[120px] truncate block"
                      title={u.walletAddress}>
                      ✅ {u.walletAddress.slice(0, 8)}...
                    </button>
                  ) : (
                    // Chỉ SHOP và TRANSPORTER mới cần ví để tham gia luồng blockchain
                    (u.role === 'SHOP' || u.role === 'TRANSPORTER') ? (
                      <button onClick={() => setWalletModal(u)}
                        className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded hover:bg-red-100 transition-colors font-medium">
                        ⚠️ Chưa có ví
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(u.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors
                      ${u.isApproved ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${u.isApproved ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Không tìm thấy người dùng nào</p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">
        Hiển thị {filtered.length} / {users.length} người dùng
      </p>

      {/* Modal set wallet */}
      {walletModal && (
        <WalletModal
          user={walletModal}
          onClose={() => setWalletModal(null)}
          onSaved={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setWalletModal(null);
          }}
        />
      )}
    </div>
  );
}
