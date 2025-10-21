import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaStore, FaSignOutAlt, FaRedo, FaCheck, FaTimes, FaClock, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { orderService } from '../services/api';
import { Order } from '../types/index';
import { format } from 'date-fns';
import supabase from '../services/supabaseClient';
import { useVendorAuth } from '../contexts/VendorAuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
  max-width: 100vw;
  overflow-x: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
  color: white;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);
`;

const HeaderContent = styled.div`
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

const VendorSubtitle = styled.p`
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
  padding: 12px;
  border-radius: 10px;
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
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  &:hover {
    background: rgba(220, 53, 69, 1);
  }
`;

const OrderCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-left: 5px solid #6f42c1;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const OrderId = styled.div`
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const OrderStatus = styled.span<{ $status: string }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  
  background-color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'pending': return '#fff3cd';
      case 'accepted': return '#d1ecf1';
      case 'preparing': return '#d4edda';
      case 'ready': return '#d1ecf1';
      case 'completed': return '#d4edda';
      case 'cancelled': return '#f8d7da';
      default: return '#e2e3e5';
    }
  }};
  
  color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'pending': return '#856404';
      case 'accepted': return '#0c5460';
      case 'preparing': return '#155724';
      case 'ready': return '#0c5460';
      case 'completed': return '#155724';
      case 'cancelled': return '#721c24';
      default: return '#6c757d';
    }
  }};
`;

const OrderDetails = styled.div`
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
`;

const DetailLabel = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const DetailValue = styled.span`
  font-weight: 600;
  color: #2c3e50;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
`;

const OrderActionButton = styled.button<{ $variant?: 'success' | 'danger' | 'primary' }>`
  flex: 1;
  min-width: 120px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  background-color: ${({ $variant }: { $variant?: 'success' | 'danger' | 'primary' }) => {
    switch ($variant) {
      case 'success': return '#28a745';
      case 'danger': return '#dc3545';
      case 'primary': return '#6f42c1';
      default: return '#6c757d';
    }
  }};
  
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  color: #6c757d;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const ItemsList = styled.div`
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const ItemsTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 0.9rem;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.85rem;
`;

const PickupVendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { vendor: vendorFromContext, logoutVendor, loading: authLoading } = useVendorAuth();
  
  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!vendorFromContext) {
        toast.error('Please log in to access the vendor dashboard');
        navigate('/vendor/login');
      } else {
        setVendor(vendorFromContext);
        loadPickupOrders(vendorFromContext.id);
      }
    }
  }, [authLoading, vendorFromContext, navigate]);

  const loadPickupOrders = async (vendorId: string) => {
    try {
      setLoading(true);
      // Load orders without relations first
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('order_type', 'pickup')
        .eq('payment_status', 'paid')
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load order items for each order - items are stored in the orders.items JSONB column
      const ordersWithItems = (ordersData || []).map((order: any) => {
        return { ...order, order_items: order.items || [] };
      });

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading pickup orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus as any);
      if (result.success) {
        setOrders(prev => prev.map(order =>
          String(order.id) === orderId ? { ...order, status: newStatus as any } : order
        ));
        toast.success(`Order status updated to ${newStatus}`);
        
        // Reload orders to refresh the list
        if (vendor) {
          loadPickupOrders(vendor.id);
        }
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const result = await orderService.cancelOrder(orderId, 'Cancelled by pickup vendor');
      if (result.success) {
        setOrders(prev => prev.map(order =>
          String(order.id) === orderId ? { ...order, status: 'cancelled' as any } : order
        ));
        toast.success('Order cancelled successfully');
        
        // Reload orders to refresh the list
        if (vendor) {
          loadPickupOrders(vendor.id);
        }
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

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
              <VendorSubtitle>Pickup Orders Dashboard</VendorSubtitle>
            </VendorDetails>
          </VendorInfo>
          <HeaderActions>
            <ActionButton onClick={() => vendor && loadPickupOrders(vendor.id)}>
              <FaRedo />
            </ActionButton>
            <LogoutButton onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </LogoutButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      {loading ? (
        <EmptyState>
          <EmptyStateIcon><FaClock /></EmptyStateIcon>
          <h3>Loading pickup orders...</h3>
        </EmptyState>
      ) : orders.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon><FaStore /></EmptyStateIcon>
          <h3>No pickup orders</h3>
          <p>New pickup orders will appear here</p>
        </EmptyState>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderHeader>
              <OrderId>Pickup Order #{order.bill_number || order.id}</OrderId>
              <OrderStatus $status={order.status}>{order.status}</OrderStatus>
            </OrderHeader>

            <OrderDetails>
              <DetailRow>
                <DetailLabel><FaUser /> Customer:</DetailLabel>
                <DetailValue>{order.delivery_address?.fullName || 'N/A'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Phone:</DetailLabel>
                <DetailValue>{order.delivery_address?.phone || 'N/A'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Total Amount:</DetailLabel>
                <DetailValue>₹{order.total_price}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Order Time:</DetailLabel>
                <DetailValue>{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</DetailValue>
              </DetailRow>
            </OrderDetails>

            {order.items && order.items.length > 0 && (
              <ItemsList>
                <ItemsTitle>Order Items:</ItemsTitle>
                {order.items.map((item: any, index: number) => {
                  // Handle both flat and nested item structures
                  const itemName = item.menu_item?.name || item.name || 'Unknown Item';
                  const itemPrice = item.menu_item?.price || item.price || 0;
                  return (
                    <ItemRow key={index}>
                      <span>{item.quantity}x {itemName}</span>
                      <span>₹{(itemPrice * item.quantity).toFixed(2)}</span>
                    </ItemRow>
                  );
                })}
              </ItemsList>
            )}

            <ActionButtons>
              {order.status === 'pending' && (
                <>
                  <OrderActionButton
                    $variant="danger"
                    onClick={() => handleCancelOrder(String(order.id))}
                  >
                    <FaTimes />
                    Cancel
                  </OrderActionButton>
                  <OrderActionButton
                    $variant="success"
                    onClick={() => updateOrderStatus(String(order.id), 'accepted')}
                  >
                    <FaCheck />
                    Accept
                  </OrderActionButton>
                </>
              )}
              {order.status === 'accepted' && (
                <OrderActionButton
                  $variant="primary"
                  onClick={() => updateOrderStatus(String(order.id), 'preparing')}
                >
                  <FaClock />
                  Start Preparing
                </OrderActionButton>
              )}
              {order.status === 'preparing' && (
                <OrderActionButton
                  $variant="success"
                  onClick={() => updateOrderStatus(String(order.id), 'ready')}
                >
                  <FaCheck />
                  Ready for Pickup
                </OrderActionButton>
              )}
              {order.status === 'ready' && (
                <OrderActionButton
                  $variant="success"
                  onClick={() => updateOrderStatus(String(order.id), 'completed')}
                >
                  <FaStore />
                  Mark as Picked Up
                </OrderActionButton>
              )}
            </ActionButtons>
          </OrderCard>
        ))
      )}
    </Container>
  );
};

export default PickupVendorDashboard;
