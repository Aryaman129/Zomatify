import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaReceipt, FaChevronRight, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/api';
import { Order } from '../types/index';
import { toast } from 'react-toastify';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const OrderCard = styled(Link)<{ $status: string }>`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  border-left: 4px solid ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'pending': return '#FFC107';
      case 'accepted': return '#2196F3';
      case 'preparing': return '#FF9800';
      case 'ready': return '#009688';
      default: return '#9E9E9E';
    }
  }};
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const OrderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const OrderIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #f5f5f5;
  border-radius: 50%;
  color: #FF5A5F;
`;

const OrderDetails = styled.div`
  flex: 1;
`;

const OrderId = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #333;
`;

const OrderDate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
`;

const OrderStatus = styled.div<{ $status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'completed': return '#E8F5E9';
      case 'cancelled': return '#FFEBEE';
      case 'pending': return '#FFF8E1';
      case 'accepted': return '#E3F2FD';
      case 'preparing': return '#FFF3E0';
      case 'ready': return '#E0F2F1';
      default: return '#EEEEEE';
    }
  }};
  color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'pending': return '#FFC107';
      case 'accepted': return '#2196F3';
      case 'preparing': return '#FF9800';
      case 'ready': return '#009688';
      default: return '#9E9E9E';
    }
  }};
`;

const OrderContent = styled.div`
  padding: 16px;
`;

const OrderItems = styled.div`
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #666;
`;

const OrderTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
`;

const ViewDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #FF5A5F;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 12px;
  margin-top: 20px;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
`;

const OrderButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #FF5A5F;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #FF3B41;
  }
`;

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { success, data, error } = await orderService.getUserOrders(user.id);
        
        if (success && data) {
          setOrders(data);
        } else {
          console.error('Failed to fetch orders:', error);
          toast.error('Failed to load order history');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);
  
  const getItemsText = (order: Order) => {
    if (!order.items || order.items.length === 0) return 'No items';
    
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
  };
  
  const formatOrderDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const formatOrderTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };
  
  return (
    <PageContainer>
      <AppHeader title="Order History" />
      
      <ContentSection>
        {loading ? (
          <div>Loading orders...</div>
        ) : orders.length > 0 ? (
          <OrdersList>
            {orders.map((order) => (
              <OrderCard key={order.id} to={`/orders/${order.id}`} $status={order.status}>
                <OrderHeader>
                  <OrderInfo>
                    <OrderIcon>
                      <FaReceipt />
                    </OrderIcon>
                    <OrderDetails>
                      <OrderId>Order #{String(order.id).slice(-6)}</OrderId>
                      <OrderDate>
                        <FaCalendarAlt size={12} />
                        {formatOrderDate(order.created_at)}
                        <FaClock size={12} />
                        {formatOrderTime(order.created_at)}
                      </OrderDate>
                    </OrderDetails>
                  </OrderInfo>
                  <OrderStatus $status={order.status}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </OrderStatus>
                </OrderHeader>
                
                <OrderContent>
                  <OrderItems>
                    {getItemsText(order)}
                  </OrderItems>
                  
                  <OrderTotal>
                    <div>₹{order.total_price.toFixed(2)}</div>
                    <ViewDetails>
                      View Details <FaChevronRight size={12} />
                    </ViewDetails>
                  </OrderTotal>
                </OrderContent>
              </OrderCard>
            ))}
          </OrdersList>
        ) : (
          <EmptyState>
            <EmptyIcon>
              <FaReceipt />
            </EmptyIcon>
            <EmptyText>You haven't placed any orders yet</EmptyText>
            <OrderButton to="/menu">
              Browse Menu
            </OrderButton>
          </EmptyState>
        )}
      </ContentSection>
    </PageContainer>
  );
};

export default OrderHistory;
