import { useEffect, useState } from 'react';
import { orderApi } from '../../api/orderApi';
import SwipeAction from '../../components/ui/SwipeAction';
import TransactionLedger from '../../components/ui/TransactionLedger';
import toast from 'react-hot-toast';

export default function TaskList() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pickup'); // 'pickup' | 'delivering' | 'ledger'

  const load = () => orderApi.getOrders().then(r => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const readyOrders = orders.filter(o => o.status === 'READY');
  const inTransitOrders = orders.filter(o => o.status === 'IN_TRANSIT');

  const handlePickup = async (id) => {
    try {
      await orderApi.markPickup(id);
      toast.success('Đã nhận đơn');
      load();
    } catch {}
  };

  const displayed = tab === 'pickup' ? readyOrders : inTransitOrders;

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          ['pickup', 'Chờ lấy hàng', readyOrders.length],
          ['delivering', 'Đang giao', inTransitOrders.length],
          ['ledger', 'Sao kê', 0],
        ].map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors
              ${tab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
            {count > 0 && <span className="ml-1 bg-white/30 px-1.5 rounded-full text-xs">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'ledger' ? (
        <TransactionLedger />
      ) : (
        <div className="space-y-3">
          {displayed.map(o => (
            <SwipeAction key={o.id} label="Vuốt để nhận" onConfirm={() => tab === 'pickup' && handlePickup(o.id)}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">Đơn #{o.id}</p>
                    <p className="text-sm text-gray-600 mt-0.5">👤 {o.citizenName}</p>
                    <p className="text-sm text-gray-500">🏪 {o.shopName}</p>
                  </div>
                  <p className="text-blue-600 font-bold">{o.totalTokens} token</p>
                </div>
              </div>
            </SwipeAction>
          ))}
          {displayed.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Không có đơn hàng</p>
          )}
        </div>
      )}
    </div>
  );
}
