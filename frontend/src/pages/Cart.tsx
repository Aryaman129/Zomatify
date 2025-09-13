import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrash, FaPlus, FaMinus, FaArrowRight, FaClock, FaUsers } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const CartContainer = styled.div`
  padding-bottom: 160px; /* Extra space for bottom actions */
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const EmptyCartMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const EmptyCartIcon = styled.div`
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 16px;
`;

const EmptyCartText = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 24px;
`;

const BrowseButton = styled.button`
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #E54B50;
  }
`;

const ItemsContainer = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  padding-left: 4px;
`;

const CartItemCard = styled(motion.div)`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  position: relative;
`;

const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 16px;
`;

const NoImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.8rem;
  text-align: center;
  margin-right: 16px;
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ItemName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #333;
`;

const ItemPrice = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #FF5A5F;
  margin: 4px 0;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const QuantityButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  &:active {
    background-color: #d0d0d0;
  }
`;

const Quantity = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #FF5A5F;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 24px 0;
`;

const SummaryContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 1.1rem;
`;

const SummaryLabel = styled.span`
  color: #666;
`;

const SummaryValue = styled.span`
  font-weight: 600;
  color: #333;
`;

const TotalRow = styled(SummaryRow)`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px dashed #eee;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CheckoutButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const OptionsContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const OptionButton = styled.button`
  background-color: white;
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #ddd;
    background-color: #f9f9f9;
  }
`;

const OptionIcon = styled.div`
  font-size: 1.5rem;
  color: #FF5A5F;
  margin-bottom: 8px;
`;

const OptionTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
`;

const OptionDescription = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const BottomActions = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 25px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1000;
  max-width: 1200px;
  margin: 0 auto;
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
    transition: {
      duration: 0.3
    }
  }
};

const Cart: React.FC = () => {
  const { items, updateItemQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  
  const handleRemoveItem = (id: string | number) => {
    removeItem(String(id));
    toast.success('Item removed from cart');
  };
  
  const handleUpdateQuantity = (id: string | number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) {
      handleRemoveItem(id);
    } else {
      updateItemQuantity(String(id), newQuantity);
    }
  };
  
  const handleBrowseMenu = () => {
    navigate('/menu');
  };
  
  const handleCheckout = () => {
    if (!user) {
      toast.error('Please log in to continue with checkout');
      navigate('/login', { state: { returnTo: '/cart' } });
      return;
    }
    
    navigate('/checkout');
  };
  
  const handleScheduleOrder = () => {
    if (!user) {
      toast.error('Please log in to schedule an order');
      navigate('/login', { state: { returnTo: '/schedule-order' } });
      return;
    }
    
    navigate('/schedule-order');
  };
  
  const handleGroupOrder = () => {
    if (!user) {
      toast.error('Please log in to create a group order');
      navigate('/login', { state: { returnTo: '/group-order' } });
      return;
    }
    
    navigate('/group-order');
  };
  
  const calculateSubtotal = () => {
    return totalPrice;
  };
  
  const calculateDeliveryFee = () => {
    // Free delivery over ₹300, otherwise ₹30
    return calculateSubtotal() > 300 ? 0 : 30;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };
  
  if (items.length === 0) {
    return (
      <CartContainer>
        <AppHeader title="My Cart" />
        <EmptyCartMessage>
          <EmptyCartIcon>🛒</EmptyCartIcon>
          <EmptyCartText>Your cart is empty</EmptyCartText>
          <BrowseButton onClick={handleBrowseMenu}>
            Browse Menu
          </BrowseButton>
        </EmptyCartMessage>
      </CartContainer>
    );
  }
  
  return (
    <CartContainer>
      <AppHeader title="My Cart" />
      
      <ContentSection>
        <ItemsContainer>
          <SectionTitle>Items in Cart ({items.length})</SectionTitle>
          
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {items.map(item => (
              <motion.div key={item.menuItem.id} variants={itemVariants}>
                <CartItemCard>
                  {item.menuItem.image_url ? (
                    <ItemImage src={item.menuItem.image_url} alt={item.menuItem.name} />
                  ) : (
                    <NoImage>No Image</NoImage>
                  )}
                  
                  <ItemDetails>
                    <ItemName>{item.menuItem.name}</ItemName>
                    
                    <ItemPrice>₹{item.menuItem.price.toFixed(2)}</ItemPrice>
                    
                    <QuantityControl>
                      <QuantityButton
                        onClick={() => {
                          console.log('Decreasing quantity for cart item:', item.id, 'current:', item.quantity);
                          handleUpdateQuantity(item.id, item.quantity, -1);
                        }}
                        aria-label="Decrease quantity"
                      >
                        <FaMinus size={14} />
                      </QuantityButton>
                      <Quantity>{item.quantity}</Quantity>
                      <QuantityButton
                        onClick={() => {
                          console.log('Increasing quantity for cart item:', item.id, 'current:', item.quantity);
                          handleUpdateQuantity(item.id, item.quantity, 1);
                        }}
                        aria-label="Increase quantity"
                      >
                        <FaPlus size={14} />
                      </QuantityButton>
                    </QuantityControl>
                  </ItemDetails>

                  <RemoveButton
                    onClick={() => {
                      console.log('Removing cart item:', item.id, 'menuItem:', item.menuItem.name);
                      handleRemoveItem(item.id);
                    }}
                    aria-label={`Remove ${item.menuItem.name} from cart`}
                  >
                    <FaTrash size={18} />
                  </RemoveButton>
                </CartItemCard>
              </motion.div>
            ))}
          </motion.div>
        </ItemsContainer>
        
        <SummaryContainer>
          <SectionTitle>Order Summary</SectionTitle>
          
          <SummaryRow>
            <SummaryLabel>Subtotal</SummaryLabel>
            <SummaryValue>₹{calculateSubtotal().toFixed(2)}</SummaryValue>
          </SummaryRow>
          
          <SummaryRow>
            <SummaryLabel>Delivery Fee</SummaryLabel>
            <SummaryValue>
              {calculateDeliveryFee() === 0 ? 'Free' : `₹${calculateDeliveryFee().toFixed(2)}`}
            </SummaryValue>
          </SummaryRow>
          
          <TotalRow>
            <SummaryLabel>Total</SummaryLabel>
            <SummaryValue>₹{calculateTotal().toFixed(2)}</SummaryValue>
          </TotalRow>
        </SummaryContainer>
        
        <div>
          <SectionTitle>Special Options</SectionTitle>
          <OptionsContainer>
            <OptionButton onClick={handleScheduleOrder}>
              <OptionIcon>
                <FaClock />
              </OptionIcon>
              <OptionTitle>Schedule Order</OptionTitle>
              <OptionDescription>Pick up later at your convenience</OptionDescription>
            </OptionButton>
            
            <OptionButton onClick={handleGroupOrder}>
              <OptionIcon>
                <FaUsers />
              </OptionIcon>
              <OptionTitle>Group Order</OptionTitle>
              <OptionDescription>Order together with friends</OptionDescription>
            </OptionButton>
          </OptionsContainer>
        </div>
        
        <Divider />
        

      </ContentSection>
      
      <BottomActions>
        <CheckoutButton onClick={handleCheckout}>
          🛒 CHECKOUT NOW <FaArrowRight />
        </CheckoutButton>
      </BottomActions>
    </CartContainer>
  );
};

export default Cart;
