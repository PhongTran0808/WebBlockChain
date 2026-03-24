import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { to: '/shop', label: 'POS', icon: '📷', end: true },
  { to: '/shop/orders', label: 'Đơn hàng', icon: '📋' },
  { to: '/shop/liquidity', label: 'Thanh khoản', icon: '💵' },
];

export default function ShopLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800">Cửa hàng Cứu trợ</h1>
        <button onClick={logout} className="text-sm text-gray-500">Đăng xuất</button>
      </header>

      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {tabs.map(tab => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors
              ${isActive ? 'text-blue-700' : 'text-gray-500'}`
            }>
            <span className="text-2xl mb-0.5">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
