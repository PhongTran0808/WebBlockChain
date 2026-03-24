import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';

const STATUS_LABEL = { PENDING: 'Chờ chuẩn bị', READY: 'Sẵn sàng giao', IN_TRANSIT: 'Shipper đã lấy', DELIVERED: 'Đã giao', CANCELLED: 'Đã huỷ' };

export default function OrderFulfillment() {
  const [orders, setOrders] = useState([]);

  const load = () => orderApi.getOrders().then(r => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleReady = async (id) => {
    try {
      await orderApi.markReady(id);
      toast.success('Đã đánh dấu sẵn sàng');
      load();
    } catch {}
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quản lý Đơn hàng</h2>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">Đơn #{o.id}</p>
                <p className="text-sm text-gray-500">{o.citizenName} — {o.totalTokens} token</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {STATUS_LABEL[o.status]}
              </span>
            </div>
            {o.status === 'PENDING' && (
              <button onClick={() => handleReady(o.id)}
                className="w-full h-10 bg-blue-700 text-white rounded-lg text-sm font-medium mt-2">
                Đánh dấu Sẵn sàng
              </button>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Chưa có đơn hàng</p>}
      </div>
    </div>
  );
}
