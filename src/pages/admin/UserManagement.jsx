import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

const ROLE_COLORS = { ADMIN: 'bg-purple-100 text-purple-700', CITIZEN: 'bg-blue-100 text-blue-700', SHOP: 'bg-green-100 text-green-700', TRANSPORTER: 'bg-orange-100 text-orange-700' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    adminApi.getUsers().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await adminApi.toggleApprove(id);
      setUsers(u => u.map(x => x.id === id ? res.data : x));
      toast.success('Đã cập nhật trạng thái');
    } catch {}
  };

  const filtered = filter === 'ALL' ? users : users.filter(u => u.role === filter);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-5">Quản lý Người dùng</h2>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL','ADMIN','CITIZEN','SHOP','TRANSPORTER'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors
              ${filter === r ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['ID','Tên đăng nhập','Họ tên','Role','Tỉnh','Duyệt'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.province || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(u.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors
                      ${u.isApproved ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${u.isApproved ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
