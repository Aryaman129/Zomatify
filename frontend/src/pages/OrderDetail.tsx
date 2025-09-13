import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaReceipt, FaUtensils, FaMotorcycle, FaCheckCircle, FaTimesCircle, FaClock, FaCreditCard, FaInfoCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import AppHeader from '../components/common/AppHeader';
import { orderService } from '../services/api';
import { Order, OrderStatus } from '../types/index';
import { toast } from 'react-toastify';
import { subscribeToRealtimeUpdates } from '../services/supabaseClient';
import { normalizeOrderItem, normalizeOrder, formatId } from '../utils/formatters';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const OrderStatusCard = styled.div<{ $status: OrderStatus }>`
  background-color: ${({ $status }: { $status: OrderStatus }) => getStatusBgColor(statusToString($status))};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusIcon = styled.div<{ $status: OrderStatus }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $status }: { $status: OrderStatus }) => getStatusTextColor(statusToString($status))};
  font-size: 1.5rem;
`;

const StatusInfo = styled.div`
  flex: 1;
`;

const StatusTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #333;
`;

const StatusDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #666;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardContent = styled.div`
  padding: 16px;
`;

const OrderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ItemQuantity = styled.span`
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
`;

const ItemName = styled.span`
  font-size: 0.9rem;
  color: #333;
`;

const ItemPrice = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #f0f0f0;
  margin: 12px 0;
`;

const OrderSummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #666;
`;

const OrderTotal = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-weight: 600;
  font-size: 1rem;
  color: #333;
`;

const DeliveryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  color: #FF5A5F;
  margin-top: 2px;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: 0.9rem;
  color: #333;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${({ $variant }: { $variant?: 'primary' | 'secondary' | 'danger' }) => {
    switch ($variant) {
      case 'primary': return '#FF5A5F';
      case 'secondary': return '#f0f0f0';
      case 'danger': return '#F44336';
      default: return '#FF5A5F';
    }
  }};
  color: ${({ $variant }: { $variant?: 'primary' | 'secondary' | 'danger' }) => $variant === 'secondary' ? '#333' : 'white'};
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background-color: ${({ $variant }: { $variant?: 'primary' | 'secondary' | 'danger' }) => {
      switch ($variant) {
        case 'primary': return '#FF3B41';
        case 'secondary': return '#e0e0e0';
        case 'danger': return '#D32F2F';
        default: return '#FF3B41';
      }
    }};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
`;

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FFC107';
    case 'accepted': return '#2196F3';
    case 'preparing': return '#4CAF50';
    case 'ready': return '#009688';
    case 'completed': return '#8BC34A';
    case 'cancelled': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FFC107';
    case 'accepted': return '#2196F3';
    case 'preparing': return '#4CAF50';
    case 'ready': return '#009688';
    case 'completed': return '#8BC34A';
    case 'cancelled': return '#F44336';
    default: return '#9E9E9E';
  }
};

const statusToString = (status: OrderStatus): string => {
  return status.toString();
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { success, data, error } = await orderService.getOrderById(id);
        
        if (success && data) {
          const normalizedOrder = normalizeOrder(data);
          setOrder(normalizedOrder as Order);
        } else {
          console.error('Failed to fetch order:', error);
          toast.error('Failed to load order details');
          setError('Failed to load order details');
          navigate('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('An unexpected error occurred');
        setError('An unexpected error occurred');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, navigate]);
  
  // Subscribe to real-time updates for this order
  useEffect(() => {
    if (!id) return;
    
    // Create a filter for this specific order
    const unsubscribe = subscribeToRealtimeUpdates(
      'orders',
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === id) {
          setOrder(payload.new as Order);
          
          // Show toast notification for status change
          const newStatus = (payload.new as Order).status;
          const oldStatus = (payload.old as Order).status;
          
          if (newStatus !== oldStatus) {
            toast.info(`Order status updated to: ${newStatus}`);
          }
        }
      },
      { filter: `id=eq.${id}` }
    );
    
    return () => {
      unsubscribe();
    };
  }, [id]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaReceipt />;
      case 'accepted':
        return <FaUtensils />;
      case 'preparing':
        return <FaUtensils />;
      case 'ready':
        return <FaCheckCircle />;
      case 'completed':
        return <FaCheckCircle />;
      case 'cancelled':
        return <FaTimesCircle />;
      default:
        return <FaReceipt />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order is waiting for restaurant confirmation.';
      case 'accepted':
        return 'The restaurant has accepted your order.';
      case 'preparing':
        return 'The restaurant is preparing your order.';
      case 'ready':
        return 'Your order is ready for pickup/delivery.';
      case 'completed':
        return 'Your order has been delivered.';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Order status not available.';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const handleCancelOrder = async () => {
    if (!order || !id) return;
    
    if (order.status !== 'pending') {
      toast.error('Only pending orders can be cancelled');
      return;
    }
    
    try {
      setProcessing(true);
      const { success, error } = await orderService.cancelOrder(id);
      
      if (success) {
        toast.success('Order cancelled successfully');
        setOrder({ ...order, status: 'cancelled' });
      } else {
        console.error('Failed to cancel order:', error);
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Something went wrong');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <PageContainer>
        <AppHeader title="Order Details" />
        <LoadingContainer>Loading order details...</LoadingContainer>
      </PageContainer>
    );
  }
  
  if (!order) {
    return (
      <PageContainer>
        <AppHeader title="Order Details" />
        <ContentSection>
          <p>Order not found</p>
        </ContentSection>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <AppHeader title={`Order #${formatId(order.id)}`} />
      
      <ContentSection>
        <OrderStatusCard $status={order.status}>
          <StatusIcon $status={order.status}>
            {getStatusIcon(order.status)}
          </StatusIcon>
          <StatusInfo>
            <StatusTitle>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</StatusTitle>
            <StatusDescription>{getStatusText(order.status)}</StatusDescription>
          </StatusInfo>
        </OrderStatusCard>
        
        <Card>
          <CardHeader>
            <FaReceipt /> Order Summary
          </CardHeader>
          <CardContent>
            <OrderItems>
              {order.items.map((item, index) => {
                const menuItem = item.menu_item;
                return (
                  <OrderItem key={index}>
                    <ItemDetails>
                      <ItemQuantity>{item.quantity}x</ItemQuantity>
                      <ItemName>{menuItem?.name || 'Unknown item'}</ItemName>
                    </ItemDetails>
                    <ItemPrice>
                      {formatCurrency((menuItem?.price || 0) * item.quantity)}
                    </ItemPrice>
                  </OrderItem>
                );
              })}
            </OrderItems>
            
            <Divider />
            
            <OrderSummaryItem>
              <span>Subtotal</span>
              <span>₹{order.total_price.toFixed(2)}</span>
            </OrderSummaryItem>
            
            <OrderSummaryItem>
              <span>Delivery Fee</span>
              <span>₹0.00</span>
            </OrderSummaryItem>
            
            <OrderTotal>
              <span>Total</span>
              <span>₹{order.total_price.toFixed(2)}</span>
            </OrderTotal>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <FaMapMarkerAlt /> Delivery Information
          </CardHeader>
          <CardContent>
            <DeliveryInfo>
              {order.delivery_address && (
                <InfoItem>
                  <InfoIcon>
                    <FaMapMarkerAlt />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Delivery Address</InfoLabel>
                    <InfoValue>
                      {order.delivery_address.addressLine1}
                      {order.delivery_address.addressLine2 && `, ${order.delivery_address.addressLine2}`}
                      {order.delivery_address.landmark && ` (${order.delivery_address.landmark})`}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
              )}
              
              <InfoItem>
                <InfoIcon>
                  <FaPhone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Contact Number</InfoLabel>
                  <InfoValue>{order.delivery_address?.phone || 'Not provided'}</InfoValue>
                </InfoContent>
              </InfoItem>
            </DeliveryInfo>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <FaReceipt /> Order Information
          </CardHeader>
          <CardContent>
            <DeliveryInfo>
              <InfoItem>
                <InfoIcon>
                  <FaReceipt />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Order ID</InfoLabel>
                  <InfoValue>{order.id}</InfoValue>
                </InfoContent>
              </InfoItem>
              
              <InfoItem>
                <InfoIcon>
                  <FaUtensils />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Ordered On</InfoLabel>
                  <InfoValue>{formatDate(order.created_at)}</InfoValue>
                </InfoContent>
              </InfoItem>
              
              {order.special_instructions && (
                <InfoItem>
                  <InfoIcon>
                    <FaInfoCircle />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Special Instructions</InfoLabel>
                    <InfoValue>{order.special_instructions}</InfoValue>
                  </InfoContent>
                </InfoItem>
              )}
            </DeliveryInfo>
          </CardContent>
        </Card>
        
        {order.status === 'pending' && (
          <ActionButtons>
            <ActionButton 
              $variant="danger" 
              onClick={handleCancelOrder}
              disabled={processing}
            >
              <FaTimesCircle /> Cancel Order
            </ActionButton>
          </ActionButtons>
        )}
      </ContentSection>
    </PageContainer>
  );
};

export default OrderDetail;
