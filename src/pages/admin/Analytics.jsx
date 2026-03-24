import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminApi } from '../../api/adminApi';

const COLORS = ['#1d4ed8', '#16a34a', '#dc2626', '#9333ea'];

export default function Analytics() {
  const [tokenFlow, setTokenFlow] = useState(null);
  const [daily, setDaily] = useState(null);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    adminApi.getTokenFlow().then(r => setTokenFlow(r.data)).catch(() => {});
    adminApi.getDailyStats().then(r => setDaily(r.data)).catch(() => {});
    adminApi.getLiveFeed().then(r => setFeed(r.data)).catch(() => {});
  }, []);

  const pieData = tokenFlow ? [
    { name: 'Đã phân bổ', value: tokenFlow.distributed },
    { name: 'Đang khóa', value: tokenFlow.locked },
    { name: 'Khả dụng', value: tokenFlow.available },
  ] : [];

  const barData = daily ? [
    { name: 'Chờ xử lý', value: daily.pending },
    { name: 'Đang giao', value: daily.inTransit },
    { name: 'Đã giao', value: daily.delivered },
    { name: 'Huỷ', value: daily.cancelled },
  ] : [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Phân tích & Thống kê</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Phân bổ Token</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Trạng thái Đơn hàng</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1d4ed8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Giao dịch gần nhất</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {feed.map(tx => (
            <div key={tx.orderId} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium">#{tx.orderId} — {tx.citizen}</p>
                <p className="text-xs text-gray-400">{tx.createdAt}</p>
              </div>
              <span className="text-sm font-semibold text-blue-600">{tx.tokens} token</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
