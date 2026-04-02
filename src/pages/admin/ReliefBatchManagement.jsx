import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { batchApi } from '../../api/batchApi';
import { adminApi } from '../../api/adminApi';

const STATUS_META = {
  CREATED:          { label: 'Chờ TNV nhận',    color: 'bg-gray-100 text-gray-600'     },
  WAITING_SHOP:     { label: 'Chờ Shop duyệt',  color: 'bg-amber-100 text-amber-700'   },
  SHOP_REJECTED:    { label: 'Shop từ chối',    color: 'bg-red-100 text-red-600'       },
  ACCEPTED:         { label: 'Shop đã duyệt',   color: 'bg-blue-100 text-blue-700'     },
  PICKED_UP:        { label: 'TNV đã lấy hàng', color: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS:      { label: 'Đang phân phát',  color: 'bg-orange-100 text-orange-700' },
  COMPLETED:        { label: 'Hoàn thành',      color: 'bg-green-100 text-green-700'   },
  RETURNED_TO_SHOP: { label: '↩️ Trả về Shop',  color: 'bg-gray-100 text-gray-600'     },
};

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

function CreateBatchModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [provinceStats, setProvinceStats] = useState(null); // { totalCitizens, availableTokens }
  const [statsLoading, setStatsLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // [{ item, quantity }]
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getItems().then(r => setCatalogItems(r.data.filter(i => i.status === 'ACTIVE'))).catch(() => {});
  }, []);

  // Bước 1: Khi chọn tỉnh → gọi API thống kê
  const handleProvinceChange = async (p) => {
    setProvince(p);
    setProvinceStats(null);
    if (!p) return;
    setStatsLoading(true);
    try {
      const res = await batchApi.getProvinceStats(p);
      setProvinceStats(res.data);
    } catch { setProvinceStats(null); }
    finally { setStatsLoading(false); }
  };

  // Bước 2: Thêm/xóa vật phẩm
  const addItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(si => si.item.id === item.id);
      if (exists) return prev.map(si => si.item.id === item.id ? {...si, quantity: si.quantity + 1} : si);
      return [...prev, { item, quantity: 1 }];
    });
    setShowItemPicker(false);
  };

  const removeItem = (itemId) => setSelectedItems(prev => prev.filter(si => si.item.id !== itemId));
  const updateQty = (itemId, qty) => {
    if (qty < 1) return;
    setSelectedItems(prev => prev.map(si => si.item.id === itemId ? {...si, quantity: qty} : si));
  };

  // Bước 3: Tính toán tự động
  const tokenPerPackage = selectedItems.reduce((sum, si) => sum + si.item.priceTokens * si.quantity, 0);
  const totalPackages = provinceStats?.totalCitizens || 0;
  const totalCost = tokenPerPackage * totalPackages;
  const availableTokens = provinceStats?.availableTokens || 0;
  const deficit = totalCost - availableTokens;
  const overBudget = totalCost > 0 && availableTokens > 0 && deficit > 0;
  const canSubmit = name && province && selectedItems.length > 0 && totalPackages > 0 && !overBudget && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await batchApi.createBatch({
        name,
        province,
        items: selectedItems.map(si => ({ itemId: si.item.id, quantity: si.quantity })),
      });
      toast.success('Đã tạo lô cứu trợ');
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tạo lô thất bại');
    } finally { setSaving(false); }
  };

  const availableToAdd = catalogItems.filter(i => !selectedItems.find(si => si.item.id === i.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">🆕 Tạo Lô Cứu Trợ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {/* Tên lô */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Tên gói cứu trợ</label>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="VD: Gói Sinh Tồn Đợt 1"
              className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Bước 1: Chọn tỉnh */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mr-2">1</span>
              Chọn Tỉnh/Thành phố
            </label>
            <select required value={province} onChange={e => handleProvinceChange(e.target.value)}
              className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- Chọn tỉnh --</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {statsLoading && (
              <p className="text-xs text-gray-400 mt-1.5 animate-pulse">Đang tải thống kê...</p>
            )}
            {provinceStats && !statsLoading && (
              <div className="mt-2 bg-blue-50 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-blue-700">
                  👥 <span className="font-bold">{provinceStats.totalCitizens.toLocaleString()}</span> người dân
                  &nbsp;·&nbsp;
                  💰 Ngân sách: <span className="font-bold">{provinceStats.availableTokens.toLocaleString()}</span> token
                </span>
              </div>
            )}
            {province && !statsLoading && provinceStats?.totalCitizens === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">⚠️ Tỉnh này chưa có người dân nào trong hệ thống</p>
            )}
          </div>

          {/* Bước 2: Combo vật phẩm */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mr-2">2</span>
              Danh sách vật phẩm trong gói
            </label>

            {selectedItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
                Chưa có vật phẩm nào. Bấm "+ Thêm" để chọn.
              </div>
            ) : (
              <div className="space-y-2 mb-2">
                {selectedItems.map(si => (
                  <div key={si.item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{si.item.name}</p>
                      <p className="text-xs text-gray-500">{si.item.priceTokens} token/cái</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => updateQty(si.item.id, si.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{si.quantity}</span>
                      <button type="button" onClick={() => updateQty(si.item.id, si.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300">+</button>
                    </div>
                    <span className="text-xs font-bold text-blue-700 w-20 text-right shrink-0">
                      {(si.item.priceTokens * si.quantity).toLocaleString()} tk
                    </span>
                    <button type="button" onClick={() => removeItem(si.item.id)}
                      className="text-red-400 hover:text-red-600 text-lg shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Item picker */}
            {showItemPicker ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Chọn vật phẩm</span>
                  <button type="button" onClick={() => setShowItemPicker(false)} className="text-gray-400 text-sm">✕</button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {availableToAdd.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">Đã thêm tất cả vật phẩm</p>
                  ) : availableToAdd.map(i => (
                    <button key={i.id} type="button" onClick={() => addItem(i)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 text-left border-t border-gray-100 first:border-0">
                      <span className="text-sm text-gray-800">{i.name}</span>
                      <span className="text-xs text-blue-600 font-medium">{i.priceTokens} token</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowItemPicker(true)}
                className="w-full h-10 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
                + Thêm vật phẩm
              </button>
            )}
          </div>

          {/* Bước 3: Tóm tắt tự động */}
          {selectedItems.length > 0 && totalPackages > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mr-2">3</span>
                Tóm tắt tự động
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số lượng phần (= số dân)</span>
                <span className="font-bold text-gray-800">{totalPackages.toLocaleString()} phần 🔒</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Token cho 1 người</span>
                <span className="font-bold text-blue-700">{tokenPerPackage.toLocaleString()} token</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-gray-700">TỔNG CHI PHÍ LÔ HÀNG</span>
                <span className="font-bold text-lg text-gray-900">{totalCost.toLocaleString()} token</span>
              </div>
            </div>
          )}

          {/* Bước 4: Cảnh báo ngân sách */}
          {overBudget && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl px-4 py-3">
              <p className="text-red-700 font-bold text-sm">
                ⚠️ Ngân sách tỉnh không đủ! Thiếu{' '}
                <span className="text-red-900">{deficit.toLocaleString()} token</span>.
                Vui lòng giảm bớt vật phẩm.
              </p>
              <p className="text-xs text-red-500 mt-1">
                Cần: {totalCost.toLocaleString()} · Có: {availableTokens.toLocaleString()}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={!canSubmit}
              className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-colors
                ${canSubmit
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {saving ? 'Đang tạo...' : canSubmit ? '✅ Tạo lô cứu trợ' : 'Điền đầy đủ thông tin'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200">
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReliefBatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    batchApi.getAllBatches()
      .then(r => setBatches(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filterStatus === 'ALL'
    ? batches
    : batches.filter(b => b.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Lô Cứu Trợ</h2>
        <button onClick={() => setShowCreate(true)}
          className="px-4 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
          + Tạo lô mới
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', ...Object.keys(STATUS_META)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors
              ${filterStatus === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'ALL' ? 'Tất cả' : STATUS_META[s]?.label}
            {s !== 'ALL' && (
              <span className="ml-1 opacity-70">({batches.filter(b => b.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">Chưa có lô cứu trợ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(b => {
            const meta = STATUS_META[b.status] || STATUS_META.CREATED;
            const progress = b.totalPackages > 0 ? (b.deliveredCount / b.totalPackages) * 100 : 0;
            return (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{b.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">📍 {b.province}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-blue-700">{b.tokenPerPackage} token/phần</p>
                    <p className="text-gray-400">{b.deliveredCount}/{b.totalPackages} phần</p>
                  </div>
                </div>
                {b.transporterName && <p className="text-xs text-gray-500">🚚 TNV: {b.transporterName}</p>}
                {b.shopName && <p className="text-xs text-gray-500">🏪 Shop: {b.shopName}</p>}
                {b.itemName && <p className="text-xs text-gray-500">📦 Vật phẩm: {b.itemName}</p>}
                {b.batchItems && b.batchItems.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {b.batchItems.map(bi => (
                      <span key={bi.itemId} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {bi.itemName} ×{bi.quantity}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }} />
                </div>
                {b.status === 'CREATED' && (
                  <button
                    onClick={async () => {
                      if (!confirm('Xóa lô này?')) return;
                      try {
                        await batchApi.deleteBatch(b.id);
                        toast.success('Đã xóa lô');
                        load();
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Xóa thất bại');
                      }
                    }}
                    className="mt-2 text-xs text-red-500 hover:underline">
                    Xóa lô
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateBatchModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </div>
  );
}
