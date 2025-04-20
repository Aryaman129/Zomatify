import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaUtensils, FaTruck, FaExclamationTriangle, FaInfoCircle, FaGift, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/api';
import { Notification, NotificationType } from '../types';
import { subscribeToRealtimeUpdates } from '../services/supabaseClient';
import { toast } from 'react-toastify';
import supabase from '../services/supabaseClient';

const PageContainer = styled.div`
  padding-bottom: 80px;
` as any;

const ContentSection = styled.div`
  padding: 16px;
`;

const InfoCard = styled.div`
  background-color: #F5F8FF;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
`;

const InfoIcon = styled.div`
  margin-right: 16px;
  color: #2196F3;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #333;
  line-height: 1.5;
`;

const TabsContainer = styled.div`
  display: flex;
  background-color: white;
  border-radius: 30px;
  padding: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

interface TabProps {
  $isActive: boolean;
}

const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 25px;
  background-color: ${(props: TabProps) => props.$isActive ? '#FF5A5F' : 'transparent'};
  color: ${(props: TabProps) => props.$isActive ? 'white' : '#333'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const NoNotificationsMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface NotificationCardProps {
  $isUnread: boolean;
  color: string;
}

const NotificationCard = styled(motion.div)<NotificationCardProps>`
  background-color: ${(props: NotificationCardProps) => props.$isUnread ? '#F9F9F9' : 'white'};
  border-left: 5px solid ${(props: NotificationCardProps) => {
    switch (props.color) {
      case 'info': return '#2196F3';
      case 'success': return '#4CAF50';
      case 'warning': return '#FFC107';
      case 'danger': return '#F44336';
      default: return '#9E9E9E';
    }
  }};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  
  ${(props: NotificationCardProps) => props.$isUnread && `
    &::after {
      content: '';
      position: absolute;
      top: 16px;
      right: 16px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #FF5A5F;
    }
  `}
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const NotificationIcon = styled.div`
  width: 42px;
  height: 42px;
  background-color: ${(props: { color: string }) => {
    switch (props.color) {
      case 'info': return '#E3F2FD';
      case 'success': return '#E8F5E9';
      case 'warning': return '#FFF8E1';
      case 'danger': return '#FFEBEE';
      default: return '#EEEEEE';
    }
  }};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: ${(props: { color: string }) => {
    switch (props.color) {
      case 'info': return '#2196F3';
      case 'success': return '#4CAF50';
      case 'warning': return '#FFC107';
      case 'danger': return '#F44336';
      default: return '#9E9E9E';
    }
  }};
`;

const NotificationTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const NotificationTime = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
`;

const NotificationBody = styled.div`
  font-size: 1rem;
  color: #333;
  line-height: 1.5;
  margin-left: 54px; /* Align with title (icon width + right margin) */
`;

const ActionButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  margin-top: 12px;
  margin-left: 54px;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const MarkAllReadButton = styled.button`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 30px;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

// Animation variants
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 }
  }
};

// Get icon component by notification type
const getIconByType = (type: NotificationType) => {
  switch (type) {
    case 'order_status':
      return <FaUtensils size={20} />;
    case 'delivery':
      return <FaTruck size={20} />;
    case 'system':
      return <FaInfoCircle size={20} />;
    case 'alert':
      return <FaExclamationTriangle size={20} />;
    default:
      return <FaBell size={20} />;
  }
};

// Get notification color by type
const getColorByType = (type: NotificationType) => {
  switch (type) {
    case 'order_status':
      return 'success';
    case 'delivery':
      return 'info';
    case 'alert':
      return 'danger';
    case 'system':
      return 'warning';
    default:
      return 'info';
  }
};

// Format notification time
const formatNotificationTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  return format(date, 'MMM dd, h:mm a');
};

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  // Filtered notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);
  
  // Count of unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { success, data, error } = await notificationService.getUserNotifications();
        
        if (success && data) {
          setNotifications(data);
        } else {
          console.error('Failed to fetch notifications:', error);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user]);
  
  // Subscribe to real-time notifications using Supabase
  useEffect(() => {
    if (!user) return;
    
    // Create a new channel to listen for notifications changes
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // New notification
            const newNotification = payload.new as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast for new notification with action
            toast.info(
              `New notification: ${newNotification.title}`,
              {
                onClick: () => {
                  navigate(newNotification.data?.actionUrl || '/');
                  handleMarkAsRead(newNotification.id);
                }
              }
            );
          } else if (payload.eventType === 'UPDATE') {
            // Updated notification
            const updatedNotification = payload.new as Notification;
            
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id ? updatedNotification : notification
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Deleted notification
            const deletedNotification = payload.old as Notification;
            
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            );
          }
        }
      )
      .subscribe();
    
    // Cleanup function to remove the channel when component unmounts
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, navigate]);
  
  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const { success } = await notificationService.markNotificationAsRead(id);
      
      if (success) {
        setNotifications((prev: Notification[]) => 
          prev.map((notification: Notification) => 
            notification.id === id ? { ...notification, read: true } : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      const { success } = await notificationService.markAllNotificationsAsRead();
      
      if (success) {
        setNotifications((prev: Notification[]) => 
          prev.map((notification: Notification) => ({ ...notification, read: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };
  
  // Handle notification click - can navigate to different routes based on notification data
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    if (notification.type === 'order_status' && notification.data?.orderId) {
      navigate(`/orders/${notification.data.orderId}`);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'all' | 'unread') => {
    setActiveTab(tab);
  };
  
  if (loading) {
    return (
      <PageContainer>
        <AppHeader title="Notifications" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <div className="loader"></div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <AppHeader title="Notifications" />
      
      <ContentSection>
        {/* Info card */}
        <InfoCard>
          <InfoIcon>
            <FaInfoCircle size={24} />
          </InfoIcon>
          <InfoText>
            Receive real-time updates about your orders and important announcements.
          </InfoText>
        </InfoCard>
        
        {/* Tabs */}
        <TabsContainer>
          <Tab
            $isActive={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
          >
            All
          </Tab>
          <Tab
            $isActive={activeTab === 'unread'}
            onClick={() => handleTabChange('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Tab>
        </TabsContainer>
        
        {/* Mark all as read button - show only if there are unread notifications */}
        {unreadCount > 0 && (
          <MarkAllReadButton onClick={handleMarkAllAsRead}>
            <FaCheck size={16} /> Mark all as read
          </MarkAllReadButton>
        )}
        
        {/* Notifications list */}
        {filteredNotifications.length > 0 ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <NotificationList>
              <AnimatePresence>
                {filteredNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    layout
                    exit="exit"
                  >
                    <NotificationCard
                      $isUnread={!notification.read}
                      color={getColorByType(notification.type)}
                      onClick={() => handleNotificationClick(notification)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <NotificationHeader>
                        <NotificationIcon color={getColorByType(notification.type)}>
                          {getIconByType(notification.type)}
                        </NotificationIcon>
                        <div>
                          <NotificationTitle>{notification.title}</NotificationTitle>
                          <NotificationTime>
                            {formatNotificationTime(notification.created_at)}
                          </NotificationTime>
                        </div>
                      </NotificationHeader>
                      
                      <NotificationBody>
                        {notification.body}
                      </NotificationBody>
                      
                      {notification.data?.actionText && (
                        <ActionButton onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (notification.data?.actionUrl) {
                            navigate(notification.data.actionUrl);
                          }
                        }}>
                          {notification.data.actionText}
                        </ActionButton>
                      )}
                    </NotificationCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </NotificationList>
          </motion.div>
        ) : (
          <NoNotificationsMessage>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔔</div>
            <p>No {activeTab === 'unread' ? 'unread ' : ''}notifications</p>
            {activeTab === 'unread' && notifications.length > 0 && (
              <p style={{ marginTop: '8px' }}>
                <button 
                  onClick={() => setActiveTab('all')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF5A5F',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  View all notifications
                </button>
              </p>
            )}
          </NoNotificationsMessage>
        )}
      </ContentSection>
    </PageContainer>
  );
};

export default Notifications;
