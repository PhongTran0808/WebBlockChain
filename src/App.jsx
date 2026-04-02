import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ItemManagement from './pages/admin/ItemManagement';
import CampaignManagement from './pages/admin/CampaignManagement';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import ReliefBatchManagement from './pages/admin/ReliefBatchManagement';
import AdminDamageReports from './pages/admin/AdminDamageReports';
import AdminLayout from './components/layout/AdminLayout';

// Citizen
import CitizenLayout from './components/layout/CitizenLayout';
import CitizenHome from './pages/citizen/CitizenHome';
import CitizenScanner from './pages/citizen/CitizenScanner';
import MyQR from './pages/citizen/MyQR';
import DamageDashboard from './pages/citizen/DamageDashboard';

// Shop
import ShopLayout from './components/layout/ShopLayout';
import ShopPOS from './pages/shop/ShopPOS';
import BatchApproval from './pages/shop/BatchApproval';
import BatchDetail from './pages/shop/BatchDetail';
import Inventory from './pages/shop/Inventory';
import Liquidity from './pages/shop/Liquidity';
import ShopReceiveToken from './pages/shop/ShopReceiveToken';
import OrderFulfillment from './pages/shop/OrderFulfillment';

// Transporter
import TransporterLayout from './components/layout/TransporterLayout';
import BatchDelivery from './pages/transporter/BatchDelivery';
import OfflineQueue from './pages/transporter/OfflineQueue';
import TaskList from './pages/transporter/TaskList';
import DeliveryScanner from './pages/transporter/DeliveryScanner';
import StandaloneSurvey from './pages/transporter/StandaloneSurvey';

// Common
import TransactionHistory from './pages/TransactionHistory';
import TransparencyPortal from './pages/TransparencyPortal';
import ProvinceReport from './pages/ProvinceReport';

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
    <GlobalErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/transparency" element={<TransparencyPortal />} />
          <Route path="/reports" element={<ProvinceReport />} />
          <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="batches" element={<ReliefBatchManagement />} />
            <Route path="items" element={<ItemManagement />} />
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="damage-reports" element={<AdminDamageReports />} />
          </Route>

          {/* Citizen — chỉ Home + QR + Scanner + Dashboard */}
          <Route path="/citizen" element={<ProtectedRoute allowedRoles={['CITIZEN']}><CitizenLayout /></ProtectedRoute>}>
            <Route index element={<CitizenHome />} />
            <Route path="scan" element={<CitizenScanner />} />
            <Route path="qr" element={<MyQR />} />
            <Route path="damage-reports" element={<DamageDashboard />} />
          </Route>

          {/* Shop */}
          <Route path="/shop" element={<ProtectedRoute allowedRoles={['SHOP']}><ShopLayout /></ProtectedRoute>}>
            <Route index element={<BatchApproval />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="pos" element={<ShopPOS />} />
            <Route path="receive" element={<ShopReceiveToken />} />
            <Route path="liquidity" element={<Liquidity />} />
            <Route path="orders" element={<OrderFulfillment />} />
            <Route path="batches/:id" element={<BatchDetail />} />
          </Route>

          {/* Transporter */}
          <Route path="/transporter" element={<ProtectedRoute allowedRoles={['TRANSPORTER']}><TransporterLayout /></ProtectedRoute>}>
            <Route index element={<BatchDelivery />} />
            <Route path="offline" element={<OfflineQueue />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="scan" element={<DeliveryScanner />} />
            <Route path="survey" element={<StandaloneSurvey />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
