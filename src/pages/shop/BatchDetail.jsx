import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchApi } from '../../api/batchApi';
import { QRCodeCanvas } from 'qrcode.react';

const STATUS_META = {
  CREATED:       { label: 'Mới tạo',         color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    icon: '📋' },
  WAITING_SHOP:  { label: 'Chờ Shop duyệt',  color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',   icon: '⏳' },
  ACCEPTED:      { label: 'Shop đã duyệt',   color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    icon: '✅' },
  SHOP_REJECTED: { label: 'Shop từ chối',    color: 'bg-red-100 text-red-600',         dot: 'bg-red-500',     icon: '❌' },
  PICKED_UP:     { label: 'TNV đã lấy hàng', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500',  icon: '🚛' },
  IN_PROGRESS:   { label: 'Đang giao',       color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500',  icon: '📦' },
  COMPLETED:     { label: 'Hoàn thành',      color: 'bg-green-100 text-green-700',     dot: 'bg-green-500',   icon: '🎉' },
};

function Skeleton() {
  return (
    <div className="p-4 max-w-2xl mx-auto pb-20 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-9 bg-gray-100 rounded-xl w-28 mb-5" />
      {/* Header card skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 bg-gray-100 rounded w-40" />
            <div className="h-4 bg-gray-50 rounded w-24" />
          </div>
          <div className="h-7 bg-gray-100 rounded-full w-28" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-full mt-3" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-50 rounded w-16" />
          <div className="h-4 bg-gray-50 rounded w-16" />
        </div>
      </div>
      {/* Info card skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-3">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-50 rounded flex-1" />
          </div>
        ))}
      </div>
      {/* Items skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-32 mb-2" />
        {[1,2].map(i => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-50 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrZoom, setQrZoom] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy ID lô hàng.');
      setLoading(false);
      return;
    }

    const fetchBatch = async () => {
      setLoading(true);
      setError(null);
      try {
        // Thử lấy chi tiết trực tiếp (endpoint GET /api/batches/:id)
        const res = await batchApi.getBatchById(id);
        setBatch(res.data);
      } catch (err) {
        // Fallback: Nếu endpoint GET /:id chưa có (404/500), tìm trong danh sách shop/all
        console.warn('getBatchById failed, falling back to getShopAll:', err);
        try {
          const listRes = await batchApi.getShopAll();
          const found = listRes.data.find(b => String(b.id) === String(id));
          if (found) {
            setBatch(found);
          } else {
            setError(`Không tìm thấy lô hàng #${id} trong danh sách của cửa hàng.`);
          }
        } catch (fallbackErr) {
          setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-20">
        <button
          onClick={() => navigate('/shop/orders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Quản lý Đơn hàng
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[batch.status] || STATUS_META.CREATED;
  const progress = batch.totalPackages > 0
    ? Math.round((batch.deliveredCount / batch.totalPackages) * 100)
    : 0;
  const totalTokens = (batch.tokenPerPackage || 0) * (batch.totalPackages || 0);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate('/shop/orders')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại Quản lý Đơn hàng
      </button>

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 ring-1 ring-blue-50 p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Lô tập trung
              </span>
              <span className="font-extrabold text-gray-900 text-lg">#{batch.id}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{batch.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">📍 {batch.province}</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${meta.color}`}>
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            {meta.icon} {meta.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>Tiến độ giao hàng</span>
            <span className="text-green-700 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Đã giao: <span className="font-semibold text-gray-700">{batch.deliveredCount}</span></span>
            <span>Tổng: <span className="font-semibold text-gray-700">{batch.totalPackages}</span> phần</span>
          </div>
        </div>
      </div>

      {/* ── Thông tin chi tiết ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-600 rounded-full inline-block" />
          Thông tin lô hàng
        </h3>
        <div className="space-y-3">
          <InfoRow label="Token/phần" value={`${(batch.tokenPerPackage || 0).toLocaleString()} token`} />
          <InfoRow label="Tổng giá trị" value={`${totalTokens.toLocaleString()} token`} highlight />
          <InfoRow label="Tỉnh/Thành" value={batch.province} />
          {batch.createdAt && (
            <InfoRow label="Ngày tạo" value={new Date(batch.createdAt).toLocaleString('vi-VN')} />
          )}
          {batch.updatedAt && (
            <InfoRow label="Cập nhật" value={new Date(batch.updatedAt).toLocaleString('vi-VN')} />
          )}
        </div>
      </div>

      {/* ── Thông tin TNV ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full inline-block" />
          Tình nguyện viên (TNV)
        </h3>
        {batch.transporterName ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {batch.transporterName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{batch.transporterName}</p>
                <p className="text-xs text-purple-600">ID: #{batch.transporterId}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-medium text-amber-800 text-sm">Chưa có TNV nhận lô</p>
              <p className="text-xs text-amber-600">Lô đang chờ TNV đăng ký giao hàng</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Danh sách vật phẩm ── */}
      {(batch.batchItems?.length > 0 || batch.itemName) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" />
            Vật phẩm trong lô
          </h3>

          {batch.batchItems?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {batch.batchItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {item.itemImageUrl ? (
                      <img src={item.itemImageUrl} alt={item.itemName} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-lg border border-orange-100">📦</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                      <p className="text-xs text-gray-400">{item.priceTokens?.toLocaleString()} token/cái</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-700">
                      ×{(item.quantity || 1) * (batch.totalPackages || 1)}
                    </p>
                    <p className="text-xs text-gray-400">Giành cho {batch.totalPackages} phần</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">({item.quantity} cái/phần)</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="text-lg">📦</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{batch.itemName}</p>
                  {batch.itemImageUrl && (
                    <img src={batch.itemImageUrl} alt={batch.itemName} className="w-12 h-12 rounded-lg object-cover mt-2 border border-gray-100" />
                  )}
                </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-blue-700">×{batch.totalPackages || 1}</p>
                 <p className="text-xs text-gray-400">Giành cho {batch.totalPackages} phần</p>
                 <p className="text-[10px] text-gray-400 mt-0.5">(1 cái/phần)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QR Code lô hàng ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-400 rounded-full inline-block" />
          Mã QR Lô hàng
        </h3>
        <div
          className="flex flex-col items-center cursor-pointer select-none group"
          onClick={() => setQrZoom(true)}
          title="Nhấn để phóng to để TNV quét"
        >
          <div className="p-4 bg-gray-50 rounded-2xl border border-blue-100 group-hover:border-blue-300 transition-colors">
            <QRCodeCanvas
              value={`BATCH:${batch.id}`}
              size={160}
              bgColor="#ffffff"
              fgColor="#1e3a8a"
              level="M"
            />
          </div>
          <p className="text-xs text-blue-500 font-medium mt-3 group-hover:underline">
            🔍 Nhấn để phóng to — Cho TNV quét khi lấy hàng
          </p>
          <p className="text-[11px] text-gray-400 font-mono mt-1">BATCH:{batch.id}</p>
        </div>
      </div>

      {/* ── QR Zoom Modal ── */}
      {qrZoom && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setQrZoom(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-1">Lô hàng #{batch.id}</h3>
            <p className="text-sm text-gray-500 mb-2">{batch.name}</p>
            <p className="text-xs text-gray-400 mb-4">Cho TNV quét mã này để lấy hàng</p>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas
                value={`BATCH:${batch.id}`}
                size={220}
                bgColor="#ffffff"
                fgColor="#1e3a8a"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 font-mono mb-4">BATCH:{batch.id}</p>
            <button
              onClick={() => setQrZoom(false)}
              className="w-full h-11 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className={`font-medium ${highlight ? 'text-blue-700 font-bold' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
