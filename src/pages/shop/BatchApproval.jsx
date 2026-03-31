import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { batchApi } from '../../api/batchApi';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
  WAITING_SHOP: { label: 'Chờ duyệt',       color: 'bg-amber-100 text-amber-700' },
  ACCEPTED:     { label: 'Đã chấp nhận',     color: 'bg-blue-100 text-blue-700' },
  PICKED_UP:    { label: 'TNV đã lấy',       color: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS:  { label: 'Đang phân phát',   color: 'bg-orange-100 text-orange-700' },
  COMPLETED:    { label: 'Hoàn thành',       color: 'bg-green-100 text-green-700' },
};

/** QR inline với overlay dimmed khi đã lấy */
function BatchQR({ batch, onZoom }) {
  const pickedUp = batch.status === 'PICKED_UP'
    || batch.status === 'IN_PROGRESS'
    || batch.status === 'COMPLETED';

  return (
    <div
      className="relative flex justify-center items-center cursor-pointer select-none"
      onClick={() => !pickedUp && onZoom(batch)}
      title={pickedUp ? 'Đã giao cho Trans' : 'Nhấn để phóng to'}
    >
      <div className={pickedUp ? 'opacity-40 pointer-events-none' : ''}>
        <QRCodeCanvas
          value={`BATCH:${batch.id}`}
          size={120}
          bgColor="#ffffff"
          fgColor="#1e3a8a"
          level="M"
        />
      </div>
      {pickedUp && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">📦</span>
          <span className="text-xs font-semibold text-purple-700 text-center leading-tight mt-1">
            Đã giao<br/>cho Trans
          </span>
        </div>
      )}
      {!pickedUp && (
        <div className="absolute bottom-0 inset-x-0 flex justify-center">
          <span className="text-[10px] text-blue-500 bg-white/80 px-1 rounded">
            🔍 Nhấn để phóng to
          </span>
        </div>
      )}
    </div>
  );
}

export default function BatchApproval() {
  const { user }         = useAuth();
  const [batches, setBatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [qrBatch, setQrBatch]     = useState(null);   // modal zoom QR
  const [processing, setProcessing] = useState(null);
  const [detailBatch, setDetailBatch] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    batchApi.getShopAll()
      .then(r => setBatches(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (id) => {
    setProcessing(id);
    try {
      const res = await batchApi.acceptBatch(id);
      toast.success('Đã chấp nhận lô cứu trợ');
      setBatches(prev => prev.map(b => b.id === id ? res.data : b));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await batchApi.rejectBatch(id);
      toast.success('Đã từ chối lô');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setProcessing(null);
    }
  };

  const pendingBatches  = batches.filter(b => b.status === 'WAITING_SHOP');
  const acceptedBatches = batches.filter(b => b.status === 'ACCEPTED');
  const otherBatches    = batches.filter(b => !['WAITING_SHOP','ACCEPTED'].includes(b.status));

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-800">Lô Cứu Trợ</h2>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">🔄 Làm mới</button>
      </div>
      <p className="text-sm text-gray-500 mb-5 font-medium">📍 Địa chỉ: {user?.province || '—'}</p>

      {/* ── 1. LÔ CHỜ DUYỆT ── */}
      {pendingBatches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="font-semibold text-gray-700">Chờ phê duyệt ({pendingBatches.length})</p>
          </div>
          <div className="space-y-3">
            {pendingBatches.map(b => (
              <div key={b.id} className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{b.name}</p>
                    <p className="text-sm text-gray-500">📍 {b.province}</p>
                    <p className="text-sm text-gray-500">🚚 TNV: {b.transporterName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">{b.tokenPerPackage} token/phần</p>
                    <p className="text-sm text-gray-500">{b.totalPackages} phần</p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl px-3 py-2 mb-3 text-xs text-amber-700">
                  🔒 Tiền đã được hệ thống khóa đảm bảo. Vui lòng chuẩn bị hàng trước khi chấp nhận.
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setDetailBatch(b)}
                    className="px-3 h-11 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                    🔍
                  </button>
                  <button onClick={() => handleAccept(b.id)} disabled={processing === b.id}
                    className="flex-1 h-11 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50">
                    ✅ Chấp nhận
                  </button>
                  <button onClick={() => handleReject(b.id)} disabled={processing === b.id}
                    className="flex-1 h-11 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
                    ❌ Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. LÔ ĐÃ CHẤP NHẬN — hiển thị QR inline ── */}
      {acceptedBatches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="font-semibold text-gray-700">Chờ TNV đến lấy hàng ({acceptedBatches.length})</p>
          </div>
          <div className="space-y-3">
            {acceptedBatches.map(b => (
              <div key={b.id} className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-blue-900">{b.name}</p>
                    <p className="text-sm text-blue-600">📍 {b.province}</p>
                    <p className="text-sm text-blue-600">🚚 {b.transporterName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Đã duyệt
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{b.totalPackages} phần</p>
                  </div>
                </div>

                {/* QR inline — nhấn để zoom */}
                <div className="flex flex-col items-center bg-white rounded-xl p-3 mb-3 border border-blue-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    📱 Cho TNV quét mã này để lấy hàng
                  </p>
                  <BatchQR batch={b} onZoom={setQrBatch} />
                  <p className="text-[10px] text-gray-400 font-mono mt-2">BATCH:{b.id}</p>
                </div>

                <button onClick={() => setDetailBatch(b)}
                  className="w-full h-8 bg-white text-blue-600 text-xs rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
                  🔍 Xem chi tiết lô
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. LỊCH SỬ LÔ HÀNG ── */}
      {otherBatches.length > 0 && (
        <div>
          <p className="font-semibold text-gray-600 mb-3 text-sm">Lịch sử lô hàng</p>
          <div className="space-y-3">
            {otherBatches.map(b => {
              const meta = STATUS_META[b.status];
              const progress = b.totalPackages > 0 ? (b.deliveredCount / b.totalPackages) * 100 : 0;
              const showDimQr = b.status === 'PICKED_UP' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED';
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-500">📍 {b.province}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetailBatch(b)}
                        className="text-xs text-blue-600 hover:underline">🔍</button>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.color}`}>
                        {meta?.label}
                      </span>
                    </div>
                  </div>

                  {/* QR mờ cho PICKED_UP / IN_PROGRESS / COMPLETED */}
                  {showDimQr && (
                    <div className="flex justify-center mb-3">
                      <BatchQR batch={b} onZoom={() => {}} />
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mb-2">{b.deliveredCount}/{b.totalPackages} phần đã giao</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {batches.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Chưa có lô cứu trợ nào được giao cho shop</p>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">{detailBatch.name}</h3>
              <button onClick={() => setDetailBatch(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tỉnh/Thành</span>
                <span className="font-medium">📍 {detailBatch.province}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số phần</span>
                <span className="font-medium">{detailBatch.totalPackages} phần</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Token/phần</span>
                <span className="font-bold text-blue-700">{detailBatch.tokenPerPackage} token</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng chi phí</span>
                <span className="font-bold text-green-700">
                  {((detailBatch.tokenPerPackage || 0) * (detailBatch.totalPackages || 0)).toLocaleString()} token
                </span>
              </div>
              {detailBatch.batchItems && detailBatch.batchItems.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📦 Vật phẩm trong gói:</p>
                  <div className="space-y-1.5">
                    {detailBatch.batchItems.map((bi, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">{bi.itemName}</span>
                        <div className="text-right">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            × {bi.quantity}
                          </span>
                          {bi.priceTokens && (
                            <p className="text-xs text-gray-400 mt-0.5">{bi.priceTokens} token/cái</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setDetailBatch(null)}
                className="w-full h-11 bg-gray-100 text-gray-700 rounded-xl font-medium">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Zoom Modal ── */}
      {qrBatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setQrBatch(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">{qrBatch.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Cho TNV quét mã này để lấy hàng</p>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas
                value={`BATCH:${qrBatch.id}`}
                size={220}
                bgColor="#ffffff"
                fgColor="#1e3a8a"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 font-mono mb-4">BATCH:{qrBatch.id}</p>
            <button onClick={() => setQrBatch(null)}
              className="w-full h-11 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
