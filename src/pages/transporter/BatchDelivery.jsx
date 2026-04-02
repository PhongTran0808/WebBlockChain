import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { batchApi } from '../../api/batchApi';
import { orderApi } from '../../api/orderApi';
import QrScanner from '../../components/ui/QrScanner';
import ConfettiEffect from '../../components/ui/ConfettiEffect';
import ErrorFlash from '../../components/ui/ErrorFlash';

const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội',
  'Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên',
  'Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn',
  'Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận',
  'Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh',
  'Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
  'Thanh Hóa','Huế','Tiền Giang','TP.HCM','Trà Vinh',
  'Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

const STEPS = { LIST: 'list', CLAIM: 'claim', DELIVER: 'deliver', SUCCESS: 'success' };

export default function BatchDelivery() {
  const [step, setStep]               = useState(STEPS.LIST);
  const [province, setProvince]       = useState('');
  const [available, setAvailable]     = useState([]);
  const [myBatches, setMyBatches]     = useState([]);
  const [shops, setShops]             = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [activeBatch, setActiveBatch] = useState(null);
  const [errorFlash, setErrorFlash]   = useState(0);
  const [confetti, setConfetti]       = useState(false);
  const [processing, setProcessing]   = useState(false);
  const processingRef = useRef(false); // ref để block đồng bộ (synchronous), tránh duplicate call
  const [tab, setTab]                 = useState('available');
  const [detailBatch, setDetailBatch] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  // Per-card scanner: batchId đang mở scanner
  const [scanningBatchId, setScanningBatchId] = useState(null);
  // Lô đã pickup thành công trong session (tránh reload)
  const [pickedUpIds, setPickedUpIds] = useState(new Set());

  const loadData = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      batchApi.getAvailable(province).then(r => setAvailable(r.data)).catch(() => {}),
      batchApi.getMyBatches().then(r => setMyBatches(r.data)).catch(() => {}),
      orderApi.getShops().then(r => setShops(r.data)).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, [province]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Nhận lô ────────────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!selectedShopId) { toast.error('Chọn shop'); return; }
    setProcessing(true);
    try {
      const res = await batchApi.claimBatch(selectedBatch.id, Number(selectedShopId));
      toast.success('Đã nhận lô, chờ Shop xác nhận');
      setMyBatches(prev => [...prev, res.data]);
      setStep(STEPS.LIST);
      setTab('mine');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nhận lô thất bại');
    } finally {
      setProcessing(false);
    }
  };

  // ── Quét QR Shop per-card (pickup) ──────────────────────────────────────
  const handleScanShopQR = async (qrText, batchId) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const res = await batchApi.pickupBatch(batchId, qrText);
      toast.success('✅ Đã lấy hàng tại Shop!');
      setScanningBatchId(null);
      setPickedUpIds(prev => new Set([...prev, batchId]));
      // Cập nhật local state
      setMyBatches(prev => prev.map(b => b.id === batchId ? res.data : b));
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'QR không hợp lệ');
      setErrorFlash(n => n + 1);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  // ── Quét QR Citizen phân phát ────────────────────────────────────────────
  const handleScanCitizen = async (walletAddress) => {
    if (processingRef.current) return;
    if (!walletAddress || walletAddress.length < 10) {
      toast.error('QR không hợp lệ');
      setErrorFlash(n => n + 1);
      return;
    }
    processingRef.current = true;
    setProcessing(true);
    try {
      const res = await batchApi.deliverToOneCitizen(activeBatch.id, walletAddress);
      const updated = res.data;
      setActiveBatch(updated);
      loadData();
      // Kiểm tra lô đã phân phát hết chưa
      if (updated.status === 'COMPLETED') {
        setConfetti(true);
        setStep(STEPS.SUCCESS);
      } else {
        const remaining = updated.totalPackages - updated.deliveredCount;
        toast.success(`✅ Đã giao! Còn ${remaining} phần`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Phân phát thất bại');
      setErrorFlash(n => n + 1);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const inProgressBatches = myBatches.filter(b =>
    ['WAITING_SHOP','SHOP_REJECTED','ACCEPTED','PICKED_UP','IN_PROGRESS'].includes(b.status));

  // ── Trả lô về Shop ────────────────────────────────────────────────────────
  const handleReturnBatch = async (batchId) => {
    if (!window.confirm('Xác nhận trả lô về Shop? Phần chưa phân phát sẽ được hoàn về quỹ tỉnh.')) return;
    try {
      const res = await batchApi.returnBatch(batchId);
      toast.success('Đã trả lô về Shop thành công');
      setMyBatches(prev => prev.map(b => b.id === batchId ? res.data : b));
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Trả lô thất bại');
    }
  };

  // ── Render badge + action cho từng lô trong tab "mine" ────────────────────
  function renderMyBatchCard(b) {
    const isScanning = scanningBatchId === b.id;
    const progress = b.totalPackages > 0 ? (b.deliveredCount / b.totalPackages) * 100 : 0;

    return (
      <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-bold text-gray-800">{b.name}</p>
            <p className="text-sm text-gray-500">📍 {b.province} · 🏪 {b.shopName || '—'}</p>
          </div>
          <StatusBadge status={b.status} pickedUpIds={pickedUpIds} batchId={b.id} />
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {/* SHOP_REJECTED → chọn shop khác */}
        {b.status === 'SHOP_REJECTED' && (
          <div className="mb-2">
            <p className="text-xs text-red-600 mb-2">Shop đã từ chối. Vui lòng chọn shop khác.</p>
            <button onClick={() => { setSelectedBatch(b); setStep(STEPS.CLAIM); }}
              className="w-full h-10 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
              🔄 Chọn Shop khác
            </button>
          </div>
        )}

        {/* ACCEPTED → hiển thị nút Camera per-card */}
        {b.status === 'ACCEPTED' && !pickedUpIds.has(b.id) && (
          <div className="mb-2">
            {!isScanning ? (
              <button
                onClick={() => setScanningBatchId(b.id)}
                className="w-full h-11 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                <span className="text-lg">📷</span>
                Quét QR Shop để lấy hàng
              </button>
            ) : (
              <div className="border-2 border-blue-400 rounded-xl overflow-hidden">
                {/* Header scanner */}
                <div className="bg-blue-700 text-white px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">📷 Quét QR của Shop</span>
                  <button onClick={() => setScanningBatchId(null)} className="text-white/70 hover:text-white text-lg">
                    ✕
                  </button>
                </div>
                <div className="bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                  Yêu cầu Shop mở QR Code lô hàng và quét vào đây
                </div>
                {processing ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
                  </div>
                ) : (
                  <QrScanner
                    onSuccess={(qr) => handleScanShopQR(qr, b.id)}
                    onError={() => setErrorFlash(n => n + 1)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* PICKED_UP hoặc IN_PROGRESS → phân phát + nút trả lô */}
        {(b.status === 'PICKED_UP' || b.status === 'IN_PROGRESS') && (
          <div className="space-y-1.5 mb-0">
            <button onClick={() => { setActiveBatch(b); setStep(STEPS.DELIVER); }}
              className="w-full h-10 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              🏠 Phân phát cho dân ({b.totalPackages - b.deliveredCount} còn lại)
            </button>
            <button onClick={() => handleReturnBatch(b.id)}
              className="w-full h-9 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200">
              📦 Trả lô về Shop (dân không đến nhận đủ)
            </button>
          </div>
        )}

        <button onClick={() => setDetailBatch(b)}
          className="w-full h-8 mt-1 bg-gray-50 text-gray-500 rounded-xl text-xs hover:bg-gray-100 transition-colors">
          🔍 Xem chi tiết lô
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <ErrorFlash trigger={errorFlash} />
      <ConfettiEffect show={confetti} onDone={() => { setConfetti(false); setStep(STEPS.LIST); }} />

      {/* ── LIST ── */}
      {step === STEPS.LIST && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Lô Cứu Trợ</h2>
            <button onClick={loadData} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 h-9 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              Làm mới
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[['available','Lô chờ nhận'],['mine','Lô của tôi']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors
                  ${tab === key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {label}
                {key === 'mine' && inProgressBatches.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    {inProgressBatches.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'available' && (
            <div>
              <select value={province} onChange={e => setProvince(e.target.value)}
                className="w-full border rounded-xl px-3 h-10 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Tất cả tỉnh/thành</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {available.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">Không có lô nào cần giao</p>
              ) : (
                <div className="space-y-3">
                  {available.map(b => (
                    <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{b.name}</p>
                          <p className="text-sm text-gray-500">📍 {b.province}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-700">{b.tokenPerPackage} token/phần</p>
                          <p className="text-xs text-gray-400">{b.totalPackages} phần</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailBatch(b)}
                          className="flex-1 h-10 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                          🔍 Chi tiết
                        </button>
                        <button onClick={() => { setSelectedBatch(b); setStep(STEPS.CLAIM); }}
                          className="flex-1 h-10 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
                          Nhận lô này
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'mine' && (
            <div className="space-y-3">
              {myBatches.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">Chưa nhận lô nào</p>
              )}
              {myBatches.map(b => renderMyBatchCard(b))}
            </div>
          )}
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
                <span className="text-gray-500">Đã giao</span>
                <span className="font-medium">{detailBatch.deliveredCount}/{detailBatch.totalPackages}</span>
              </div>
              {detailBatch.batchItems && detailBatch.batchItems.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📦 Vật phẩm trong gói:</p>
                  <div className="space-y-1.5">
                    {detailBatch.batchItems.map((bi, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">{bi.itemName}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          × {bi.quantity}
                        </span>
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

      {/* ── CLAIM: Chọn shop ── */}
      {step === STEPS.CLAIM && selectedBatch && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStep(STEPS.LIST)} className="text-gray-400 text-2xl">←</button>
            <div>
              <h2 className="font-bold text-gray-800">Chọn Shop lấy hàng</h2>
              <p className="text-xs text-gray-500">{selectedBatch.name} · {selectedBatch.province}</p>
            </div>
          </div>
          <select value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}
            className="w-full border rounded-xl px-3 h-11 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">-- Chọn cửa hàng --</option>
            {shops.map(s => (
              <option key={s.id} value={s.id} disabled={!s.walletAddress}>
                {s.fullName}{s.province ? ` (${s.province})` : ''}{!s.walletAddress ? ' ⚠️ Chưa có ví' : ''}
              </option>
            ))}
          </select>
          {/* Cảnh báo nếu shop được chọn chưa có ví blockchain */}
          {selectedShopId && !shops.find(s => String(s.id) === String(selectedShopId))?.walletAddress && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              ⚠️ Shop này chưa được thiết lập địa chỉ ví Blockchain. Vui lòng chọn shop khác hoặc liên hệ Admin.
            </div>
          )}
          <button onClick={handleClaim}
            disabled={processing || !selectedShopId || !shops.find(s => String(s.id) === String(selectedShopId))?.walletAddress}
            className="w-full h-12 bg-blue-700 text-white rounded-2xl font-semibold disabled:opacity-50">
            {processing ? 'Đang xử lý...' : 'Xác nhận nhận lô'}
          </button>
        </div>
      )}

      {/* ── DELIVER: Quét QR citizen ── */}
      {step === STEPS.DELIVER && activeBatch && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStep(STEPS.LIST)} className="text-gray-400 text-2xl">←</button>
            <div>
              <h2 className="font-bold text-gray-800">Phân phát cho dân</h2>
              <p className="text-xs text-gray-500">
                {activeBatch.name} · {activeBatch.deliveredCount}/{activeBatch.totalPackages} phần
              </p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">
            📱 Yêu cầu người dân mở mã QR cá nhân và quét vào đây
          </div>
          <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-between border border-gray-100">
            <span className="text-sm text-gray-600">Còn lại</span>
            <span className="font-bold text-blue-700 text-lg">
              {activeBatch.totalPackages - activeBatch.deliveredCount} phần
            </span>
          </div>

          {processing ? (
            <div className="flex justify-center items-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              <p className="text-sm text-green-700 animate-pulse">Đang xác nhận Web3...</p>
            </div>
          ) : (
            <QrScanner onSuccess={handleScanCitizen} onError={() => setErrorFlash(n => n + 1)} />
          )}
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === STEPS.SUCCESS && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">🎉</div>
          <h2 className="text-xl font-bold text-gray-800">Lô đã phân phát xong!</h2>
          <p className="text-sm text-gray-500 text-center">
            {activeBatch?.name} — {activeBatch?.totalPackages} phần đã được giao
          </p>
          <button onClick={() => { setStep(STEPS.LIST); setActiveBatch(null); loadData(); }}
            className="mt-4 px-8 h-12 bg-blue-700 text-white rounded-2xl font-semibold hover:bg-blue-800 transition-colors">
            Nhận lô tiếp theo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helper: badge trạng thái ─────────────────────────────────────────────────
function StatusBadge({ status, pickedUpIds, batchId }) {
  if (status === 'ACCEPTED' && pickedUpIds.has(batchId)) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
        ✅ Đã nhận lô
      </span>
    );
  }
  const map = {
    WAITING_SHOP:     { cls: 'bg-amber-100 text-amber-700',   label: 'Chờ Shop duyệt' },
    SHOP_REJECTED:    { cls: 'bg-red-100 text-red-600',       label: '❌ Shop từ chối' },
    ACCEPTED:         { cls: 'bg-blue-100 text-blue-700',     label: '📷 Chưa quét' },
    PICKED_UP:        { cls: 'bg-purple-100 text-purple-700', label: 'Đã lấy hàng' },
    IN_PROGRESS:      { cls: 'bg-purple-100 text-purple-700', label: 'Đang phân phát' },
    COMPLETED:        { cls: 'bg-green-100 text-green-700',   label: 'Hoàn thành' },
    RETURNED_TO_SHOP: { cls: 'bg-gray-100 text-gray-600',     label: '↩️ Đã trả về Shop' },
  };
  const m = map[status] || { cls: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
