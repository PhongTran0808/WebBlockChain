import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import TransactionLedger from '../../components/ui/TransactionLedger';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function KpiCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 truncate">{value ?? '—'}</p>
    </div>
  );
}

const TABS = ['Tổng quan', 'Khu vực', 'Sao kê'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [feed, setFeed] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tab, setTab] = useState(0);
  const [confirmingAutoAirdrop, setConfirmingAutoAirdrop] = useState(null);
  const [autoAirdropLoading, setAutoAirdropLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Cần dùng adminApi.getProvinceStats để có remaining
  const loadCampaigns = () => {
    adminApi.getProvinceStats()
      .then(r => setCampaigns(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {});
    adminApi.getLiveFeed().then(r => setFeed(r.data)).catch(() => {});
    loadCampaigns();
  }, []);

  const handleRefresh = async () => {
    setRefreshLoading(true);
    try {
      await Promise.all([
        adminApi.getStats().then(r => setStats(r.data)),
        adminApi.getLiveFeed().then(r => setFeed(r.data)),
        loadCampaigns()
      ]);
      toast.success('Đã làm mới dữ liệu');
    } catch (err) {
      toast.error('Làm mới thất bại');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await adminApi.toggleCampaign(id);
      // toggleCampaign giờ trả về cùng format province-stats
      setCampaigns(prev => prev.map(c => c.id === id ? res.data : c));
      toast.success('Đã cập nhật trạng thái nhận quyên góp');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const handleToggleAutoAirdrop = async (id) => {
    try {
      const res = await adminApi.toggleAutoAirdrop(id);
      setCampaigns(prev => prev.map(c => c.id === id ? res.data.campaign : c));
      toast.success('Đã cập nhật trạng thái phân bổ tự động');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const handleToggleAutoAirdropClick = (campaign) => {
    setConfirmingAutoAirdrop(campaign);
  };

  const handleConfirmAutoAirdrop = async (campaign) => {
    setConfirmingAutoAirdrop(null);
    setAutoAirdropLoading(true);
    const isCurrentlyEnabled = campaign.isAutoAirdrop;
    const toastId = toast.loading(isCurrentlyEnabled ? 'Đang tắt phân bổ tự động...' : 'Đang bật phân bổ tự động và phân chia quỹ...');
    
    try {
      const res = await adminApi.toggleAutoAirdrop(campaign.id);
      
      if (res.data.distributed) {
        toast.success(res.data.distributionMessage || 'Bật phân bổ tự động và phân chia quỹ thành công', { id: toastId, duration: 5000 });
      } else if (!isCurrentlyEnabled && res.data.distributionError) {
        toast.error('Lỗi: ' + res.data.distributionError, { id: toastId, duration: 5000 });
      } else {
        toast.success(isCurrentlyEnabled ? 'Đã tắt phân bổ tự động' : 'Đã bật phân bổ tự động', { id: toastId, duration: 3000 });
      }
      
      // Reload campaigns để button animation hiển thị đúng
      loadCampaigns();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Cập nhật thất bại', { id: toastId, duration: 5000 });
    } finally {
      setAutoAirdropLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Tổng quan hệ thống</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshLoading}
          className="flex items-center gap-2 px-3 h-9 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {refreshLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Đang làm mới...
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Tổng Quỹ (token)" value={stats?.totalFund?.toLocaleString()} icon="💰" />
        <KpiCard label="Tổng Citizen" value={stats?.totalCitizens} icon="👤" />
        <KpiCard label="Shop đã duyệt" value={stats?.approvedShops} icon="🏪" />
        <KpiCard label="Tổng đơn hàng" value={stats?.totalAirdrops} icon="📦" />
      </div>

      <div className="flex border-b border-gray-200 mb-5">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === i ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Giao dịch gần nhất</h3>
          <div className="space-y-3">
            {feed.length === 0 && <p className="text-gray-400 text-sm">Chưa có giao dịch</p>}
            {feed.map(tx => (
              <div key={tx.orderId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">#{tx.orderId} — {tx.citizen}</p>
                  <p className="text-xs text-gray-400">{tx.createdAt}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-blue-600">{tx.tokens} token</span>
                  <p className="text-xs text-gray-400">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          {/* Nút đồng bộ tỉnh mới */}
          <div className="flex justify-end mb-3">
            <button
              onClick={async () => {
                try {
                  const res = await adminApi.syncProvinces();
                  toast.success(res.data.message);
                  loadCampaigns();
                } catch { toast.error('Đồng bộ thất bại'); }
              }}
              className="px-4 h-9 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              🔄 Đồng bộ tỉnh mới
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Khu vực</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Tổng quỹ</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Nhận quyên góp</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Phân bổ tự động</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.province}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{(c.totalFund || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(c.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${c.isReceivingActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${c.isReceivingActive !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleAutoAirdropClick(c)}
                      disabled={autoAirdropLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${c.isAutoAirdrop !== false ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${c.isAutoAirdrop !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Sổ cái hệ thống (Rút gọn)</h3>
            <Link to="/history" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Mở trang Sao kê Toàn diện <span>↗</span>
            </Link>
          </div>
          <TransactionLedger limit={10} />
        </div>
      )}

      {confirmingAutoAirdrop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="font-bold text-lg text-gray-800">
                {confirmingAutoAirdrop.isAutoAirdrop ? 'Tắt' : 'Bật'} Phân bổ Tự động?
              </h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-800 leading-relaxed">
              {confirmingAutoAirdrop.isAutoAirdrop ? (
                <>
                  Bạn sắp <b>TẮT</b> phân bổ tự động cho khu vực <b>{confirmingAutoAirdrop.province}</b>.
                  <br /><br />
                  Sau này, tiền quyên góp sẽ chỉ cộng vào quỹ mà không tự động chia cho người dân.
                </>
              ) : (
                <>
                  Bạn sắp <b>BẬT</b> phân bổ tự động cho khu vực <b>{confirmingAutoAirdrop.province}</b>.
                  <br /><br />
                  <b>Hệ thống sẽ:</b>
                  <br />
                  1. Phân chia toàn bộ quỹ tồn đọng ({(confirmingAutoAirdrop.remaining || 0).toLocaleString()} token) cho người dân <b>NGAY BÂY GIỜ</b>
                  <br />
                  2. Những lần quyên góp sau sẽ tự động chia đều cho người dân
                  <br /><br />
                  <span className="text-blue-600 font-semibold">⛓ Lưu ý: Giao dịch trên Blockchain không thể hoàn tác.</span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleConfirmAutoAirdrop(confirmingAutoAirdrop)}
                disabled={autoAirdropLoading}
                className="flex-1 h-11 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50">
                {autoAirdropLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button onClick={() => setConfirmingAutoAirdrop(null)}
                disabled={autoAirdropLoading}
                className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
