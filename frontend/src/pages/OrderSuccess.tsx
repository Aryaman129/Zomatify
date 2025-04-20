import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaReceipt, FaArrowLeft, FaUtensils, FaHome } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { orderService } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const Container = styled.div`
  padding-bottom: 100px;
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const SuccessCard = styled(motion.div)`
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const SuccessIcon = styled.div`
  color: #4CAF50;
  font-size: 64px;
  margin-bottom: 16px;
`;

const SuccessTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const SuccessMessage = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 24px;
`;

const OrderNumberText = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const OrderDateText = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 16px;
`;

const OrderDetailsCard = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OrderItemsList = styled.div`
  margin-bottom: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  align-items: center;
`;

const ItemQuantity = styled.span`
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  min-width: 24px;
  text-align: center;
`;

const ItemName = styled.span`
  font-size: 1.1rem;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #333;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 16px 0;
`;

const OrderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 1.1rem;
`;

const InfoLabel = styled.span`
  color: #666;
`;

const InfoValue = styled.span`
  font-weight: 500;
  color: #333;
`;

const TotalRow = styled(OrderInfo)`
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ddd;
`;

const PaymentInfoCard = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const PaymentMethod = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PaymentMethodName = styled.span`
  font-weight: 500;
  font-size: 1.1rem;
  color: #333;
`;

const PaymentStatus = styled.span<{ $status: string }>`
  background-color: ${(props: { $status: string }) => 
    props.$status === 'paid' ? '#ECFDF5' : 
    props.$status === 'pending' ? '#FEF3C7' : '#FEE2E2'};
  color: ${(props: { $status: string }) => 
    props.$status === 'paid' ? '#10B981' : 
    props.$status === 'pending' ? '#F59E0B' : '#EF4444'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const DeliveryCard = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const AddressLabel = styled.div`
  font-size: 1rem;
  color: #666;
  margin-bottom: 8px;
`;

const AddressValue = styled.div`
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 4px;
`;

const ButtonsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
`;

const OrderButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  
  &:focus {
    outline: 3px solid #FF5A5F30;
  }
`;

const PrimaryButton = styled(OrderButton)`
  background-color: #FF5A5F;
  color: white;
  
  &:hover {
    background-color: #E54B50;
  }
`;

const SecondaryButton = styled(OrderButton)`
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const { success, data, error } = await orderService.getOrderById(orderId);
        
        if (success && data) {
          setOrder(data);
        } else {
          console.error('Failed to fetch order details:', error);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handleViewOrderHistory = () => {
    navigate('/orders');
  };
  
  const handleGoToHome = () => {
    navigate('/');
  };
  
  const handleGoToMenu = () => {
    navigate('/menu');
  };
  
  if (loading) {
    return (
      <Container>
        <AppHeader title="Order Success" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <div className="loader"></div>
        </div>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container>
        <AppHeader title="Order Success" />
        <ContentSection>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p>Order not found. Please check your order history.</p>
            <ButtonsGroup>
              <PrimaryButton onClick={handleViewOrderHistory}>
                <FaReceipt /> View Order History
              </PrimaryButton>
              <SecondaryButton onClick={handleGoToHome}>
                <FaHome /> Go to Home
              </SecondaryButton>
            </ButtonsGroup>
          </div>
        </ContentSection>
      </Container>
    );
  }
  
  return (
    <Container>
      <AppHeader title="Order Success" />
      
      <ContentSection>
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          {/* Success Message Card */}
          <SuccessCard
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SuccessIcon>
              <FaCheckCircle />
            </SuccessIcon>
            <SuccessTitle>Order Placed!</SuccessTitle>
            <SuccessMessage>
              Your order has been successfully placed and will be processed shortly.
            </SuccessMessage>
            <OrderNumberText>Order #{order.id.substring(0, 8)}</OrderNumberText>
            <OrderDateText>
              {formatDate(order.created_at, 'MMM dd, yyyy • h:mm a')}
            </OrderDateText>
          </SuccessCard>
          
          {/* Order Details Card */}
          <OrderDetailsCard>
            <SectionTitle>
              <FaReceipt /> Order Details
            </SectionTitle>
            
            <OrderItemsList>
              {order.items.map((item, index) => (
                <OrderItem key={index}>
                  <ItemDetails>
                    <ItemQuantity>{item.quantity}x</ItemQuantity>
                    <ItemName>{item.menuItem.name}</ItemName>
                  </ItemDetails>
                  <ItemPrice>
                    {formatCurrency(item.menuItem.price * item.quantity)}
                  </ItemPrice>
                </OrderItem>
              ))}
            </OrderItemsList>
            
            <Divider />
            
            <OrderInfo>
              <InfoLabel>Subtotal</InfoLabel>
              <InfoValue>{formatCurrency(order.total_price * 0.95)}</InfoValue>
            </OrderInfo>
            
            <OrderInfo>
              <InfoLabel>Tax (5%)</InfoLabel>
              <InfoValue>{formatCurrency(order.total_price * 0.05)}</InfoValue>
            </OrderInfo>
            
            <OrderInfo>
              <InfoLabel>Delivery Fee</InfoLabel>
              <InfoValue>
                {order.total_price > 300 ? 'Free' : formatCurrency(30)}
              </InfoValue>
            </OrderInfo>
            
            <TotalRow>
              <InfoLabel>Total</InfoLabel>
              <InfoValue>{formatCurrency(order.total_price)}</InfoValue>
            </TotalRow>
          </OrderDetailsCard>
          
          {/* Payment Info Card */}
          <PaymentInfoCard>
            <SectionTitle>Payment Information</SectionTitle>
            
            <PaymentMethod>
              <PaymentMethodName>
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </PaymentMethodName>
              <PaymentStatus $status={order.payment_status}>
                {order.payment_status === 'paid' ? 'Paid' : 
                 order.payment_status === 'pending' ? 'Pending' : 'Failed'}
              </PaymentStatus>
            </PaymentMethod>
          </PaymentInfoCard>
          
          {/* Delivery Info Card */}
          <DeliveryCard>
            <SectionTitle>Delivery Information</SectionTitle>
            
            <AddressLabel>Delivery Address:</AddressLabel>
            <AddressValue>{order.delivery_address.fullName}</AddressValue>
            <AddressValue>{order.delivery_address.phone}</AddressValue>
            <AddressValue>{order.delivery_address.addressLine1}</AddressValue>
            {order.delivery_address.addressLine2 && (
              <AddressValue>{order.delivery_address.addressLine2}</AddressValue>
            )}
            {order.delivery_address.landmark && (
              <AddressValue>Landmark: {order.delivery_address.landmark}</AddressValue>
            )}
          </DeliveryCard>
          
          {/* Action Buttons */}
          <ButtonsGroup>
            <PrimaryButton onClick={handleViewOrderHistory}>
              <FaReceipt /> View Order History
            </PrimaryButton>
            <SecondaryButton onClick={handleGoToMenu}>
              <FaUtensils /> Order More Food
            </SecondaryButton>
            <SecondaryButton onClick={handleGoToHome}>
              <FaArrowLeft /> Back to Home
            </SecondaryButton>
          </ButtonsGroup>
        </motion.div>
      </ContentSection>
    </Container>
  );
};

export default OrderSuccess;
