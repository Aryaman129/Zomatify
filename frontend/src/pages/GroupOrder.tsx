import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUsers, FaShareAlt, FaLink, FaCheck, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppHeader from '../components/common/AppHeader';
import { groupOrderService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { GroupOrder as GroupOrderType, CartItem } from '../types';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentContainer = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const CreateGroupSection = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.1rem;
  margin-bottom: 20px;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.2);
  }
`;

const CreateButton = styled.button`
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  
  &:hover {
    background-color: #E54B50;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ActiveGroupOrder = styled(Card)`
  border-left: 5px solid #4CAF50;
`;

const GroupOrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const GroupOrderName = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
`;

const ExpiryInfo = styled.div`
  font-size: 1rem;
  color: #666;
`;

const ParticipantsList = styled.div`
  margin: 20px 0;
`;

const ParticipantItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
`;

const ParticipantStatus = styled.div<{ $confirmed: boolean }>`
  color: ${(props: { $confirmed: boolean }) => props.$confirmed ? '#4CAF50' : '#999'};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ShareSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
`;

const ShareTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
`;

const ShareLinkContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
`;

const LinkDisplay = styled.div`
  flex: 1;
  padding: 12px;
  font-size: 1rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CopyButton = styled.button`
  background-color: #333;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #555;
  }
`;

const ShareButton = styled.button`
  background-color: #4267B2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    background-color: #365899;
  }
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
`;

const ActionButton = styled.button<{ $isPrimary?: boolean }>`
  background-color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? '#FF5A5F' : '#f0f0f0'};
  color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? 'white' : '#333'};
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background-color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? '#E54B50' : '#e0e0e0'};
  }
`;

const MyOrderSection = styled(Card)`
  border-left: 5px solid #2196F3;
`;

const OrderSummary = styled.div`
  margin-top: 16px;
`;

const ItemsList = styled.div`
  margin: 16px 0;
`;

const NoItemsMessage = styled.p`
  text-align: center;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  color: #666;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ItemQuantity = styled.span`
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-weight: 600;
  color: #333;
  min-width: 30px;
  text-align: center;
`;

const ItemName = styled.span`
  font-size: 1.1rem;
`;

const ItemPrice = styled.span`
  font-weight: 600;
  color: #333;
`;

const AddItemsButton = styled.button`
  width: 100%;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const ConfirmButton = styled.button`
  width: 100%;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  
  &:hover {
    background-color: #388E3C;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 16px;
`;

const EmptyStateText = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 24px;
`;

const formatDatetime = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if date is tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise, show full date and time
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric' 
  }) + ' at ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

interface GroupOrderPageProps {
  // Add props if needed
}

const GroupOrderPage: React.FC<GroupOrderPageProps> = () => {
  const { user } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [orderName, setOrderName] = useState('');
  const [expiryHours, setExpiryHours] = useState('2');
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrderType | null>(null);
  const [myItems, setMyItems] = useState<CartItem[]>([]);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  
  // Calculate expiry time for display
  const expiryTime = activeGroupOrder 
    ? formatDatetime(activeGroupOrder.expiry_time) 
    : '';
  
  // Fetch active group orders on mount
  useEffect(() => {
    const fetchActiveGroupOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { success, data } = await groupOrderService.getUserGroupOrders(user.id);
        
        if (success && data && data.length > 0) {
          // Find the first active group order (status 'open')
          const openOrder = data.find(order => order.status === 'open');
          if (openOrder) {
            setActiveGroupOrder(openOrder);
            
            // Find my items and confirmation status
            const myParticipant = openOrder.participants.find(p => p.user_id === user.id);
            if (myParticipant) {
              setMyItems(myParticipant.items);
              setHasConfirmed(myParticipant.has_confirmed);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch group orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveGroupOrders();
  }, [user]);
  
  // Create a new group order
  const handleCreateGroupOrder = async () => {
    if (!user) {
      toast.error('You must be logged in to create a group order');
      navigate('/login');
      return;
    }
    
    if (!orderName.trim()) {
      toast.error('Please enter a name for your group order');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + parseInt(expiryHours));
      
      const { success, data, error } = await groupOrderService.createGroupOrder(
        user.id,
        orderName.trim(),
        expiryTime.toISOString()
      );
      
      if (success && data) {
        setActiveGroupOrder(data);
        setOrderName('');
        toast.success('Group order created successfully!');
      } else {
        toast.error(error || 'Failed to create group order');
      }
    } catch (error) {
      console.error('Error creating group order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Add items from cart to group order
  const handleAddItems = async () => {
    if (!user || !activeGroupOrder) return;
    
    try {
      setLoading(true);
      
      const { success, data, error } = await groupOrderService.updateGroupOrderItems(
        activeGroupOrder.id,
        user.id,
        items
      );
      
      if (success && data) {
        setActiveGroupOrder(data);
        
        // Update my items
        const myParticipant = data.participants.find(p => p.user_id === user.id);
        if (myParticipant) {
          setMyItems(myParticipant.items);
        }
        
        toast.success('Items added to group order!');
      } else {
        toast.error(error || 'Failed to add items');
      }
    } catch (error) {
      console.error('Error adding items:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Confirm participation
  const handleConfirm = async () => {
    if (!user || !activeGroupOrder) return;
    
    try {
      setLoading(true);
      
      const { success, data, error } = await groupOrderService.confirmGroupOrderParticipation(
        activeGroupOrder.id,
        user.id
      );
      
      if (success && data) {
        setActiveGroupOrder(data);
        setHasConfirmed(true);
        toast.success('Your order is confirmed!');
      } else {
        toast.error(error || 'Failed to confirm order');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Close group order and place final order
  const handleCloseAndOrder = async () => {
    if (!user || !activeGroupOrder) return;
    
    try {
      setLoading(true);
      
      const { success, data, error } = await groupOrderService.closeAndPlaceGroupOrder(
        activeGroupOrder.id,
        user.id
      );
      
      if (success && data) {
        navigate(`/order-success/${data.order.id}`);
        toast.success('Group order placed successfully!');
      } else {
        toast.error(error || 'Failed to place group order');
      }
    } catch (error) {
      console.error('Error placing group order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Copy invitation link to clipboard
  const handleCopyLink = () => {
    if (!activeGroupOrder) return;
    
    navigator.clipboard.writeText(activeGroupOrder.invitation_link)
      .then(() => toast.success('Invitation link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };
  
  // Share invitation link (mobile only)
  const handleShare = async () => {
    if (!activeGroupOrder) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join our group order: ${activeGroupOrder.name}`,
          text: 'Join our group order on Zomatify and add your items!',
          url: activeGroupOrder.invitation_link
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };
  
  // Go to menu to add more items
  const goToMenu = () => {
    navigate('/menu');
  };
  
  if (loading && !activeGroupOrder) {
    return (
      <PageContainer>
        <AppHeader title="Group Order" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <div className="loader"></div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <AppHeader title="Group Order" />
      
      <ContentContainer>
        {!activeGroupOrder ? (
          // Create new group order form
          <CreateGroupSection>
            <SectionTitle>Create a Group Order</SectionTitle>
            
            <Label htmlFor="orderName">Give your order a name</Label>
            <Input
              id="orderName"
              type="text"
              value={orderName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderName(e.target.value)}
              placeholder="e.g., Lunch with friends"
            />
            
            <Label htmlFor="expiryTime">Order will stay open for</Label>
            <select
              id="expiryTime"
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1.1rem',
                marginBottom: '20px'
              }}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
            
            <CreateButton 
              onClick={handleCreateGroupOrder}
              disabled={loading || !orderName.trim()}
            >
              <FaUsers /> Create Group Order
            </CreateButton>
            
            <EmptyState>
              <EmptyStateIcon>
                <FaUsers />
              </EmptyStateIcon>
              <EmptyStateText>
                Group orders let you and your friends order together.
                Create one and share the link!
              </EmptyStateText>
            </EmptyState>
          </CreateGroupSection>
        ) : (
          // Active group order view
          <>
            <ActiveGroupOrder>
              <GroupOrderHeader>
                <GroupOrderName>{activeGroupOrder.name}</GroupOrderName>
                <ExpiryInfo>Expires: {expiryTime}</ExpiryInfo>
              </GroupOrderHeader>
              
              <ParticipantsList>
                <SectionTitle>Participants</SectionTitle>
                {activeGroupOrder.participants.map((participant, index) => (
                  <ParticipantItem key={index}>
                    <ParticipantName>
                      {participant.user_id === user?.id ? 'You' : participant.name}
                    </ParticipantName>
                    <ParticipantStatus $confirmed={participant.has_confirmed}>
                      {participant.has_confirmed ? (
                        <>
                          <FaCheck /> Confirmed
                        </>
                      ) : (
                        participant.items.length > 0 ? 'Adding items...' : 'Not confirmed'
                      )}
                    </ParticipantStatus>
                  </ParticipantItem>
                ))}
              </ParticipantsList>
              
              <ShareSection>
                <ShareTitle>Invite friends to join</ShareTitle>
                <ShareLinkContainer>
                  <LinkDisplay>
                    {activeGroupOrder.invitation_link}
                  </LinkDisplay>
                  <CopyButton onClick={handleCopyLink}>
                    <FaLink /> Copy
                  </CopyButton>
                </ShareLinkContainer>
                
                <ShareButton onClick={handleShare}>
                  <FaShareAlt /> Share Invitation
                </ShareButton>
              </ShareSection>
              
              {activeGroupOrder.creator_id === user?.id && (
                <ActionButtons>
                  <ActionButton onClick={() => setActiveGroupOrder(null)}>
                    Cancel
                  </ActionButton>
                  <ActionButton 
                    $isPrimary 
                    onClick={handleCloseAndOrder}
                    disabled={activeGroupOrder.participants.every(p => !p.has_confirmed)}
                  >
                    Place Order
                  </ActionButton>
                </ActionButtons>
              )}
            </ActiveGroupOrder>
            
            <MyOrderSection>
              <SectionTitle>My Order</SectionTitle>
              
              <OrderSummary>
                {myItems.length > 0 ? (
                  <ItemsList>
                    {myItems.map((item, index) => (
                      <OrderItem key={index}>
                        <ItemDetails>
                          <ItemQuantity>{item.quantity}x</ItemQuantity>
                          <ItemName>{item.menuItem.name}</ItemName>
                        </ItemDetails>
                        <ItemPrice>
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </ItemPrice>
                      </OrderItem>
                    ))}
                  </ItemsList>
                ) : (
                  <NoItemsMessage>
                    You haven't added any items yet
                  </NoItemsMessage>
                )}
                
                <AddItemsButton onClick={goToMenu}>
                  <FaPlus /> Add Items from Menu
                </AddItemsButton>
                
                {items.length > 0 && (
                  <AddItemsButton 
                    onClick={handleAddItems}
                    style={{ marginTop: '10px', backgroundColor: '#4CAF50' }}
                  >
                    Add {items.length} Item{items.length !== 1 ? 's' : ''} from Cart
                  </AddItemsButton>
                )}
                
                {myItems.length > 0 && !hasConfirmed && (
                  <ConfirmButton 
                    onClick={handleConfirm}
                    disabled={myItems.length === 0}
                  >
                    Confirm My Order
                  </ConfirmButton>
                )}
                
                {hasConfirmed && (
                  <ConfirmButton 
                    disabled
                    style={{ backgroundColor: '#4CAF50' }}
                  >
                    ✓ Order Confirmed
                  </ConfirmButton>
                )}
              </OrderSummary>
            </MyOrderSection>
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default GroupOrderPage;
