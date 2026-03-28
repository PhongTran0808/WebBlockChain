import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

// Danh sách 63 tỉnh thành Việt Nam
const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội',
  'Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên',
  'Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn',
  'Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận',
  'Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh',
  'Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
  'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh',
  'Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

// Searchable Province Select
function ProvinceSelect({ value, onChange, campaigns }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Đồng bộ khi value thay đổi từ ngoài
  useEffect(() => { setQuery(value); }, [value]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = PROVINCES.filter(p => p.toLowerCase().includes(query.toLowerCase()));

  const select = (p) => {
    setQuery(p);
    onChange(p);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-48">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Tìm tỉnh/thành phố..."
        className="w-full border rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 top-11 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(p => {
            const camp = campaigns.find(c => c.province === p);
            return (
              <li key={p} onMouseDown={() => select(p)}
                className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                <span>{p}</span>
                {camp && (
                  <span className="text-xs text-gray-400">{camp.totalFund?.toLocaleString()} token</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Confirm Modal
function ConfirmModal({ province, amount, citizenCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <h3 className="font-bold text-lg text-gray-800">Xác nhận Giải ngân</h3>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800 leading-relaxed">
          Bạn chuẩn bị giải ngân{' '}
          <span className="font-bold text-amber-900">{Number(amount).toLocaleString()} token</span>
          {' '}cho{' '}
          <span className="font-bold text-amber-900">{citizenCount ?? '?'} người</span>
          {' '}tại{' '}
          <span className="font-bold text-amber-900">{province}</span>.
          <br /><br />
          <span className="text-red-600 font-semibold">⛓ Lưu ý: Giao dịch trên Blockchain không thể hoàn tác. Bạn có chắc chắn?</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 h-11 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors">
            Đồng ý, Giải ngân
          </button>
          <button onClick={onCancel}
            className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
            Huỷ bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [province, setProvince] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [citizenCountMap, setCitizenCountMap] = useState({}); // province → count

  const loadCampaigns = () =>
    adminApi.getCampaigns().then(r => setCampaigns(r.data)).catch(() => {});

  useEffect(() => {
    loadCampaigns();
    // Lấy tổng số citizen theo tỉnh từ danh sách users
    adminApi.getUsers().then(r => {
      const map = {};
      r.data.filter(u => u.role === 'CITIZEN').forEach(u => {
        if (u.province) map[u.province] = (map[u.province] || 0) + 1;
      });
      setCitizenCountMap(map);
    }).catch(() => {});
  }, []);

  // Tự động tính token/người khi chọn tỉnh
  const handleProvinceChange = (p) => {
    setProvince(p);
    if (!p) return;
    const count = citizenCountMap[p] || 0;
    const camp = campaigns.find(c => c.province === p);
    if (camp && camp.totalFund && count > 0) {
      setAmount(String(Math.floor(camp.totalFund / count)));
    }
  };

  const selectedCampaign = campaigns.find(c => c.province === province);
  const citizenCount = province ? (citizenCountMap[province] ?? null) : null;

  const handleAirdropClick = () => {
    if (!province || !amount) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await adminApi.airdrop(province, Number(amount));
      toast.success(`Đã giải ngân cho ${res.data.count} Citizen tại ${province}`);
      loadCampaigns();
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Quản lý Chiến dịch</h2>

      {/* Campaign table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {['Tỉnh/Thành', 'Tổng quỹ (token)', 'Tổng số người', 'Cập nhật'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.province}</td>
                <td className="px-4 py-3">{c.totalFund?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {citizenCountMap[c.province] != null
                    ? <span className="font-medium text-blue-700">{citizenCountMap[c.province].toLocaleString()}</span>
                    : <span className="text-gray-400">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{c.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {campaigns.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Chưa có chiến dịch nào</p>
        )}
      </div>

      {/* Airdrop form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-1">Giải ngân đồng loạt</h3>
        {province && citizenCount != null && (
          <p className="text-xs text-blue-600 mb-3">
            📊 {province}: <span className="font-semibold">{citizenCount.toLocaleString()} người</span>
            {selectedCampaign?.totalFund && amount
              ? ` · Tổng giải ngân: ${(Number(amount) * citizenCount).toLocaleString()} token`
              : ''}
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <ProvinceSelect value={province} onChange={handleProvinceChange} campaigns={campaigns} />
          <input
            type="number"
            placeholder="Số token/người"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border rounded-lg px-3 h-10 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAirdropClick}
            disabled={loading}
            className="px-5 h-10 bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-800 transition-colors">
            {loading ? 'Đang xử lý...' : '⚡ Giải ngân đồng loạt'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          province={province}
          amount={amount}
          citizenCount={citizenCount}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
