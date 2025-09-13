import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheck, FaClock, FaUtensils, FaTruck, FaCheckCircle, FaPhone } from 'react-icons/fa';
import { Order, OrderStatus } from '../types/index';
import realtimeSync from '../services/realtimeSync';
import { format } from 'date-fns';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
`;

const Title = styled.h3`
  color: #2c3e50;
  margin: 0 0 25px 0;
  font-size: 1.3rem;
  font-weight: 700;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin: 20px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const StatusLine = styled.div`
  position: absolute;
  top: 25px;
  left: 25px;
  right: 25px;
  height: 3px;
  background: #e9ecef;
  z-index: 1;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusProgress = styled(motion.div)<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  border-radius: 2px;
  width: ${(props: { progress: number }) => props.progress}%;
  transition: width 0.5s ease;
`;

const StatusStep = styled(motion.div)<{ active: boolean; completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  min-width: 120px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    min-width: auto;
    width: 100%;
    justify-content: flex-start;
    gap: 15px;
  }
`;

const StatusIcon = styled.div<{ active: boolean; completed: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  
  background: ${(props: { active: boolean; completed: boolean }) => {
    if (props.completed) return 'linear-gradient(135deg, #28a745, #20c997)';
    if (props.active) return 'linear-gradient(135deg, #007bff, #0056b3)';
    return '#e9ecef';
  }};
  
  color: ${(props: { active: boolean; completed: boolean }) => {
    if (props.completed || props.active) return 'white';
    return '#6c757d';
  }};
  
  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.div<{ active: boolean; completed: boolean }>`
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  color: ${(props: { active: boolean; completed: boolean }) => {
    if (props.completed) return '#28a745';
    if (props.active) return '#007bff';
    return '#6c757d';
  }};
  
  @media (max-width: 768px) {
    text-align: left;
  }
`;

const StatusTime = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  text-align: center;
  
  @media (max-width: 768px) {
    text-align: left;
  }
`;

const EstimatedTime = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  margin-top: 20px;
  font-weight: 600;
`;

const ContactInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #666;
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

interface OrderStatusTrackerProps {
  order: Order;
  vendorPhone?: string;
  estimatedTime?: string;
  orderTime?: string;
  vendorName?: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: FaClock },
  { key: 'confirmed', label: 'Confirmed', icon: FaCheck },
  { key: 'preparing', label: 'Preparing', icon: FaUtensils },
  { key: 'ready', label: 'Ready', icon: FaCheckCircle },
  { key: 'delivered', label: 'Delivered', icon: FaTruck }
];

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  vendorPhone,
  estimatedTime,
  orderTime,
  vendorName
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  useEffect(() => {
    // Subscribe to real-time order updates
    const unsubscribe = realtimeSync.subscribeToUserOrders(
      order.user_id,
      (update) => {
        if (String(update.new.id) === String(order.id)) {
          setCurrentOrder(update.new);
        }
      }
    );

    return unsubscribe;
  }, [order.id, order.user_id]);
  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentOrder.status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 0;

  const getStatusTime = (stepKey: string) => {
    if (stepKey === 'pending' && orderTime) {
      return new Date(orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  };

  return (
    <Container>
      <Title>Order Status {vendorName && `- ${vendorName}`}</Title>
      
      <StatusContainer>
        <StatusLine>
          <StatusProgress
            progress={progress}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </StatusLine>
        
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const IconComponent = step.icon;
          
          return (
            <StatusStep
              key={step.key}
              active={isActive}
              completed={isCompleted}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatusIcon active={isActive} completed={isCompleted}>
                <IconComponent />
              </StatusIcon>
              <div>
                <StatusLabel active={isActive} completed={isCompleted}>
                  {step.label}
                </StatusLabel>
                {getStatusTime(step.key) && (
                  <StatusTime>{getStatusTime(step.key)}</StatusTime>
                )}
              </div>
            </StatusStep>
          );
        })}
      </StatusContainer>
      
      {currentOrder.scheduled_for && (
        <ScheduledPickupBadge>
          <FaClock style={{ marginRight: '5px' }} />
          Scheduled Pickup at {format(new Date(currentOrder.scheduled_for), 'HH:mm')}
        </ScheduledPickupBadge>
      )}

      {estimatedTime && currentOrder.status !== 'delivered' && (
        <EstimatedTime>
          🕒 Estimated delivery time: {estimatedTime}
        </EstimatedTime>
      )}

      {currentOrder.status === 'delivered' && (
        <EstimatedTime style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
          ✅ Order delivered successfully! Thank you for choosing us.
        </EstimatedTime>
      )}

      {vendorPhone && (
        <ContactInfo>
          <FaPhone />
          <span>Restaurant Contact: {vendorPhone}</span>
        </ContactInfo>
      )}
    </Container>
  );
};

export default OrderStatusTracker;
