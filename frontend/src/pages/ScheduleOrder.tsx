import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock, FaCalendarAlt, FaUtensils, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/common/AppHeader';
import { orderService } from '../services/api';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentContainer = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const IntroText = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 10px;
  color: #555;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 1.1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.2);
  }
`;

const TimeSlotContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 8px;
`;

const TimeSlot = styled.button<{ $isSelected: boolean }>`
  padding: 16px;
  border-radius: 10px;
  border: 2px solid ${(props: { $isSelected: boolean }) => props.$isSelected ? '#FF5A5F' : '#ddd'};
  background-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#FFF0F0' : 'white'};
  font-size: 1.1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #FF5A5F;
    background-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#FFF0F0' : '#FFF8F8'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.2);
  }
`;

const OperatingHours = styled.div`
  font-size: 1rem;
  color: #666;
  margin-top: 8px;
`;

const CartOverview = styled(Card)`
  border-left: 5px solid #2196F3;
`;

const ItemsList = styled.div`
  margin: 20px 0;
`;

const CartItem = styled.div`
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
  gap: 10px;
`;

const ItemQuantity = styled.span`
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-weight: 600;
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

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: 600;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 2px dashed #eee;
`;

const AddItemsButton = styled.button`
  width: 100%;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const ScheduleButton = styled.button`
  width: 100%;
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    background-color: #E54B50;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyCartMessage = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: #666;
`;

const ScheduledOrderSummary = styled(Card)`
  border-left: 5px solid #4CAF50;
  margin-top: 20px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  font-size: 1.1rem;
  color: #555;
`;

const SummaryValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
`;

// Generate time slots
const generateTimeSlots = (selectedDate: string): string[] => {
  const slots: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  
  // Start from 9 AM (or next hour from current time if today)
  let startHour = 9;
  const currentDate = new Date();
  
  if (isToday) {
    const currentHour = currentDate.getHours();
    // If current time is after 9 AM, start from next hour
    if (currentHour >= 9) {
      startHour = currentHour + 1;
    }
  }
  
  // Generate slots until 8 PM (20:00)
  for (let hour = startHour; hour <= 20; hour++) {
    // Add slots for both hour and half-hour
    slots.push(`${hour}:00`);
    if (hour < 20) {
      slots.push(`${hour}:30`);
    }
  }
  
  return slots;
};

// Format date for display
const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const ScheduleOrderPage: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [scheduledOrderDetails, setScheduledOrderDetails] = useState<any>(null);
  
  // Set initial date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);
  
  // Generate time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slots = generateTimeSlots(selectedDate);
      setAvailableTimeSlots(slots);
      setSelectedTime(''); // Reset time selection when date changes
    }
  }, [selectedDate]);
  
  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];
  
  // Get maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const goToMenu = () => {
    navigate('/menu');
  };
  
  const handleScheduleOrder = async () => {
    if (!user) {
      toast.error('Please log in to schedule an order');
      navigate('/login');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a pickup date and time');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create pickup time string in ISO format
      const pickupDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const orderData = {
        user_id: user.id,
        order_template: {
          items: items,
          total_price: totalPrice
        },
        schedule: {
          frequency: 'once' as 'once' | 'daily' | 'weekly',
          time: selectedTime,
          start_date: selectedDate
        },
        is_active: true
      };
      
      const { success, data, error } = await orderService.createScheduledOrder(orderData);
      
      if (success && data) {
        setIsOrderPlaced(true);
        setScheduledOrderDetails({
          id: data.id,
          pickupDate: formatDate(selectedDate),
          pickupTime: selectedTime,
          total: totalPrice
        });
        clearCart();
        toast.success('Your order has been scheduled!');
      } else {
        toast.error(error || 'Failed to schedule order');
      }
    } catch (error) {
      console.error('Error scheduling order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate total
  const calculateTotal = () => {
    return totalPrice;
  };
  
  return (
    <PageContainer>
      <AppHeader title="Schedule Order" />
      
      <ContentContainer>
        {!isOrderPlaced ? (
          <>
            <Card>
              <SectionTitle>
                <FaCalendarAlt style={{ marginRight: '10px' }} />
                Schedule Your Pickup
              </SectionTitle>
              
              <IntroText>
                Select a date and time when you'd like to pick up your order.
                We'll have it ready for you!
              </IntroText>
              
              <FormGroup>
                <Label htmlFor="pickupDate">Select Date</Label>
                <DateInput
                  id="pickupDate"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={minDate}
                  max={maxDateString}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Select Pickup Time</Label>
                <TimeSlotContainer>
                  {availableTimeSlots.map((time) => (
                    <TimeSlot
                      key={time}
                      $isSelected={selectedTime === time}
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time}
                    </TimeSlot>
                  ))}
                </TimeSlotContainer>
                <OperatingHours>
                  <FaClock style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  Operating hours: 9:00 AM - 8:00 PM
                </OperatingHours>
              </FormGroup>
            </Card>
            
            <CartOverview>
              <SectionTitle>
                <FaShoppingCart style={{ marginRight: '10px' }} />
                Order Summary
              </SectionTitle>
              
              {items.length > 0 ? (
                <>
                  <ItemsList>
                    {items.map((item, index) => (
                      <CartItem key={index}>
                        <ItemDetails>
                          <ItemQuantity>{item.quantity}x</ItemQuantity>
                          <ItemName>{item.menuItem.name}</ItemName>
                        </ItemDetails>
                        <ItemPrice>
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </ItemPrice>
                      </CartItem>
                    ))}
                  </ItemsList>
                  
                  <TotalSection>
                    <span>Total Amount</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </TotalSection>
                </>
              ) : (
                <EmptyCartMessage>
                  <p>Your cart is empty</p>
                  <p>Add items to schedule an order</p>
                </EmptyCartMessage>
              )}
              
              <AddItemsButton onClick={goToMenu}>
                <FaUtensils /> {items.length > 0 ? 'Add More Items' : 'Browse Menu'}
              </AddItemsButton>
            </CartOverview>
            
            <ScheduleButton
              onClick={handleScheduleOrder}
              disabled={loading || items.length === 0 || !selectedDate || !selectedTime}
            >
              <FaClock /> Schedule Order
            </ScheduleButton>
          </>
        ) : (
          // Show order confirmation after successful scheduling
          <ScheduledOrderSummary>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <FaCheckCircle size={60} color="#4CAF50" />
              <SectionTitle style={{ marginTop: '16px' }}>
                Order Scheduled Successfully!
              </SectionTitle>
              <p>Your order has been scheduled for pickup.</p>
            </div>
            
            <SummaryRow>
              <SummaryLabel>Order ID:</SummaryLabel>
              <SummaryValue>#{scheduledOrderDetails.id.slice(-6)}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Pickup Date:</SummaryLabel>
              <SummaryValue>{scheduledOrderDetails.pickupDate}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Pickup Time:</SummaryLabel>
              <SummaryValue>{scheduledOrderDetails.pickupTime}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Total Amount:</SummaryLabel>
              <SummaryValue>₹{scheduledOrderDetails.total.toFixed(2)}</SummaryValue>
            </SummaryRow>
            
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                You will receive a notification when your order is being prepared.
              </p>
              
              <AddItemsButton onClick={() => navigate('/orders')} style={{ backgroundColor: '#4CAF50' }}>
                View My Orders
              </AddItemsButton>
              
              <AddItemsButton onClick={() => navigate('/menu')} style={{ marginTop: '12px' }}>
                Back to Menu
              </AddItemsButton>
            </div>
          </ScheduledOrderSummary>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default ScheduleOrderPage;
