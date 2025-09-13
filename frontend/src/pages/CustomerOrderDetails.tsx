import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPhone, FaMapMarkerAlt, FaClock, FaReceipt, FaDownload, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Order, Vendor } from '../types/index';
import { orderService } from '../services/api';
import UnifiedBillDisplay from '../components/UnifiedBillDisplay';
import OrderStatusTracker from '../components/OrderStatusTracker';
import AppHeader from '../components/common/AppHeader';
import { format } from 'date-fns';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f0f0f0;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const OrderCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const OrderInfo = styled.div`
  flex: 1;
`;

const OrderTitle = styled.h2`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.3rem;
  font-weight: 700;
`;

const OrderMeta = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const StatusBadge = styled.div<{ status: string }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  background: ${(props: { status: string }) => {
    switch (props.status) {
      case 'pending': return '#fff3cd';
      case 'confirmed': return '#d4edda';
      case 'preparing': return '#cce5ff';
      case 'ready': return '#e2e3e5';
      case 'delivered': return '#d1ecf1';
      case 'cancelled': return '#f8d7da';
      default: return '#e9ecef';
    }
  }};

  color: ${(props: { status: string }) => {
    switch (props.status) {
      case 'pending': return '#856404';
      case 'confirmed': return '#155724';
      case 'preparing': return '#004085';
      case 'ready': return '#383d41';
      case 'delivered': return '#0c5460';
      case 'cancelled': return '#721c24';
      default: return '#495057';
    }
  }};
`;

const VendorInfo = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
`;

const VendorName = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
`;

const VendorContact = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  ${(props: { $variant?: 'primary' | 'secondary' }) => props.$variant === 'primary' ? `
    background: #007bff;
    color: white;

    &:hover {
      background: #0056b3;
    }
  ` : `
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;

    &:hover {
      background: #e9ecef;
    }
  `}
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.1rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #dc3545;
  font-size: 1.1rem;
`;

const CustomerOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!orderId) {
      setError('Order ID not provided');
      setLoading(false);
      return;
    }
    
    loadOrderDetails();
  }, [orderId, user, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const orderResult = await orderService.getOrder(orderId!);
      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Order not found');
      }
      
      const orderData = orderResult.data;
      
      // Verify order belongs to current user
      if (orderData.user_id !== user?.id) {
        throw new Error('Unauthorized access to order');
      }
      
      setOrder(orderData);
      
      // For now, we'll skip vendor details fetching since vendorService is not available
      // TODO: Implement vendor details fetching when vendorService is available
      
    } catch (error: any) {
      console.error('Error loading order details:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleDownloadBill = () => {
    // Create a simple text receipt
    if (!order) return;
    
    const receiptText = `
ZOMATIFY - ORDER RECEIPT
========================
Order #: ${order.bill_number || order.id}
Date: ${format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
Customer: ${order.delivery_address?.fullName || 'Customer'}
${vendor ? `Restaurant: ${vendor.business_name}` : ''}

ITEMS:
${order.items.map(item => 
  `${item.quantity}x ${item.menu_item?.name || 'Item'} - ₹${((item.menu_item?.price || 0) * item.quantity).toFixed(2)}`
).join('\n')}

TOTAL: ₹${order.total_price.toFixed(2)}

Thank you for your order!
    `.trim();
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.bill_number || order.id}-receipt.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container>
        <AppHeader title="Order Details" />
        <LoadingSpinner>Loading order details...</LoadingSpinner>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container>
        <AppHeader title="Order Details" />
        <ErrorMessage>
          {error || 'Order not found'}
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <AppHeader title="Order Details" />

      <Header>
        <HeaderContent>
          <BackButton onClick={() => navigate('/orders')}>
            <FaArrowLeft />
          </BackButton>
          <HeaderTitle>Order Details</HeaderTitle>
        </HeaderContent>
      </Header>

      <Content>
        <OrderCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <OrderHeader>
            <OrderInfo>
              <OrderTitle>Order #{order.bill_number || String(order.id).slice(-8)}</OrderTitle>
              <OrderMeta>
                Placed on {format(new Date(order.created_at), 'MMM dd, yyyy')} at {format(new Date(order.created_at), 'HH:mm')}
              </OrderMeta>
              <OrderMeta>
                Order Type: {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
              </OrderMeta>
            </OrderInfo>
            <StatusBadge status={order.status}>
              {order.status}
            </StatusBadge>
          </OrderHeader>

          {vendor && (
            <VendorInfo>
              <VendorName>{vendor.business_name}</VendorName>
              {vendor.phone_number && (
                <VendorContact>
                  <FaPhone />
                  <span>{vendor.phone_number}</span>
                </VendorContact>
              )}
              {vendor.address && (
                <VendorContact>
                  <FaMapMarkerAlt />
                  <span>{vendor.address}</span>
                </VendorContact>
              )}
            </VendorInfo>
          )}

          {/* Detailed Bill Display - Same as Vendor View */}
          <UnifiedBillDisplay
            order={order}
            vendorName={vendor?.business_name}
            showDetailedReceipt={true}
            showAmount={true}
            showStatus={false}
          />

          <ActionButtons>
            <ActionButton $variant="primary" onClick={handlePrintBill}>
              <FaPrint />
              Print Receipt
            </ActionButton>
            <ActionButton $variant="secondary" onClick={handleDownloadBill}>
              <FaDownload />
              Download Receipt
            </ActionButton>
          </ActionButtons>
        </OrderCard>

        {/* Order Status Tracker */}
        <OrderStatusTracker
          order={order}
          vendorPhone={vendor?.phone_number}
          vendorName={vendor?.business_name}
        />
      </Content>
    </Container>
  );
};

export default CustomerOrderDetails;
