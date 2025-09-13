import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import CustomerOrderDetails from './pages/CustomerOrderDetails';
import Profile from './pages/Profile';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SelfPickupPage from './pages/ScheduleOrder';
import ScheduledOrders from './pages/ScheduledOrders';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

// Vendor Pages
import VendorLogin from './pages/VendorLogin';
import VendorDashboard from './pages/VendorDashboard';
import DeliveryVendorDashboard from './pages/DeliveryVendorDashboard';
import PickupVendorDashboard from './pages/PickupVendorDashboard';

// New Pages
import VendorSelection from './pages/VendorSelection';
import VendorMenuDisplay from './components/VendorMenuDisplay';
import OrderTracking from './pages/OrderTracking';

// Layouts
import MainLayout from './components/layouts/MainLayout';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Show a loading state while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User routes with MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route 
          path="checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="order-success/:orderId" 
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="orders" 
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          } 
        />
        <Route
          path="orders/:orderId"
          element={
            <ProtectedRoute>
              <CustomerOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="scheduled-orders" 
          element={
            <ProtectedRoute>
              <ScheduledOrders />
            </ProtectedRoute>
          } 
        />
        <Route
          path="schedule-order"
          element={
            <ProtectedRoute>
              <SelfPickupPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Vendor Routes */}
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/dashboard" element={<VendorDashboard />} />
      <Route path="/vendor/delivery" element={<DeliveryVendorDashboard />} />
      <Route path="/vendor/pickup" element={<PickupVendorDashboard />} />

      {/* Customer Vendor Selection Routes */}
      <Route path="/vendors" element={<VendorSelection />} />
      <Route path="/vendor/:vendorId/menu" element={<VendorMenuDisplay />} />

      {/* Order Tracking */}
      <Route path="/order/:orderId" element={<OrderTracking />} />

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
