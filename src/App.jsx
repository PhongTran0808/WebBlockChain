import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ItemManagement from './pages/admin/ItemManagement';
import CampaignManagement from './pages/admin/CampaignManagement';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import AdminLayout from './components/layout/AdminLayout';

// Citizen
import CitizenLayout from './components/layout/CitizenLayout';
import CitizenHome from './pages/citizen/CitizenHome';
import MyQR from './pages/citizen/MyQR';
import ReliefMart from './pages/citizen/ReliefMart';

// Shop
import ShopLayout from './components/layout/ShopLayout';
import ShopPOS from './pages/shop/ShopPOS';
import OrderFulfillment from './pages/shop/OrderFulfillment';
import Liquidity from './pages/shop/Liquidity';

// Transporter
import TransporterLayout from './components/layout/TransporterLayout';
import TaskList from './pages/transporter/TaskList';
import DeliveryScanner from './pages/transporter/DeliveryScanner';
import OfflineQueue from './pages/transporter/OfflineQueue';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = { ADMIN: '/admin', CITIZEN: '/citizen', SHOP: '/shop', TRANSPORTER: '/transporter' };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="items" element={<ItemManagement />} />
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Citizen */}
          <Route path="/citizen" element={<ProtectedRoute allowedRoles={['CITIZEN']}><CitizenLayout /></ProtectedRoute>}>
            <Route index element={<CitizenHome />} />
            <Route path="qr" element={<MyQR />} />
            <Route path="mart" element={<ReliefMart />} />
          </Route>

          {/* Shop */}
          <Route path="/shop" element={<ProtectedRoute allowedRoles={['SHOP']}><ShopLayout /></ProtectedRoute>}>
            <Route index element={<ShopPOS />} />
            <Route path="orders" element={<OrderFulfillment />} />
            <Route path="liquidity" element={<Liquidity />} />
          </Route>

          {/* Transporter */}
          <Route path="/transporter" element={<ProtectedRoute allowedRoles={['TRANSPORTER']}><TransporterLayout /></ProtectedRoute>}>
            <Route index element={<TaskList />} />
            <Route path="scan" element={<DeliveryScanner />} />
            <Route path="offline" element={<OfflineQueue />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
