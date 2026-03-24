import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { orderApi } from '../../api/orderApi';
import PinModal from '../../components/ui/PinModal';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function ReliefMart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    adminApi.getItems()
      .then(r => setItems(r.data.filter(i => i.status === 'ACTIVE')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = (item) => {
    setSelectedItem(item);
    setShowPin(true);
  };

  const handleConfirm = async (pin) => {
    setShowPin(false);
    try {
      // Lấy shop đầu tiên — trong thực tế user chọn shop
      await orderApi.createOrder({ itemId: selectedItem.id, shopId: 1, pin });
      toast.success('Đã đặt hàng, chờ vận chuyển');
    } catch {} finally {
      setSelectedItem(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Cửa hàng Cứu trợ</h2>

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
                <button onClick={() => handleOrder(item)}
                  className="w-full h-10 bg-blue-700 text-white rounded-lg text-sm font-medium">
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
