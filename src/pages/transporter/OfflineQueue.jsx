import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import { getQueue, markSynced, clearSynced } from '../../services/offlineQueueService';

export default function OfflineQueue() {
  const [queue, setQueue] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueue();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadQueue = async () => {
    const items = await getQueue();
    setQueue(items);
  };

  const handleSync = async () => {
    if (!online) { toast.error('Không có kết nối mạng'); return; }
    setSyncing(true);
    try {
      const items = queue.map(i => ({
        orderId: i.orderId,
        citizenWalletAddress: i.citizenWalletAddress,
        citizenPin: i.citizenPin,
        scannedAt: i.scannedAt,
      }));
      await orderApi.syncOfflineQueue(items);
      for (const item of queue) await markSynced(item.id);
      await clearSynced();
      toast.success(`Đã đồng bộ ${items.length} giao dịch`);
      loadQueue();
    } catch {} finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Hàng chờ Offline</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      {queue.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Không có giao dịch chờ đồng bộ</p>
      ) : (
        <div className="space-y-3 mb-6">
          {queue.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="font-medium">Đơn #{item.orderId}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{item.citizenWalletAddress?.slice(0, 20)}...</p>
              <p className="text-xs text-gray-400">{item.scannedAt}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSync} disabled={!online || syncing || queue.length === 0}
        className="w-full h-12 bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
        {syncing ? 'Đang đồng bộ...' : `Đồng bộ lên Blockchain (${queue.length})`}
      </button>
    </div>
  );
}
