import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaStore, FaSignOutAlt, FaBell, FaRedo, FaClipboardList, FaChartBar, FaUtensils, FaCog, FaPhone, FaUser, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { orderService, menuService, queueService } from '../services/api';
import { Order, MenuItem, QueueStatus } from '../types/index';
import { format } from 'date-fns';
import supabase from '../services/supabaseClient';
import realtimeSync, { OrderUpdatePayload } from '../services/realtimeSync';
import UnifiedBillDisplay from '../components/UnifiedBillDisplay';
import VendorMenuManager from '../components/VendorMenuManager';
import VendorOperationalControls from '../components/VendorOperationalControls';
import VendorNotificationSystem from '../components/VendorNotificationSystem';
import { useVendorAuth } from '../contexts/VendorAuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const QuickNavigation = styled.div`
  background: white;
  padding: 20px;
  margin: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
`;

const QuickNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 200px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    color: white;
  }
  
  &:nth-child(2) {
    background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
    
    &:hover {
      box-shadow: 0 8px 25px rgba(111, 66, 193, 0.3);
    }
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const VendorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const VendorIcon = styled.div`
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const VendorDetails = styled.div``;

const VendorName = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const VendorEmail = styled.p`
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const LogoutButton = styled(ActionButton)`
  background: rgba(220, 53, 69, 0.8);
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  &:hover {
    background: rgba(220, 53, 69, 1);
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #667eea;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.3rem;
  margin-bottom: 15px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const TabNavigation = styled.div`
  display: flex;
  gap: 10px;
  margin: 20px 0;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
`;

const TabButton = styled.button<{ active: boolean }>`
  background: ${(props: { active: boolean }) => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${(props: { active: boolean }) => props.active ? 'white' : '#666'};
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${(props: { active: boolean }) => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa'};
    transform: translateY(-2px);
  }
`;

const TabContent = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const OrdersSection = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
`;

const OrderCard = styled(motion.div)`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
  }
`;

const CustomerInfo = styled.div`
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  border-left: 4px solid #007bff;
`;

const CustomerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #666;

  &:last-child {
    margin-bottom: 0;
  }

  svg {
    color: #007bff;
  }
`;

const CustomerLabel = styled.span`
  font-weight: 600;
  color: #333;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
`;

const OrderInfo = styled.div`
  flex: 1;
`;

const BillDisplay = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  min-width: 200px;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
`;

const CustomerName = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const BillNumber = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const BillDate = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const OrderStatus = styled.div<{ status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(props: { status: string }) => {
    switch (props.status) {
      case 'pending': return '#fff3cd';
      case 'confirmed': return '#d4edda';
      case 'preparing': return '#cce5ff';
      case 'ready': return '#e2e3e5';
      case 'delivered': return '#d1ecf1';
      default: return '#f8f9fa';
    }
  }};
  color: ${(props: { status: string }) => {
    switch (props.status) {
      case 'pending': return '#856404';
      case 'confirmed': return '#155724';
      case 'preparing': return '#004085';
      case 'ready': return '#383d41';
      case 'delivered': return '#0c5460';
      default: return '#495057';
    }
  }};
`;

const OrderItems = styled.div`
  margin: 15px 0;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #2c3e50;
`;

const ItemQuantity = styled.span`
  color: #666;
  margin: 0 10px;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #27ae60;
`;

const OrderTotal = styled.div`
  text-align: right;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
`;

const StatusButton = styled.button<{ $variant?: string }>`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${(props: { $variant?: string }) => {
    switch (props.$variant) {
      case 'confirm': return '#28a745';
      case 'prepare': return '#007bff';
      case 'ready': return '#ffc107';
      case 'complete': return '#6c757d';
      case 'cancel': return '#dc3545';
      default: return '#667eea';
    }
  }};
  
  color: ${(props: { $variant?: string }) => props.$variant === 'ready' ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const QuickNav = styled.div`
  display: flex;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
`;

const QuickNavButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    text-decoration: none;
    color: white;
  }
`;

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { vendor: vendorFromContext, logoutVendor, loading: authLoading } = useVendorAuth();
  
  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    activeMenuItems: 0
  });

  // Define loadDashboardData BEFORE any useEffect that uses it
  const loadDashboardData = useCallback(async (vendorId: string) => {
    // Strict validation
    if (!vendorId || typeof vendorId !== 'string' || vendorId === 'undefined' || vendorId === '[object Object]') {
      console.error('❌ Invalid vendor ID received:', vendorId, 'Type:', typeof vendorId);
      toast.error('Invalid vendor session. Please log in again.');
      return;
    }
    
    console.log('🔍 Loading dashboard data for vendor ID:', vendorId);
    
    setLoading(true);
    try {
      // Load vendor-specific orders
      const ordersResult = await orderService.getVendorOrders(vendorId);
      if (ordersResult.success) {
        console.log('✅ Loaded orders:', ordersResult.data?.length || 0);
        setOrders(ordersResult.data || []);
      } else {
        console.error('❌ Failed to load orders:', ordersResult.error);
        toast.error('Failed to load orders');
      }

      // Load vendor menu items
      const menuResult = await menuService.getMenuItems(vendorId);
      if (menuResult.success) {
        console.log('✅ Loaded menu items:', menuResult.data?.length || 0);
        setMenuItems(menuResult.data || []);
      } else {
        console.error('❌ Failed to load menu items:', menuResult.error);
        toast.error('Failed to load menu items');
      }

      // Load queue status
      const queueResult = await queueService.getQueueStatus(vendorId);
      if (queueResult.success) {
        setQueueStatus(queueResult.data || null);
      }

      // Calculate stats
      const todayOrders = (ordersResult.data || []).filter((order: Order) =>
        new Date(order.created_at).toDateString() === new Date().toDateString()
      );

      const pendingOrders = (ordersResult.data || []).filter((order: Order) =>
        ['pending', 'accepted'].includes(order.status)
      );

      const todayRevenue = todayOrders.reduce((sum: number, order: Order) => sum + order.total_price, 0);

      setStats({
        totalOrders: ordersResult.data?.length || 0,
        pendingOrders: pendingOrders.length,
        todayRevenue,
        activeMenuItems: (menuResult.data || []).filter(item => item.is_available).length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - function is stable

  // Check vendor authentication and load data
  useEffect(() => {
    if (!authLoading) {
      if (!vendorFromContext) {
        toast.error('Please log in to access the vendor dashboard');
        navigate('/vendor/login');
      } else {
        // Set vendor state
        setVendor(vendorFromContext);
        // Load dashboard data immediately
        loadDashboardData(vendorFromContext.id);
      }
    }
  }, [authLoading, vendorFromContext, navigate, loadDashboardData]);

  const handleLogout = async () => {
    try {
      await logoutVendor();
      toast.success('Logged out successfully');
      navigate('/vendor/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  useEffect(() => {
    if (!vendor) {
      return;
    }

    // Setup real-time subscriptions only after vendor is set
    const unsubscribeOrders = realtimeSync.subscribeToVendorOrders(
      vendor.id,
      (update) => {
        console.log('Vendor dashboard order update:', update);

        if (update.eventType === 'INSERT') {
          setOrders(prev => [update.new, ...prev]);
          // Update stats for new order
          setStats(prev => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
            pendingOrders: prev.pendingOrders + 1
          }));
        } else if (update.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order =>
            String(order.id) === String(update.new.id) ? update.new : order
          ));
        }
      }
    );

    const unsubscribePayments = realtimeSync.subscribeToVendorPayments(
      vendor.id,
      (update: any) => {
        console.log('Vendor dashboard payment update:', update);
        // Handle payment updates if needed
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribePayments();
    };
  }, [vendor, navigate]);

  const setupRealtimeSubscriptions = () => {
    if (!vendor) return;

    // Subscribe to vendor orders using the enhanced realtime service
    const unsubscribeOrders = realtimeSync.subscribeToVendorOrders(
      vendor.id,
      (payload: OrderUpdatePayload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
          // Update stats for new orders
          setStats(prev => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
            pendingOrders: prev.pendingOrders + 1
          }));
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(order =>
            String(order.id) === String(payload.new.id) ? payload.new : order
          ));

          // Update stats if order status changed
          if (payload.old && payload.new.status !== payload.old.status) {
            updateStatsForStatusChange(payload.old.status, payload.new.status);
          }
        }
      }
    );

    // Subscribe to payment updates
    const unsubscribePayments = realtimeSync.subscribeToVendorPayments(
      vendor.id,
      (payload: any) => {
        console.log('Payment update received:', payload);
        // Refresh dashboard data when payments are updated
        if (payload.eventType === 'UPDATE' && payload.new.transfer_status === 'completed') {
          if (vendor?.id) {
            loadDashboardData(vendor.id);
          }
        }
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribePayments();
    };
  };

  const updateStatsForStatusChange = (oldStatus: string, newStatus: string) => {
    setStats(prev => {
      let pendingChange = 0;

      // If order moved from active queue (pending/accepted) to completed (ready/completed)
      if (['pending', 'accepted'].includes(oldStatus) &&
          !['pending', 'accepted'].includes(newStatus)) {
        pendingChange = -1;
      }

      // If order moved back to active queue
      if (!['pending', 'accepted'].includes(oldStatus) &&
          ['pending', 'accepted'].includes(newStatus)) {
        pendingChange = 1;
      }

      return {
        ...prev,
        pendingOrders: Math.max(0, prev.pendingOrders + pendingChange)
      };
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Find the current order to get the old status
      const currentOrder = orders.find(order => String(order.id) === orderId);
      const oldStatus = currentOrder?.status || '';

      const result = await orderService.updateOrderStatus(orderId, newStatus as any);
      if (result.success) {
        // Update the order in the list
        setOrders(prev => prev.map(order =>
          String(order.id) === orderId ? { ...order, status: newStatus as any } : order
        ));
        
        // Update stats based on status change
        updateStatsForStatusChange(oldStatus, newStatus);
        
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      const result = await orderService.cancelOrder(orderId, reason);
      if (result.success) {
        setOrders(prev => prev.map(order =>
          String(order.id) === orderId ? { ...order, status: 'cancelled' as any } : order
        ));
        toast.success('Order cancelled successfully');
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  if (!vendor) {
    return null;
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <VendorInfo>
            <VendorIcon>
              <FaStore />
            </VendorIcon>
            <VendorDetails>
              <VendorName>{vendor.business_name}</VendorName>
              <VendorEmail>{vendor.vendor_email}</VendorEmail>
            </VendorDetails>
          </VendorInfo>
          
          <HeaderActions>
            <ActionButton onClick={() => vendor?.id && loadDashboardData(vendor.id)} title="Refresh">
              <FaRedo />
            </ActionButton>
            <ActionButton title="Notifications">
              <FaBell />
            </ActionButton>
            <LogoutButton onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </LogoutButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <QuickNav>
        <QuickNavButton to="/vendor/delivery">
          <FaTruck />
          Delivery Orders Dashboard
        </QuickNavButton>
        <QuickNavButton to="/vendor/pickup">
          <FaStore />
          Pickup Orders Dashboard
        </QuickNavButton>
      </QuickNav>

      <MainContent>
        <TabNavigation>
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </TabButton>
          <TabButton
            active={activeTab === 'menu'}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu Management
          </TabButton>
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </TabButton>
        </TabNavigation>

        <TabContent>
          {activeTab === 'dashboard' && (
            <>
              <StatsGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatIcon><FaClipboardList /></StatIcon>
            <StatValue>{stats.totalOrders}</StatValue>
            <StatLabel>Total Orders</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatIcon><FaBell /></StatIcon>
            <StatValue>{stats.pendingOrders}</StatValue>
            <StatLabel>Pending Orders</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatIcon><FaChartBar /></StatIcon>
            <StatValue>₹{stats.todayRevenue.toFixed(2)}</StatValue>
            <StatLabel>Today's Revenue</StatLabel>
          </StatCard>
          
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatIcon><FaUtensils /></StatIcon>
            <StatValue>{stats.activeMenuItems}</StatValue>
            <StatLabel>Active Menu Items</StatLabel>
          </StatCard>
        </StatsGrid>

        {/* Pickup Orders Section */}
        <OrdersSection>
          <SectionTitle>🛍️ Pickup Orders</SectionTitle>

          {loading ? (
            <EmptyState>
              <EmptyIcon>⏳</EmptyIcon>
              <p>Loading orders...</p>
            </EmptyState>
          ) : orders.filter(order => order.order_type === 'pickup').length === 0 ? (
            <EmptyState>
              <EmptyIcon>🛍️</EmptyIcon>
              <p>No pickup orders yet. Pickup orders will appear here.</p>
            </EmptyState>
          ) : (
            orders.filter(order => order.order_type === 'pickup').slice(0, 5).map((order) => (
              <OrderCard
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OrderHeader>
                  <OrderInfo>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                      Order #{String(order.id).slice(-8)}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <OrderStatus status={order.status}>{order.status}</OrderStatus>
                  </OrderInfo>
                  
                  {/* Unified Bill Display */}
                  <UnifiedBillDisplay
                    order={order}
                    vendorName={vendor.business_name}
                    showAmount={true}
                    showStatus={false}
                    compact={false}
                  />
                </OrderHeader>

                {/* Customer Information */}
                {order.delivery_address && (
                  <CustomerInfo>
                    <CustomerRow>
                      <FaUser />
                      <CustomerLabel>Customer:</CustomerLabel>
                      <span>{order.delivery_address.fullName || 'N/A'}</span>
                    </CustomerRow>
                    {order.delivery_address.phone && (
                      <CustomerRow>
                        <FaPhone />
                        <CustomerLabel>Phone:</CustomerLabel>
                        <span>{order.delivery_address.phone}</span>
                      </CustomerRow>
                    )}
                    {order.order_type === 'delivery' && order.delivery_address.addressLine1 && (
                      <CustomerRow>
                        <FaMapMarkerAlt />
                        <CustomerLabel>Address:</CustomerLabel>
                        <span>{order.delivery_address.addressLine1}</span>
                      </CustomerRow>
                    )}
                  </CustomerInfo>
                )}

                <OrderItems>
                  {order.items.map((item, index) => (
                    <OrderItem key={index}>
                      <ItemName>{item.menu_item?.name || 'Item'}</ItemName>
                      <ItemQuantity>x{item.quantity}</ItemQuantity>
                      <ItemPrice>₹{(item.menu_item?.price * item.quantity || 0).toFixed(2)}</ItemPrice>
                    </OrderItem>
                  ))}
                </OrderItems>

                <OrderTotal>
                  Total: ₹{order.total_price.toFixed(2)}
                </OrderTotal>

                {/* Pickup orders don't need confirm/cancel since payment is already processed */}
                <ActionButtons>
                  {order.status === 'pending' && (
                    <StatusButton
                      $variant="confirm"
                      onClick={() => updateOrderStatus(String(order.id), 'accepted')}
                    >
                      Accept Order
                    </StatusButton>
                  )}
                  {order.status === 'accepted' && (
                    <StatusButton
                      $variant="ready"
                      onClick={() => updateOrderStatus(String(order.id), 'ready')}
                    >
                      Ready for Pickup
                    </StatusButton>
                  )}
                  {order.status === 'ready' && (
                    <StatusButton
                      $variant="complete"
                      onClick={() => updateOrderStatus(String(order.id), 'completed')}
                    >
                      Order Collected
                    </StatusButton>
                  )}
                </ActionButtons>
              </OrderCard>
            ))
          )}
        </OrdersSection>

        {/* Delivery Orders Section */}
        <OrdersSection>
          <SectionTitle>🚚 Delivery Orders</SectionTitle>

          {loading ? (
            <EmptyState>
              <EmptyIcon>⏳</EmptyIcon>
              <p>Loading orders...</p>
            </EmptyState>
          ) : orders.filter(order => order.order_type === 'delivery' || !order.order_type).length === 0 ? (
            <EmptyState>
              <EmptyIcon>🚚</EmptyIcon>
              <p>No delivery orders yet. Delivery orders will appear here.</p>
            </EmptyState>
          ) : (
            orders.filter(order => order.order_type === 'delivery' || !order.order_type).slice(0, 5).map((order) => (
              <OrderCard
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OrderHeader>
                  <OrderInfo>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                      Delivery Order #{String(order.id).slice(-8)}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <OrderStatus status={order.status}>{order.status}</OrderStatus>
                  </OrderInfo>

                  {/* Unified Bill Display */}
                  <UnifiedBillDisplay
                    order={order}
                    vendorName={vendor.business_name}
                    showAmount={true}
                    showStatus={false}
                    compact={false}
                  />
                </OrderHeader>

                {/* Customer Information */}
                {order.delivery_address && (
                  <CustomerInfo>
                    <CustomerRow>
                      <FaUser />
                      <CustomerLabel>Customer:</CustomerLabel>
                      <span>{order.delivery_address.fullName || 'N/A'}</span>
                    </CustomerRow>
                    {order.delivery_address.phone && (
                      <CustomerRow>
                        <FaPhone />
                        <CustomerLabel>Phone:</CustomerLabel>
                        <span>{order.delivery_address.phone}</span>
                      </CustomerRow>
                    )}
                    {order.delivery_address.addressLine1 && (
                      <CustomerRow>
                        <FaMapMarkerAlt />
                        <CustomerLabel>Address:</CustomerLabel>
                        <span>{order.delivery_address.addressLine1}</span>
                      </CustomerRow>
                    )}
                  </CustomerInfo>
                )}

                <OrderItems>
                  {order.items.map((item, index) => (
                    <OrderItem key={index}>
                      <ItemName>{item.menu_item?.name || 'Item'}</ItemName>
                      <ItemQuantity>Qty: {item.quantity}</ItemQuantity>
                      <ItemPrice>₹{((item.menu_item?.price || 0) * item.quantity).toFixed(2)}</ItemPrice>
                    </OrderItem>
                  ))}
                </OrderItems>

                <OrderTotal>
                  Total: ₹{order.total_price.toFixed(2)}
                </OrderTotal>

                {/* Delivery orders have full confirm/cancel workflow */}
                <ActionButtons>
                  {order.status === 'pending' && (
                    <>
                      <StatusButton
                        $variant="confirm"
                        onClick={() => updateOrderStatus(String(order.id), 'accepted')}
                      >
                        Accept Order
                      </StatusButton>
                      <StatusButton
                        $variant="cancel"
                        onClick={() => handleCancelOrder(String(order.id), 'Vendor cancelled order')}
                      >
                        Cancel Order
                      </StatusButton>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <StatusButton
                      $variant="ready"
                      onClick={() => updateOrderStatus(String(order.id), 'ready')}
                    >
                      Ready for Delivery
                    </StatusButton>
                  )}
                  {order.status === 'ready' && (
                    <StatusButton
                      $variant="complete"
                      onClick={() => updateOrderStatus(String(order.id), 'completed')}
                    >
                      Mark Delivered
                    </StatusButton>
                  )}
                </ActionButtons>
              </OrderCard>
            ))
          )}
        </OrdersSection>
              </>
            )}

            {activeTab === 'menu' && (
              <VendorMenuManager />
            )}

            {activeTab === 'settings' && (
              <VendorOperationalControls />
            )}
          </TabContent>
      </MainContent>

      {/* Vendor Notification System */}
      {vendor && (
        <VendorNotificationSystem
          vendorId={vendor.id}
          onOrderAction={async (orderId, action) => {
            try {
              if (action === 'accept') {
                await orderService.updateOrderStatus(orderId, 'confirmed' as any);
                toast.success('Order accepted successfully!');
              } else {
                await orderService.updateOrderStatus(orderId, 'cancelled' as any);
                toast.success('Order rejected');
              }
              // Refresh orders
              if (vendor?.id) {
                loadDashboardData(vendor.id);
              }
            } catch (error) {
              toast.error(`Failed to ${action} order`);
            }
          }}
        />
      )}
    </Container>
  );
};

export default VendorDashboard;
