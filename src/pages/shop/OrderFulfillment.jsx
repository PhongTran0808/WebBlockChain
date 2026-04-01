import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import { adminApi } from '../../api/adminApi';
import { QRCodeCanvas } from 'qrcode.react';

const STATUS_META = {
  PENDING:    { label: 'Chờ chuẩn bị', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  READY:      { label: 'Sẵn sàng giao', color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'  },
  IN_TRANSIT: { label: 'Đang giao',     color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  DELIVERED:  { label: 'Đã giao',       color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  CANCELLED:  { label: 'Đã huỷ',        color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'  },
  REFUNDED_LOST: { label: 'Mất hàng',   color: 'bg-red-100 text-red-600',      dot: 'bg-red-500'   },
};

const TABS = ['PENDING', 'READY', 'IN_TRANSIT', 'DELIVERED'];

function ItemName({ itemId }) {
  const [name, setName] = useState(null);
  useEffect(() => {
    if (!itemId) return;
    adminApi.getPublicItems()
      .then(r => {
        const found = r.data.find(i => i.id === itemId);
        setName(found?.name || null);
      })
      .catch(() => {});
  }, [itemId]);
  return <span>{name || `Vật phẩm #${itemId}`}</span>;
}

function OrderQR({ order, onZoom }) {
  return (
    <div
      className="relative flex justify-center items-center cursor-pointer select-none"
      onClick={() => onZoom(order)}
      title="Nhấn để phóng to"
    >
      <QRCodeCanvas
        value={`ORDER:${order.id}`}
        size={120}
        bgColor="#ffffff"
        fgColor="#1e3a8a"
        level="M"
      />
      <div className="absolute bottom-0 inset-x-0 flex justify-center">
        <span className="text-[10px] text-blue-500 bg-white/80 px-1 rounded">
          🔍 Nhấn để phóng to
        </span>
      </div>
    </div>
  );
}

export default function OrderFulfillment() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [readying, setReadying] = useState(null);
  const [qrOrder, setQrOrder] = useState(null); // modal zoom QR

  const load = useCallback(() => {
    setLoading(true);
    orderApi.getOrders()
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReady = async (id) => {
    setReadying(id);
    try {
      await orderApi.markReady(id);
      toast.success('Đã đánh dấu sẵn sàng giao');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setReadying(null);
    }
  };

  const displayed = orders.filter(o => o.status === tab);
  const countByStatus = (s) => orders.filter(o => o.status === s).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quản lý Đơn hàng</h2>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TABS.map(s => {
          const meta = STATUS_META[s];
          const count = countByStatus(s);
          return (
            <button key={s} onClick={() => setTab(s)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-medium whitespace-nowrap transition-colors
                ${tab === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <span className={`w-2 h-2 rounded-full ${tab === s ? 'bg-white/60' : meta.dot}`} />
              {meta.label}
              {count > 0 && (
                <span className={`px-1.5 rounded-full text-xs font-bold
                  ${tab === s ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PENDING banner */}
      {tab === 'PENDING' && displayed.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">🔒</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Tiền đã được hệ thống khóa đảm bảo</p>
            <p className="text-amber-700 text-xs mt-0.5">Vui lòng chuẩn bị hàng và bấm "Sẵn sàng giao" khi xong.</p>
          </div>
        </div>
      )}

      {/* Order list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(o => {
            const meta = STATUS_META[o.status] || STATUS_META.PENDING;
            return (
              <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">Đơn #{o.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-blue-700 font-bold text-sm">{o.shopPrice ?? o.totalTokens} token</span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-20 shrink-0">Vật phẩm</span>
                    <span className="font-medium text-gray-700">
                      <ItemName itemId={o.itemId} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-20 shrink-0">Người nhận</span>
                    <span className="text-gray-700">{o.citizenName || `#${o.citizenId}`}</span>
                  </div>
                  {o.refundAmount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-20 shrink-0">Giá trần</span>
                      <span className="text-gray-500">
                        {o.totalTokens} token
                        <span className="text-green-600 ml-1">(hoàn {o.refundAmount} về quỹ tỉnh)</span>
                      </span>
                    </div>
                  )}
                  {o.lockTxHash && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-20 shrink-0">Escrow TX</span>
                      <a href={`https://amoy.polygonscan.com/tx/${o.lockTxHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 font-mono truncate">
                        🔗 {o.lockTxHash.slice(0, 10)}...
                      </a>
                    </div>
                  )}
                </div>

                {/* Action */}
                {o.status === 'PENDING' && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleReady(o.id)}
                      disabled={readying === o.id}
                      className="w-full h-11 bg-blue-700 text-white rounded-xl text-sm font-semibold
                        hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {readying === o.id
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                        : '✅ Đã chuẩn bị xong — Sẵn sàng giao'}
                    </button>
                  </div>
                )}
                {o.status === 'READY' && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-col items-center bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 mb-2 font-medium">
                        📱 Cho TNV quét mã này để lấy đơn hàng
                      </p>
                      <OrderQR order={o} onZoom={setQrOrder} />
                      <p className="text-[10px] text-gray-400 font-mono mt-2">ORDER:{o.id}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── QR Zoom Modal ── */}
      {qrOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setQrOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Đơn #{qrOrder.id}</h3>
            <p className="text-sm text-gray-500 mb-4">Cho TNV quét mã này để lấy hàng</p>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas
                value={`ORDER:${qrOrder.id}`}
                size={220}
                bgColor="#ffffff"
                fgColor="#1e3a8a"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 font-mono mb-4">ORDER:{qrOrder.id}</p>
            <button onClick={() => setQrOrder(null)}
              className="w-full h-11 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
