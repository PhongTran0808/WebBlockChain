import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchApi } from '../../api/batchApi';
import TransactionLedger from '../../components/ui/TransactionLedger';
import toast from 'react-hot-toast';

const STATUS_META = {
  CREATED:       { label: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-700'    },
  WAITING_SHOP:  { label: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-700'    },
  SHOP_REJECTED: { label: 'Bị từ chối',   color: 'bg-red-100 text-red-600'      },
  ACCEPTED:      { label: 'Chờ lấy hàng', color: 'bg-blue-100 text-blue-700'    },
  PICKED_UP:     { label: 'Đang giao',    color: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS:   { label: 'Đang giao',    color: 'bg-purple-100 text-purple-700' },
  COMPLETED:     { label: 'Đã giao',      color: 'bg-green-100 text-green-700'   },
};

export default function TaskList() {
  const [batches, setBatches] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' | 'done' | 'ledger'
  const [refreshLoading, setRefreshLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    batchApi.getMyBatches().then(r => setBatches(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await batchApi.getMyBatches().then(r => setBatches(r.data));
      toast.success('Đã làm mới dữ liệu');
    } catch {
      toast.error('Làm mới thất bại');
    } finally {
      setRefreshLoading(false);
    }
  };

  // Phân loại batch theo status
  const waitingBatches   = batches.filter(b => ['CREATED', 'WAITING_SHOP', 'ACCEPTED'].includes(b.status));
  const inProgressBatches = batches.filter(b => ['PICKED_UP', 'IN_PROGRESS'].includes(b.status));
  const completedBatches  = batches.filter(b => b.status === 'COMPLETED');

  const activeBatches = [...inProgressBatches, ...waitingBatches];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Nhiệm vụ giao hàng</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshLoading}
          className="flex items-center gap-2 px-3 h-9 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {refreshLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Đang...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </>
          )}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          ['Chờ lấy', waitingBatches.length, 'bg-blue-50 text-blue-700'],
          ['Đang giao', inProgressBatches.length, 'bg-purple-50 text-purple-700'],
          ['Đã giao', completedBatches.length, 'bg-green-50 text-green-700'],
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
          {activeBatches.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Không có lô hàng nào</p>
          )}
          {activeBatches.map(b => {
            const meta = STATUS_META[b.status];
            const itemCount = b.batchItems?.length || 0;
            return (
              <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">Lô #{b.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.color}`}>
                        {meta?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{b.name}</p>
                    <p className="text-sm text-gray-500">📍 {b.province}</p>
                    {itemCount > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        📦 {b.deliveredCount || 0} / {itemCount} gói
                      </p>
                    )}
                  </div>
                </div>

                {['CREATED', 'WAITING_SHOP', 'ACCEPTED'].includes(b.status) && (
                  <button
                    onClick={() => navigate('/transporter/scan')}
                    className="w-full h-10 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
                    📦 Quét QR lấy hàng
                  </button>
                )}
                {['PICKED_UP', 'IN_PROGRESS'].includes(b.status) && (
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
          {completedBatches.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Chưa có lô nào hoàn thành</p>
          )}
          {completedBatches.map(b => {
            const itemCount = b.batchItems?.length || 0;
            return (
              <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-75">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">Lô #{b.id}</p>
                    <p className="text-sm text-gray-600">{b.name}</p>
                    <p className="text-sm text-gray-500">📍 {b.province}</p>
                    {itemCount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        📦 {itemCount} gói
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Đã giao</span>
                </div>
                {b.completedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    ✓ Hoàn thành: {new Date(b.completedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
