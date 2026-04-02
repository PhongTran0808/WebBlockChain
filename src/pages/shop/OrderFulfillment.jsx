import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderApi } from '../../api/orderApi';
import { adminApi } from '../../api/adminApi';
import { batchApi } from '../../api/batchApi';
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

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [orderRes, batchRes] = await Promise.all([
        orderApi.getOrders(),
        batchApi.getShopAll()
      ]);
      
      // Hợp nhất dữ liệu: Đơn lẻ + Lô hàng
      const combined = [
        ...orderRes.data.map(o => ({ ...o, type: 'ORDER' })),
        ...batchRes.data.map(b => ({ 
          ...b, 
          type: 'BATCH',
          // Map status Batch về hệ thống Tab của Order để hiển thị chung
          status: b.status === 'WAITING_SHOP' ? 'PENDING' :
                  b.status === 'ACCEPTED'     ? 'READY'   :
                  (b.status === 'PICKED_UP' || b.status === 'IN_PROGRESS') ? 'IN_TRANSIT' :
                  b.status === 'COMPLETED'    ? 'DELIVERED' : b.status
        }))
      ];
      
      setOrders(combined);
    } catch (err) {
      if (!isSilent) {
        toast.error('Không thể tải danh sách đơn hàng');
      }
      console.error('Order load error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Tự động làm mới mỗi 30 giây để cập nhật trạng thái từ TNV/Dân
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleReady = async (id) => {
    setReadying(id);
    try {
      await orderApi.markReady(id);
      toast.success('Đã đánh dấu sẵn sàng giao');
      load(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setReadying(null);
    }
  };

  const displayed = orders.filter(o => o.status === tab);
  const countByStatus = (s) => orders.filter(o => o.status === s).length;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý Đơn hàng</h2>
        <button 
          onClick={() => load()}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-30"
          title="Tải lại đơn hàng"
        >
          <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

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
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm
                  ${tab === s ? 'bg-white text-blue-700' : 'bg-blue-600 text-white animate-bounce'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Smart Hint if current tab is empty but others have data */}
      {displayed.length === 0 && !loading && TABS.some(s => countByStatus(s) > 0) && (
        <div className="mb-6 animate-pulse">
          {TABS.filter(s => s !== tab && countByStatus(s) > 0).map(s => (
            <button key={s} onClick={() => setTab(s)}
              className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-blue-700 hover:bg-blue-100 transition-all mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">ℹ️</span>
                <div className="text-left">
                   <p className="text-sm font-bold">Bạn có đơn ở mục "{STATUS_META[s].label}"</p>
                   <p className="text-xs opacity-75">Bấm vào đây để xem trạng thái cập nhật mới nhất</p>
                </div>
              </div>
              <span className="font-bold">→</span>
            </button>
          ))}
        </div>
      )}

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
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-100 rounded w-1/4"></div>
                <div className="h-5 bg-gray-100 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-50 rounded w-full"></div>
              <div className="h-4 bg-gray-50 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="text-5xl mb-4 grayscale opacity-50">📦</div>
          <p className="text-gray-900 font-bold text-lg">Hiện tại trống</p>
          <p className="text-gray-400 text-sm mt-1 max-w-[220px] mx-auto">
            Khu vực này hiện chưa có đơn hàng nào {STATUS_META[tab].label.toLowerCase()}.
          </p>
          <button 
            onClick={() => load()}
            className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            Làm mới ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(o => {
            const isBatch = o.type === 'BATCH';
            const meta = STATUS_META[o.status] || STATUS_META.PENDING;
            
            return (
              <div key={`${o.type}-${o.id}`} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isBatch ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${isBatch ? 'bg-blue-50/50 border-blue-100' : 'border-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">
                      {isBatch ? `Lô hàng #${o.id}` : `Đơn #${o.id}`}
                    </span>
                    {isBatch && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Lô tập trung</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                      {isBatch && o.status === 'IN_TRANSIT' ? 'Đang phân phát' : meta.label}
                    </span>
                  </div>
                  <span className="text-blue-700 font-bold text-sm">
                    {isBatch ? `${(o.tokenPerPackage * o.totalPackages).toLocaleString()} token` : `${o.shopPrice ?? o.totalTokens} token`}
                  </span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2">
                  {isBatch ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-400 w-20 shrink-0">Tên lô</span>
                        <span className="font-medium">{o.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-400 w-20 shrink-0">TNV</span>
                        <span className="font-medium text-blue-600">{o.transporterName || 'Đang chờ lấy hàng...'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-400 w-20 shrink-0">Tiến độ</span>
                        <div className="flex-1 flex items-center gap-2">
                           <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700" style={{ width: `${(o.deliveredCount / o.totalPackages) * 100}%` }} />
                           </div>
                           <span className="text-xs font-black text-green-700">{Math.round((o.deliveredCount / o.totalPackages) * 100)}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                {/* Action logic */}
                {o.type === 'ORDER' ? (
                   <>
                    {o.status === 'PENDING' && (
                      <div className="px-4 pb-4">
                        <button onClick={() => handleReady(o.id)} disabled={readying === o.id}
                          className="w-full h-11 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          {readying === o.id ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '✅ Sẵn sàng giao'}
                        </button>
                      </div>
                    )}
                    {o.status === 'READY' && (
                      <div className="px-4 pb-4">
                        <div className="flex flex-col items-center bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <OrderQR order={o} onZoom={setQrOrder} />
                        </div>
                      </div>
                    )}
                   </>
                ) : (
                   <div className="px-4 pb-4">
                      {o.status === 'READY' && (
                        <div className="flex flex-col items-center bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <QRCodeCanvas value={`BATCH:${o.id}`} size={100} fgColor="#1e3a8a" />
                          <p className="text-[10px] text-gray-400 mt-2">Mã QR Lô: {o.id}</p>
                        </div>
                      )}
                      <div className="text-center">
                        <a href="/shop/batches" className="text-xs text-blue-600 font-medium hover:underline">Quản lý chi tiết lô hàng →</a>
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
