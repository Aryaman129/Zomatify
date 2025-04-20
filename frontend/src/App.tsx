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
import Profile from './pages/Profile';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import GroupOrder from './pages/GroupOrder';
import ScheduleOrder from './pages/ScheduleOrder';
import ScheduledOrders from './pages/ScheduledOrders';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import ShopkeeperLayout from './components/layouts/ShopkeeperLayout';

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
              <OrderDetail />
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
          path="group-order" 
          element={
            <ProtectedRoute>
              <GroupOrder />
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
              <ScheduleOrder />
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

      {/* Shopkeeper routes with ShopkeeperLayout */}
      <Route 
        path="/shopkeeper" 
        element={
          <ProtectedRoute requiredRole="shopkeeper">
            <ShopkeeperLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShopkeeperDashboard />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
      </Route>

      {/* Direct development access route - REMOVE IN PRODUCTION */}
      <Route 
        path="/dev-shopkeeper" 
        element={<ShopkeeperLayout />}
      >
        <Route index element={<ShopkeeperDashboard />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
