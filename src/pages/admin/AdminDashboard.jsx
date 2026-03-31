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
      <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
    </div>
  );
}

const TABS = ['Tổng quan', 'Khu vực', 'Sao kê'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [feed, setFeed] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {});
    adminApi.getLiveFeed().then(r => setFeed(r.data)).catch(() => {});
    adminApi.getCampaigns().then(r => setCampaigns(r.data)).catch(() => {});
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await adminApi.toggleCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? res.data : c));
      toast.success('Đã cập nhật trạng thái nhận quyên góp');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  const handleToggleAutoAirdrop = async (id) => {
    try {
      const res = await adminApi.toggleAutoAirdrop(id);
      // Backend returns Map from getCampaignProvinceStats normally, but here toggle returns CampaignPool
      // We need to reload to keep stats consistent or manually update
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isAutoAirdrop: res.data.isAutoAirdrop } : c));
      toast.success('Đã cập nhật tính năng Phân phát tự động');
    } catch { toast.error('Cập nhật thất bại'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Tổng quan hệ thống</h2>

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Khu vực</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Tổng quỹ</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Nhận quyên góp</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium whitespace-nowrap">Phân phát tự động</th>
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
                    <button onClick={() => handleToggleAutoAirdrop(c.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${c.isAutoAirdrop ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${c.isAutoAirdrop ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <p className={`text-[10px] mt-1 font-bold ${c.isAutoAirdrop ? 'text-blue-600' : 'text-gray-400'}`}>
                      {c.isAutoAirdrop ? 'BẬT' : 'TẮT'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
