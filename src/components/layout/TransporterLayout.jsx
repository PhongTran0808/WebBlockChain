import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { to: '/transporter', label: 'Lô hàng', icon: '📦', end: true },
  { to: '/transporter/offline', label: 'Offline', icon: '📶' },
];

export default function TransporterLayout() {
  const { logout } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800">Shipper</h1>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
          <button onClick={logout} className="text-sm text-gray-500">Đăng xuất</button>
        </div>
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
