import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/items', label: 'Vật phẩm', icon: '📦' },
  { to: '/admin/campaigns', label: 'Chiến dịch', icon: '💰' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/analytics', label: 'Phân tích', icon: '📈' },
];

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-blue-800 text-white flex flex-col">
        <div className="p-4 border-b border-blue-700">
          <h1 className="font-bold text-lg">Cứu Trợ Admin</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-blue-600' : 'hover:bg-blue-700'}`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="p-4 text-sm text-blue-300 hover:text-white border-t border-blue-700">
          Đăng xuất
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
