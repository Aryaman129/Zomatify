import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaShoppingBag, FaPhone, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Order } from '../types/index';
import realtimeSync from '../services/realtimeSync';
import { format } from 'date-fns';

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
`;

const NotificationCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-left: 5px solid #28a745;
  position: relative;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const NotificationTitle = styled.h4`
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  
  &:hover {
    background: #f5f5f5;
    color: #666;
  }
`;

const OrderDetails = styled.div`
  margin-bottom: 15px;
`;

const OrderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const OrderLabel = styled.span`
  color: #666;
  font-weight: 600;
`;

const OrderValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const CustomerInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
`;

const CustomerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #666;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${(props: { $variant?: 'primary' | 'secondary' }) => props.$variant === 'primary' ? `
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  ` : `
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  `}
`;

const NotificationBadge = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 1001;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
`;

interface VendorNotificationSystemProps {
  vendorId: string;
  onOrderAction?: (orderId: string, action: 'accept' | 'reject') => void;
}

const VendorNotificationSystem: React.FC<VendorNotificationSystemProps> = ({
  vendorId,
  onOrderAction
}) => {
  const [notifications, setNotifications] = useState<Order[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    // Subscribe to new orders for this vendor
    const unsubscribe = realtimeSync.subscribeToVendorOrders(
      vendorId,
      (update) => {
        if (update.eventType === 'INSERT' && update.new.status === 'pending') {
          const newOrder = update.new;
          
          // Add to notifications
          setNotifications(prev => [newOrder, ...prev]);
          
          // Show toast notification
          toast.success(`New order received! Order #${newOrder.bill_number}`, {
            position: "top-right",
            autoClose: 5000,
          });
          
          // Play notification sound (if available)
          try {
            const audio = new Audio('/notification-sound.mp3');
            audio.play().catch(() => {
              // Ignore audio play errors (user interaction required)
            });
          } catch (error) {
            // Ignore audio errors
          }
        }
      }
    );

    return unsubscribe;
  }, [vendorId]);

  const handleAcceptOrder = async (orderId: number) => {
    try {
      if (onOrderAction) {
        await onOrderAction(String(orderId), 'accept');
      }

      // Remove from notifications
      setNotifications(prev => prev.filter(order => order.id !== orderId));
      toast.success('Order accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      if (onOrderAction) {
        await onOrderAction(String(orderId), 'reject');
      }

      // Remove from notifications
      setNotifications(prev => prev.filter(order => order.id !== orderId));
      toast.success('Order rejected');
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const dismissNotification = (orderId: number) => {
    setNotifications(prev => prev.filter(order => order.id !== orderId));
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {!showNotifications && (
        <NotificationBadge onClick={toggleNotifications}>
          {notifications.length}
        </NotificationBadge>
      )}
      
      {showNotifications && (
        <NotificationContainer>
          <AnimatePresence>
            {notifications.map((order) => (
              <NotificationCard
                key={order.id}
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <NotificationHeader>
                  <NotificationTitle>
                    <FaBell />
                    New Order Received!
                  </NotificationTitle>
                  <CloseButton onClick={() => dismissNotification(order.id)}>
                    <FaTimes />
                  </CloseButton>
                </NotificationHeader>

                <OrderDetails>
                  <OrderInfo>
                    <OrderLabel>Order #:</OrderLabel>
                    <OrderValue>{order.bill_number}</OrderValue>
                  </OrderInfo>
                  <OrderInfo>
                    <OrderLabel>Time:</OrderLabel>
                    <OrderValue>{format(new Date(order.created_at), 'HH:mm')}</OrderValue>
                  </OrderInfo>
                  <OrderInfo>
                    <OrderLabel>Total:</OrderLabel>
                    <OrderValue>₹{order.total_price.toFixed(2)}</OrderValue>
                  </OrderInfo>
                  <OrderInfo>
                    <OrderLabel>Type:</OrderLabel>
                    <OrderValue>{order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</OrderValue>
                  </OrderInfo>
                </OrderDetails>

                <CustomerInfo>
                  <CustomerRow>
                    <FaUser />
                    <span>{order.delivery_address?.fullName || 'Customer'}</span>
                  </CustomerRow>
                  {order.delivery_address?.phone && (
                    <CustomerRow>
                      <FaPhone />
                      <span>{order.delivery_address.phone}</span>
                    </CustomerRow>
                  )}
                </CustomerInfo>

                <ActionButtons>
                  <ActionButton 
                    $variant="primary" 
                    onClick={() => handleAcceptOrder(order.id)}
                  >
                    Accept Order
                  </ActionButton>
                  <ActionButton 
                    $variant="secondary" 
                    onClick={() => handleRejectOrder(order.id)}
                  >
                    Reject
                  </ActionButton>
                </ActionButtons>
              </NotificationCard>
            ))}
          </AnimatePresence>
        </NotificationContainer>
      )}
    </>
  );
};

export default VendorNotificationSystem;
