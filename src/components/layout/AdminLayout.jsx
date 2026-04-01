import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/batches', label: 'Lô Cứu Trợ', icon: '🚨' },
  { to: '/admin/items', label: 'Vật phẩm', icon: '📦' },
  { to: '/admin/campaigns', label: 'Chiến dịch', icon: '💰' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/damage-reports', label: 'Xử lý Tranh chấp', icon: '⚖️' },
  { to: '/admin/analytics', label: 'Phân tích', icon: '📈' },
];

// Bottom nav chỉ hiện 5 item quan trọng nhất trên mobile
const mobileNavItems = [
  { to: '/admin', label: 'Home', icon: '📊', end: true },
  { to: '/admin/batches', label: 'Lô hàng', icon: '🚨' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/campaigns', label: 'Chiến dịch', icon: '💰' },
  { to: '/admin/items', label: 'Vật phẩm', icon: '📦' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── DESKTOP: Sidebar layout ── */}
      <div className="hidden lg:flex h-screen">
        <aside className="w-56 bg-blue-800 text-white flex flex-col shrink-0">
          <div className="p-4 border-b border-blue-700">
            <h1 className="font-bold text-lg">Cứu Trợ Admin</h1>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${isActive ? 'bg-blue-600' : 'hover:bg-blue-700'}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <button onClick={logout} className="p-4 text-sm text-blue-300 hover:text-white border-t border-blue-700">
            Đăng xuất
          </button>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE: Top header + bottom nav ── */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <h1 className="font-bold text-base">Cứu Trợ Admin</h1>
          <div className="flex items-center gap-3">
            {/* Menu button — mở drawer cho các trang phụ */}
            <button onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-700 hover:bg-blue-600">
              <span className="text-lg">☰</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-20 px-3 pt-3">
          <Outlet />
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
          {mobileNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors
                ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="truncate w-full text-center px-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Drawer (mobile) — tất cả menu + logout ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          {/* Panel */}
          <div className="relative w-64 bg-blue-800 text-white flex flex-col h-full ml-auto shadow-2xl">
            <div className="p-4 border-b border-blue-700 flex items-center justify-between">
              <h2 className="font-bold">Menu</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-blue-300 hover:text-white text-xl">✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors
                    ${isActive ? 'bg-blue-600' : 'hover:bg-blue-700'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <button onClick={() => { setDrawerOpen(false); logout(); }}
              className="p-4 text-sm text-blue-300 hover:text-white border-t border-blue-700 text-left">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
