import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/citizen', label: 'Trang chủ', icon: '🏠', end: true },
  { to: '/citizen/scan', label: 'Quét Shop', icon: '📷' },
  { to: '/citizen/qr', label: 'Mã Của Tôi', icon: '📱' },
  { to: '/citizen/damage-reports', label: 'Bảng Tin', icon: '📋' },
];

export default function CitizenLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Nav */}
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
