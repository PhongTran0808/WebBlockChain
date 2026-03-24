import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [province, setProvince] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.getCampaigns().then(r => setCampaigns(r.data)).catch(() => {});
  }, []);

  const handleAirdrop = async () => {
    if (!province || !amount) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const res = await adminApi.airdrop(province, Number(amount));
      toast.success(`Đã giải ngân cho ${res.data.count} Citizen tại ${province}`);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Quản lý Chiến dịch</h2>

      {/* Campaign list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['Tỉnh/Thành','Tổng quỹ (token)','Cập nhật'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium">{c.province}</td>
                <td className="px-4 py-3">{c.totalFund?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400">{c.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Airdrop form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Giải ngân đồng loạt</h3>
        <div className="flex gap-3 flex-wrap">
          <input placeholder="Tỉnh/Thành phố" value={province}
            onChange={e => setProvince(e.target.value)}
            className="border rounded-lg px-3 h-10 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" placeholder="Số token/người" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border rounded-lg px-3 h-10 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleAirdrop} disabled={loading}
            className="px-5 h-10 bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Giải ngân đồng loạt'}
          </button>
        </div>
      </div>
    </div>
  );
}
