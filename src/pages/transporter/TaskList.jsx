import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import TransactionLedger from '../../components/ui/TransactionLedger';

const STATUS_META = {
  READY:      { label: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-700'    },
  IN_TRANSIT: { label: 'Đang giao',    color: 'bg-purple-100 text-purple-700' },
  DELIVERED:  { label: 'Đã giao',      color: 'bg-green-100 text-green-700'   },
};

export default function TaskList() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' | 'done' | 'ledger'
  const navigate = useNavigate();

  const load = useCallback(() => {
    orderApi.getOrders().then(r => setOrders(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const readyOrders     = orders.filter(o => o.status === 'READY');
  const inTransitOrders = orders.filter(o => o.status === 'IN_TRANSIT');
  const doneOrders      = orders.filter(o => o.status === 'DELIVERED');

  const activeOrders = [...inTransitOrders, ...readyOrders];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Nhiệm vụ giao hàng</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          ['Chờ lấy', readyOrders.length, 'bg-blue-50 text-blue-700'],
          ['Đang giao', inTransitOrders.length, 'bg-purple-50 text-purple-700'],
          ['Đã giao', doneOrders.length, 'bg-green-50 text-green-700'],
        ].map(([label, count, cls]) => (
          <div key={label} className={`rounded-xl p-3 text-center ${cls}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[['active','Đang hoạt động'],['done','Đã hoàn thành'],['ledger','Sao kê']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 h-9 rounded-xl text-xs font-medium transition-colors
              ${tab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'ledger' && <TransactionLedger />}

      {tab === 'active' && (
        <div className="space-y-3">
          {activeOrders.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Không có đơn hàng nào</p>
          )}
          {activeOrders.map(o => {
            const meta = STATUS_META[o.status];
            return (
              <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">Đơn #{o.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.color}`}>
                        {meta?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">👤 {o.citizenName}</p>
                    <p className="text-sm text-gray-500">🏪 {o.shopName}</p>
                  </div>
                  <span className="text-blue-700 font-bold text-sm">{o.shopPrice ?? o.totalTokens} token</span>
                </div>

                {o.status === 'READY' && (
                  <button
                    onClick={() => navigate('/transporter/scan')}
                    className="w-full h-10 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
                    📦 Quét QR lấy hàng
                  </button>
                )}
                {o.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => navigate('/transporter/scan')}
                    className="w-full h-10 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                    🏠 Quét QR giao hàng
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'done' && (
        <div className="space-y-3">
          {doneOrders.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Chưa có đơn nào hoàn thành</p>
          )}
          {doneOrders.map(o => (
            <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-75">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">Đơn #{o.id}</p>
                  <p className="text-sm text-gray-500">👤 {o.citizenName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã giao</span>
                  <p className="text-sm text-gray-500 mt-1">{o.shopPrice ?? o.totalTokens} token</p>
                </div>
              </div>
              {o.releaseTxHash && (
                <a href={`https://amoy.polygonscan.com/tx/${o.releaseTxHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 font-mono mt-2 block">
                  🔗 {o.releaseTxHash.slice(0, 14)}...
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
