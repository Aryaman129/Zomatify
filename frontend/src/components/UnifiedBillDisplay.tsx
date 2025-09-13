import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Order } from '../types/index';
import { FaPhone, FaMapMarkerAlt, FaClock, FaReceipt } from 'react-icons/fa';

const BillContainer = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }
`;

const BillHeader = styled.div`
  position: relative;
  z-index: 2;
`;

const BillTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.9;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CustomerName = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2;
`;

const BillNumber = styled.div`
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 2;
  
  &::before {
    content: '#';
    opacity: 0.7;
    margin-right: 4px;
  }
`;

const BillDate = styled.div`
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
  position: relative;
  z-index: 2;
`;

const BillAmount = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 2;
`;

const VendorInfo = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: 8px;
  position: relative;
  z-index: 2;
`;

const StatusBadge = styled.div<{ status: string }>`
  position: absolute;
  top: 15px;
  right: 15px;
  background: ${(props: { status: string }) => {
    switch (props.status) {
      case 'pending': return 'rgba(255, 193, 7, 0.9)';
      case 'confirmed': return 'rgba(40, 167, 69, 0.9)';
      case 'preparing': return 'rgba(0, 123, 255, 0.9)';
      case 'ready': return 'rgba(255, 87, 34, 0.9)';
      case 'delivered': return 'rgba(76, 175, 80, 0.9)';
      default: return 'rgba(108, 117, 125, 0.9)';
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 3;
`;

// Compact version for smaller spaces
const CompactBillContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
`;

const CompactCustomerName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
`;

const CompactBillNumber = styled.div`
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 4px;
`;

const CompactBillDate = styled.div`
  font-size: 0.85rem;
  opacity: 0.9;
`;

// Detailed Receipt Component
const DetailedReceiptContainer = styled.div`
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', monospace;
`;

const ReceiptHeader = styled.div`
  text-align: center;
  border-bottom: 2px dashed #ccc;
  padding-bottom: 15px;
  margin-bottom: 15px;
`;

const ReceiptTitle = styled.h2`
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 700;
`;

const ReceiptSubtitle = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const ReceiptInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const ReceiptLabel = styled.span`
  color: #666;
  font-weight: 600;
`;

const ReceiptValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const ItemsList = styled.div`
  border-bottom: 1px dashed #ccc;
  padding-bottom: 15px;
  margin-bottom: 15px;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const ItemDetails = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 600;
  color: #333;
`;

const ItemQuantity = styled.div`
  color: #666;
  font-size: 0.8rem;
`;

const ItemPrice = styled.div`
  font-weight: 600;
  color: #333;
  min-width: 60px;
  text-align: right;
`;

const TotalSection = styled.div`
  border-bottom: 2px dashed #ccc;
  padding-bottom: 15px;
  margin-bottom: 15px;
`;

const TotalRow = styled.div<{ $isGrandTotal?: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: ${(props: { $isGrandTotal?: boolean }) => props.$isGrandTotal ? '1.1rem' : '0.9rem'};
  font-weight: ${(props: { $isGrandTotal?: boolean }) => props.$isGrandTotal ? '700' : '500'};
  color: ${(props: { $isGrandTotal?: boolean }) => props.$isGrandTotal ? '#333' : '#666'};

  ${(props: { $isGrandTotal?: boolean }) => props.$isGrandTotal && `
    border-top: 1px solid #ccc;
    padding-top: 8px;
    margin-top: 8px;
  `}
`;

const ContactInfo = styled.div`
  text-align: center;
  color: #666;
  font-size: 0.8rem;
  line-height: 1.4;
`;

const ContactRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 5px;
`;

const ScheduledPickupBadge = styled.div`
  background: #28a745;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  margin: 10px 0;
  text-transform: uppercase;
`;

interface UnifiedBillDisplayProps {
  order: Order;
  vendorName?: string;
  vendorPhone?: string;
  compact?: boolean;
  showAmount?: boolean;
  showStatus?: boolean;
  showDetailedReceipt?: boolean;
  className?: string;
}

const UnifiedBillDisplay: React.FC<UnifiedBillDisplayProps> = ({
  order,
  vendorName,
  vendorPhone,
  compact = false,
  showAmount = false,
  showStatus = false,
  showDetailedReceipt = false,
  className
}) => {
  const customerName = order.delivery_address?.fullName || 'Customer';
  const customerPhone = order.delivery_address?.phone || '';
  const billNumber = order.bill_number || 'N/A';
  const billDate = order.bill_date || order.created_at;
  const formattedDate = format(new Date(billDate), 'MMM dd, yyyy');
  const formattedTime = format(new Date(order.created_at), 'HH:mm');

  // Calculate bill breakdown
  const subtotal = order.items.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
  const deliveryFee = order.order_type === 'delivery' ? 30 : 0; // ₹30 delivery fee
  const serviceCharge = 3; // Fixed ₹3 service charge as discussed
  const total = subtotal + deliveryFee + serviceCharge;

  // Show detailed receipt
  if (showDetailedReceipt) {
    return (
      <DetailedReceiptContainer className={className}>
        <ReceiptHeader>
          <ReceiptTitle>
            <FaReceipt style={{ marginRight: '8px' }} />
            RECEIPT
          </ReceiptTitle>
          <ReceiptSubtitle>{vendorName || 'Restaurant'}</ReceiptSubtitle>
          <ReceiptSubtitle>Bill #{billNumber}</ReceiptSubtitle>
        </ReceiptHeader>

        <div>
          <ReceiptInfo>
            <ReceiptLabel>Date & Time:</ReceiptLabel>
            <ReceiptValue>{formattedDate} {formattedTime}</ReceiptValue>
          </ReceiptInfo>
          <ReceiptInfo>
            <ReceiptLabel>Customer:</ReceiptLabel>
            <ReceiptValue>{customerName}</ReceiptValue>
          </ReceiptInfo>
          {customerPhone && (
            <ReceiptInfo>
              <ReceiptLabel>Phone:</ReceiptLabel>
              <ReceiptValue>{customerPhone}</ReceiptValue>
            </ReceiptInfo>
          )}
          <ReceiptInfo>
            <ReceiptLabel>Order Type:</ReceiptLabel>
            <ReceiptValue>{order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</ReceiptValue>
          </ReceiptInfo>
          {order.scheduled_for && (
            <ScheduledPickupBadge>
              <FaClock style={{ marginRight: '5px' }} />
              Scheduled Pickup at {format(new Date(order.scheduled_for), 'HH:mm')}
            </ScheduledPickupBadge>
          )}
        </div>

        <ItemsList>
          {order.items.map((item, index) => (
            <ItemRow key={index}>
              <ItemDetails>
                <ItemName>{item.menu_item.name}</ItemName>
                <ItemQuantity>Qty: {item.quantity} × ₹{item.menu_item.price}</ItemQuantity>
                {item.special_instructions && (
                  <ItemQuantity>Note: {item.special_instructions}</ItemQuantity>
                )}
              </ItemDetails>
              <ItemPrice>₹{(item.menu_item.price * item.quantity).toFixed(2)}</ItemPrice>
            </ItemRow>
          ))}
        </ItemsList>

        <TotalSection>
          <TotalRow>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </TotalRow>
          {deliveryFee > 0 && (
            <TotalRow>
              <span>Delivery Fee:</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </TotalRow>
          )}
          <TotalRow>
            <span>Service Charge:</span>
            <span>₹{serviceCharge.toFixed(2)}</span>
          </TotalRow>
          <TotalRow $isGrandTotal>
            <span>TOTAL:</span>
            <span>₹{total.toFixed(2)}</span>
          </TotalRow>
        </TotalSection>

        <ContactInfo>
          {vendorPhone && (
            <ContactRow>
              <FaPhone />
              <span>Restaurant: {vendorPhone}</span>
            </ContactRow>
          )}
          <ContactRow>
            <FaMapMarkerAlt />
            <span>Thank you for your order!</span>
          </ContactRow>
        </ContactInfo>
      </DetailedReceiptContainer>
    );
  }

  if (compact) {
    return (
      <CompactBillContainer className={className}>
        <CompactCustomerName>{customerName}</CompactCustomerName>
        <CompactBillNumber>Bill {billNumber}</CompactBillNumber>
        <CompactBillDate>{formattedDate}</CompactBillDate>
        {showAmount && (
          <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: '600' }}>
            ₹{order.total_price.toFixed(2)}
          </div>
        )}
      </CompactBillContainer>
    );
  }

  return (
    <BillContainer
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showStatus && (
        <StatusBadge status={order.status}>
          {order.status}
        </StatusBadge>
      )}

      <BillHeader>
        <BillTitle>Order Verification</BillTitle>
        <CustomerName>{customerName}</CustomerName>
        <BillNumber>{billNumber}</BillNumber>
        <BillDate>
          {formattedDate} • {formattedTime}
        </BillDate>

        {showAmount && (
          <BillAmount>
            Total: ₹{order.total_price.toFixed(2)}
          </BillAmount>
        )}

        {vendorName && (
          <VendorInfo>
            {vendorName}
          </VendorInfo>
        )}
      </BillHeader>
    </BillContainer>
  );
};

// Hook for consistent bill formatting across the app
export const useBillFormat = () => {
  const formatBillInfo = (order: Order) => {
    return {
      customerName: order.delivery_address?.fullName || 'Customer',
      billNumber: order.bill_number || 'N/A',
      billDate: order.bill_date || order.created_at,
      formattedDate: format(new Date(order.bill_date || order.created_at), 'MMM dd, yyyy'),
      formattedTime: format(new Date(order.created_at), 'HH:mm'),
      displayText: `${order.delivery_address?.fullName || 'Customer'} - Bill #${order.bill_number || 'N/A'} - ${format(new Date(order.bill_date || order.created_at), 'MMM dd, yyyy')}`
    };
  };

  const getBillVerificationCode = (order: Order) => {
    // Generate a simple verification code based on order details
    const customerName = order.delivery_address?.fullName || 'Customer';
    const billNumber = order.bill_number || 0;
    const dateStr = format(new Date(order.created_at), 'ddMMyyyy');
    
    // Simple hash-like code for verification
    const code = `${customerName.substring(0, 2).toUpperCase()}${billNumber}${dateStr.substring(4, 8)}`;
    return code;
  };

  return {
    formatBillInfo,
    getBillVerificationCode
  };
};

export default UnifiedBillDisplay;
