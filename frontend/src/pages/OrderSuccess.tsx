import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaReceipt, FaArrowLeft, FaUtensils, FaHome, FaPrint, FaDownload } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { orderService } from '../services/api';
import { Order } from '../types/index';
import { formatCurrency, formatDate, normalizeOrder, formatId } from '../utils/formatters';
import { toast } from 'react-toastify';

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

const ReceiptCard = styled(motion.div)`
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border: 2px dashed #ddd;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: -5px;
    left: 20px;
    right: 20px;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 5px,
      #ddd 5px,
      #ddd 10px
    );
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 20px;
    right: 20px;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 5px,
      #ddd 5px,
      #ddd 10px
    );
  }
`;

const ReceiptHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #000;
`;

const BusinessName = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
`;

const ReceiptTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const BillNumber = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #FF5A5F;
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 8px;
  border: 2px solid #FF5A5F;
  margin: 15px 0;
  display: inline-block;
`;

const ReceiptInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.9rem;
`;

const ReceiptActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #E8474C;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const SecondaryActionButton = styled(ActionButton)`
  background-color: #6c757d;
  
  &:hover {
    background-color: #565e64;
  }
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
          setOrder(normalizeOrder(data));
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

  // Generate receipt text for download
  const generateReceiptText = () => {
    if (!order) return '';
    
    const today = new Date();
    const receiptText = `
=====================================
           ZOMATIFY RECEIPT
=====================================

Bill No: ${order.bill_number || 'N/A'}
Order ID: ${formatId(order.id)}
Date: ${formatDate(order.created_at, 'MMM dd, yyyy • h:mm a')}

-------------------------------------
Customer Details:
-------------------------------------
Name: ${order.delivery_address?.fullName || 'N/A'}
Phone: ${order.delivery_address?.phone || 'N/A'}
Address: ${order.delivery_address?.addressLine1 || 'N/A'}
${order.delivery_address?.addressLine2 ? order.delivery_address.addressLine2 + '\n' : ''}
${order.delivery_address?.landmark ? 'Landmark: ' + order.delivery_address.landmark + '\n' : ''}
-------------------------------------
Order Items:
-------------------------------------
${order.items.map((item, index) => {
  const menuItem = item.menu_item;
  const itemTotal = (menuItem?.price || 0) * item.quantity;
  return `${index + 1}. ${menuItem?.name || 'Unknown item'}
    Qty: ${item.quantity} x ₹${menuItem?.price || 0}
    Amount: ₹${itemTotal.toFixed(2)}`;
}).join('\n')}

-------------------------------------
Payment Summary:
-------------------------------------
Subtotal:        ₹${order.total_price.toFixed(2)}
Delivery Fee:    ${order.total_price > 300 ? 'Free' : '₹30.00'}
-------------------------------------
Total Amount:    ₹${order.total_price.toFixed(2)}
-------------------------------------

Payment Method: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
Payment Status: ${order.payment_status === 'paid' ? 'PAID' : order.payment_status?.toUpperCase()}

${order.payment_status === 'paid' ? '✓ Payment confirmed via Razorpay' : ''}

=====================================
      Thank you for your order!
     Visit us again at Zomatify
=====================================

Generated on: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}
`;
    
    return receiptText;
  };

  // Print receipt
  const handlePrintReceipt = () => {
    if (!order) return;
    
    const receiptContent = generateReceiptText();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order #${order.bill_number || formatId(order.id)}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 20px; 
                font-size: 12px; 
                line-height: 1.4;
              }
              pre { 
                white-space: pre-wrap; 
                word-wrap: break-word; 
              }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Download receipt
  const handleDownloadReceipt = () => {
    if (!order) return;
    
    const receiptContent = generateReceiptText();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zomatify-receipt-${order.bill_number || formatId(order.id)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded successfully!');
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
            <SuccessTitle>Payment Successful!</SuccessTitle>
            <SuccessMessage>
              Your order has been placed and payment confirmed. Your receipt is ready below.
            </SuccessMessage>
          </SuccessCard>

          {/* Enhanced Receipt Card */}
          <ReceiptCard
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ReceiptHeader>
              <BusinessName>ZOMATIFY</BusinessName>
              <ReceiptTitle>ORDER RECEIPT</ReceiptTitle>
              <BillNumber>Bill #{order.bill_number || 'N/A'}</BillNumber>
            </ReceiptHeader>

            <ReceiptInfo>
              <span><strong>Order ID:</strong></span>
              <span>{formatId(order.id)}</span>
            </ReceiptInfo>
            <ReceiptInfo>
              <span><strong>Date & Time:</strong></span>
              <span>{formatDate(order.created_at, 'MMM dd, yyyy • h:mm a')}</span>
            </ReceiptInfo>
            <ReceiptInfo>
              <span><strong>Customer:</strong></span>
              <span>{order.delivery_address?.fullName || 'N/A'}</span>
            </ReceiptInfo>
            <ReceiptInfo>
              <span><strong>Phone:</strong></span>
              <span>{order.delivery_address?.phone || 'N/A'}</span>
            </ReceiptInfo>
            
            <Divider style={{ margin: '15px 0' }} />
            
            <SectionTitle style={{ textAlign: 'left', marginBottom: '10px' }}>
              <FaReceipt /> Items Ordered
            </SectionTitle>
            
            <OrderItemsList>
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
            </OrderItemsList>
            
            <Divider />
            
            <OrderInfo>
              <InfoLabel>Subtotal</InfoLabel>
              <InfoValue>{formatCurrency(order.total_price)}</InfoValue>
            </OrderInfo>
            
            <OrderInfo>
              <InfoLabel>Delivery Fee</InfoLabel>
              <InfoValue>
                {order.total_price > 300 ? 'Free' : formatCurrency(30)}
              </InfoValue>
            </OrderInfo>
            
            <TotalRow style={{ borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px' }}>
              <InfoLabel><strong>TOTAL AMOUNT</strong></InfoLabel>
              <InfoValue><strong>{formatCurrency(order.total_price)}</strong></InfoValue>
            </TotalRow>

            <ReceiptInfo style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <span><strong>Payment Method:</strong></span>
              <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </ReceiptInfo>
            <ReceiptInfo>
              <span><strong>Payment Status:</strong></span>
              <span style={{ 
                color: order.payment_status === 'paid' ? '#4CAF50' : '#FFC107',
                fontWeight: 'bold'
              }}>
                {order.payment_status === 'paid' ? '✓ PAID' : order.payment_status?.toUpperCase()}
              </span>
            </ReceiptInfo>

            {order.payment_status === 'paid' && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  ✓ Payment Confirmed via Razorpay
                </span>
              </div>
            )}

            <ReceiptActions>
              <ActionButton onClick={handlePrintReceipt}>
                <FaPrint /> Print Receipt
              </ActionButton>
              <ActionButton onClick={handleDownloadReceipt}>
                <FaDownload /> Download
              </ActionButton>
            </ReceiptActions>
          </ReceiptCard>
          
          {/* Delivery Info Card */}
          <DeliveryCard>
            <SectionTitle>Delivery Information</SectionTitle>
            
            {order.delivery_address && (
              <>
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
              </>
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

          {/* Order Status Info */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>
              📋 Order Status: {order.status?.toUpperCase()}
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
              {order.payment_status === 'paid' 
                ? 'Payment held in escrow until vendor accepts your order'
                : 'Complete payment to proceed with your order'
              }
            </p>
          </div>
        </motion.div>
      </ContentSection>
    </Container>
  );
};

export default OrderSuccess;
