import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/api';
import { Order } from '../types/index';
import realtimeSync from '../services/realtimeSync';
import UnifiedBillDisplay from '../components/UnifiedBillDisplay';
import OrderStatusTracker from '../components/OrderStatusTracker';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-5px);
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const OrderCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 20px;
`;

const OrderInfo = styled.div`
  flex: 1;
`;

const OrderTitle = styled.h2`
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
`;

const OrderMeta = styled.div`
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const ItemsList = styled.div`
  margin: 25px 0;
`;

const ItemsTitle = styled.h3`
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const ItemMeta = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ItemPrice = styled.div`
  font-weight: 700;
  color: #27ae60;
  font-size: 1.1rem;
`;

const OrderTotal = styled.div`
  text-align: right;
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
`;

const DeliveryInfo = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin: 25px 0;
`;

const DeliveryTitle = styled.h3`
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeliveryDetails = styled.div`
  color: #666;
  line-height: 1.6;
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: #667eea;
  font-weight: 600;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (orderId) {
      loadOrderData();
      setupRealtimeTracking();
    }
  }, [orderId, user, navigate]);

  const loadOrderData = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await orderService.getOrder(orderId);
      
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        throw new Error(result.error || 'Order not found');
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      setError(error.message || 'Failed to load order');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeTracking = () => {
    if (!user || !orderId) return;

    const unsubscribe = realtimeSync.subscribeToUserOrders(
      user.id,
      (update) => {
        console.log('Customer order tracking update:', update);
        
        if (update.eventType === 'UPDATE' && String(update.new.id) === orderId) {
          setOrder(update.new);
        }
      }
    );

    return unsubscribe;
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <HeaderContent>
            <BackButton onClick={() => navigate('/orders')}>
              <FaArrowLeft />
            </BackButton>
            <HeaderTitle>Order Tracking</HeaderTitle>
          </HeaderContent>
        </Header>
        <LoadingState>Loading order details...</LoadingState>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container>
        <Header>
          <HeaderContent>
            <BackButton onClick={() => navigate('/orders')}>
              <FaArrowLeft />
            </BackButton>
            <HeaderTitle>Order Tracking</HeaderTitle>
          </HeaderContent>
        </Header>
        <ErrorState>
          <h3>Order not found</h3>
          <p>The requested order could not be found or you don't have permission to view it.</p>
          <button onClick={() => navigate('/orders')}>View All Orders</button>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackButton onClick={() => navigate('/orders')}>
            <FaArrowLeft />
          </BackButton>
          <HeaderTitle>Order Tracking</HeaderTitle>
        </HeaderContent>
      </Header>

      <MainContent>
        <OrderCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <OrderHeader>
            <OrderInfo>
              <OrderTitle>Order #{String(order.id).slice(-8)}</OrderTitle>
              <OrderMeta>
                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                <br />
                Payment: {order.payment_status} • Status: {order.status}
              </OrderMeta>
            </OrderInfo>
            
            <UnifiedBillDisplay 
              order={order}
              showAmount={true}
              showStatus={true}
              compact={false}
            />
          </OrderHeader>

          <OrderStatusTracker
            order={order}
            estimatedTime={`${order.estimated_delivery_time || 30} minutes`}
            orderTime={order.created_at}
          />

          <ItemsList>
            <ItemsTitle>Order Items</ItemsTitle>
            {order.items.map((item, index) => (
              <OrderItem key={index}>
                <ItemDetails>
                  <ItemName>{item.menu_item?.name || 'Item'}</ItemName>
                  <ItemMeta>
                    Quantity: {item.quantity}
                    {item.special_instructions && (
                      <span> • Special instructions: {item.special_instructions}</span>
                    )}
                  </ItemMeta>
                </ItemDetails>
                <ItemPrice>
                  ₹{((item.menu_item?.price || 0) * item.quantity).toFixed(2)}
                </ItemPrice>
              </OrderItem>
            ))}
            <OrderTotal>
              Total: ₹{order.total_price.toFixed(2)}
            </OrderTotal>
          </ItemsList>

          {order.delivery_address && (
            <DeliveryInfo>
              <DeliveryTitle>
                <FaMapMarkerAlt />
                Delivery Information
              </DeliveryTitle>
              <DeliveryDetails>
                <strong>{order.delivery_address.fullName}</strong>
                <br />
                {order.delivery_address.addressLine1}
                {order.delivery_address.addressLine2 && (
                  <>
                    <br />
                    {order.delivery_address.addressLine2}
                  </>
                )}
                {order.delivery_address.landmark && (
                  <>
                    <br />
                    Landmark: {order.delivery_address.landmark}
                  </>
                )}
                
                <ContactInfo>
                  <FaPhone />
                  {order.delivery_address.phone}
                </ContactInfo>
              </DeliveryDetails>
            </DeliveryInfo>
          )}
        </OrderCard>
      </MainContent>
    </Container>
  );
};

export default OrderTracking;
