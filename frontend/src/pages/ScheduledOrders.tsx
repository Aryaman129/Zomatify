import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock, FaCalendarAlt, FaUtensils, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/api';
import { toast } from 'react-toastify';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentContainer = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const ScheduledOrderCard = styled(Card)`
  border-left: 5px solid #2196F3;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const OrderId = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const PickupInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: #666;
`;

const OrderDetails = styled.div`
  margin-top: 16px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-size: 1rem;
  color: #666;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #333;
`;

const ItemsList = styled.div`
  margin: 16px 0;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  gap: 10px;
`;

const ItemQuantity = styled.span`
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
`;

const ItemName = styled.span`
  font-size: 1.1rem;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #333;
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: 600;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 2px dashed #eee;
`;

const ActionButton = styled.button`
  width: 100%;
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  
  &:hover {
    background-color: #E54B50;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: #f9f9f9;
  border-radius: 16px;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 16px;
`;

const EmptyStateText = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 24px;
`;

const ScheduleButton = styled.button`
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #1976D2;
  }
`;

// Define a local interface for the scheduled order data received from the API
interface ScheduledOrderData {
  id: string;
  user_id: string;
  pickup_date: string;
  pickup_time: string;
  items: Array<{
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

const ScheduledOrders: React.FC = () => {
  const [orders, setOrders] = useState<ScheduledOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchScheduledOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { success, data, error } = await orderService.getScheduledOrders();
        
        if (success && data) {
          // Convert the API response to match our ScheduledOrderData interface
          const formattedData = data.map((order: any) => ({
            id: order.id,
            user_id: order.user_id,
            pickup_date: order.pickup_date || order.schedule?.start_date || '',
            pickup_time: order.pickup_time || order.schedule?.time || '',
            items: order.items || order.order_template?.items || [],
            total_price: order.total_price || order.order_template?.total_price || 0,
            status: order.status || 'pending',
            created_at: order.created_at
          }));
          setOrders(formattedData);
        } else {
          console.error('Failed to fetch scheduled orders:', error);
          toast.error('Failed to load scheduled orders');
        }
      } catch (error) {
        console.error('Error fetching scheduled orders:', error);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScheduledOrders();
  }, [user]);
  
  const handleCancelOrder = async (orderId: string) => {
    try {
      const { success, error } = await orderService.cancelScheduledOrder(orderId);
      
      if (success) {
        setOrders(orders.filter(order => order.id !== orderId));
        toast.success('Scheduled order cancelled successfully');
      } else {
        console.error('Failed to cancel scheduled order:', error);
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling scheduled order:', error);
      toast.error('Something went wrong');
    }
  };
  
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date);
      return `${format(dateObj, 'MMM d, yyyy')} at ${time}`;
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <PageContainer>
      <AppHeader title="Scheduled Orders" />
      
      <ContentContainer>
        <SectionTitle>Your Scheduled Orders</SectionTitle>
        
        {loading ? (
          <div>Loading scheduled orders...</div>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <ScheduledOrderCard key={order.id}>
              <OrderHeader>
                <OrderId>Order #{order.id.slice(-6)}</OrderId>
                <PickupInfo>
                  <FaCalendarAlt />
                  {formatDateTime(order.pickup_date, order.pickup_time)}
                </PickupInfo>
              </OrderHeader>
              
              <ItemsList>
                {order.items.map((item: any, index: number) => (
                  <OrderItem key={index}>
                    <ItemDetails>
                      <ItemQuantity>{item.quantity}x</ItemQuantity>
                      <ItemName>{item.menuItem.name}</ItemName>
                    </ItemDetails>
                    <ItemPrice>
                      ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                    </ItemPrice>
                  </OrderItem>
                ))}
              </ItemsList>
              
              <TotalSection>
                <span>Total Amount</span>
                <span>₹{order.total_price.toFixed(2)}</span>
              </TotalSection>
              
              <OrderDetails>
                <DetailRow>
                  <DetailLabel>Status</DetailLabel>
                  <DetailValue style={{ 
                    color: order.status === 'confirmed' ? '#4CAF50' : 
                           order.status === 'cancelled' ? '#F44336' : '#FFC107'
                  }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Scheduled On</DetailLabel>
                  <DetailValue>{format(new Date(order.created_at), 'MMM d, yyyy')}</DetailValue>
                </DetailRow>
              </OrderDetails>
              
              {order.status === 'pending' && (
                <ActionButton onClick={() => handleCancelOrder(order.id)}>
                  <FaTrash /> Cancel Order
                </ActionButton>
              )}
            </ScheduledOrderCard>
          ))
        ) : (
          <EmptyState>
            <EmptyStateIcon>
              <FaClock />
            </EmptyStateIcon>
            <EmptyStateText>You don't have any scheduled orders</EmptyStateText>
            <ScheduleButton onClick={() => navigate('/schedule-order')}>
              <FaCalendarAlt /> Schedule an Order
            </ScheduleButton>
          </EmptyState>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default ScheduledOrders;
