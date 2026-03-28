import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { orderApi } from '../../api/orderApi';
import PinModal from '../../components/ui/PinModal';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function ReliefMart() {
  const [items, setItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.getPublicItems(),
      orderApi.getShops(),
    ])
      .then(([itemsRes, shopsRes]) => {
        setItems(itemsRes.data.filter(i => i.status === 'ACTIVE'));
        setShops(shopsRes.data);
        // Tự động chọn shop đầu tiên nếu chỉ có 1
        if (shopsRes.data.length === 1) setSelectedShopId(shopsRes.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = (item) => {
    if (!selectedShopId) {
      toast.error('Vui lòng chọn cửa hàng trước');
      return;
    }
    setSelectedItem(item);
    setShowPin(true);
  };

  const handleConfirm = async (pin) => {
    setShowPin(false);
    try {
      await orderApi.createOrder({ itemId: selectedItem.id, shopId: selectedShopId, pin });
      toast.success('Đã đặt hàng, chờ vận chuyển');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đặt hàng thất bại';
      toast.error(msg);
    } finally {
      setSelectedItem(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Cửa hàng Cứu trợ</h2>

      {/* Chọn cửa hàng */}
      {shops.length > 1 && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Chọn cửa hàng</label>
          <select
            value={selectedShopId || ''}
            onChange={e => setSelectedShopId(Number(e.target.value))}
            className="w-full border rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">-- Chọn cửa hàng --</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>
                {s.fullName}{s.province ? ` (${s.province})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {shops.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-700">
          Hiện chưa có cửa hàng nào hoạt động. Vui lòng thử lại sau.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-4xl">📦</div>
              )}
              <div className="p-3">
                <p className="font-medium text-gray-800 text-sm mb-1">{item.name}</p>
                <p className="text-blue-600 font-bold text-sm mb-3">{item.priceTokens} token</p>
                <button
                  onClick={() => handleOrder(item)}
                  disabled={shops.length === 0}
                  className="w-full h-10 bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-40">
                  Đặt hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPin && (
        <PinModal
          title={`Xác nhận đặt: ${selectedItem?.name}`}
          onConfirm={handleConfirm}
          onCancel={() => { setShowPin(false); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}
