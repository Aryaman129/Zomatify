import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock, FaCalendarAlt, FaUtensils, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/common/AppHeader';
import { orderService, paymentService } from '../services/api';

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

const PlatformFeeNotice = styled.div`
  background: #e8f5e8;
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #2e7d32;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PickupTimeNotice = styled.div`
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #e65100;
  font-size: 0.9rem;
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

  if (!isToday) {
    // For future dates, no slots available (pickup only for today)
    return [];
  }

  // For today, only show next 4 hours from current time
  const currentHour = new Date().getHours();

  // Start from next hour
  let startHour = currentHour + 1;

  // End 4 hours from now, but not after 8 PM
  const maxEndHour = Math.min(startHour + 4, 20);

  // If it's too late in the day, show no slots
  if (startHour >= 20) {
    return [];
  }

  // Generate slots until maxEndHour
  for (let hour = startHour; hour < maxEndHour; hour++) {
    // Add slots for both hour and half-hour
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
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

const SelfPickupPage: React.FC = () => {
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
  
  // Get today's date (only allow pickup for today)
  const todayDate = new Date().toISOString().split('T')[0];
  const minDate = todayDate;
  const maxDateString = todayDate; // Same as min date - only today allowed
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const goToMenu = () => {
    navigate('/menu');
  };
  
  const handleSelfPickupOrder = async () => {
    if (!user) {
      toast.error('Please log in to place a pickup order');
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

      // First, create the order with payment required
      const orderData = {
        user_id: user.id,
        vendor_id: items[0]?.menuItem?.vendor_id, // Get vendor_id from first item
        items: items.map(item => ({
          menu_item: item.menuItem,
          quantity: item.quantity,
          special_instructions: item.specialInstructions
        })),
        total_price: totalPrice + 2, // Add ₹2 platform fee for pickup
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: 'razorpay' as const,
        order_type: 'pickup' as const,
        scheduled_for: pickupDateTime.toISOString(),
        delivery_address: {
          fullName: user.user_metadata?.full_name || user.email || 'Customer',
          phone: user.user_metadata?.phone || '',
          addressLine1: 'Pickup Order',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India'
        }
      };

      // Create the order first
      const orderResult = await orderService.createOrder(orderData);

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const order = orderResult.data;

      // Create Razorpay payment order (including ₹2 platform fee)
      const totalWithPlatformFee = totalPrice + 2;
      const paymentResponse = await paymentService.createRazorpayOrder(
        totalWithPlatformFee,
        String(order.id)
      );

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(paymentResponse.error || 'Failed to create payment order');
      }

      // Set up Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: paymentResponse.data.amount,
        currency: 'INR',
        name: 'Zomatify',
        description: 'Scheduled Order Payment',
        order_id: paymentResponse.data.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verificationResponse = await paymentService.verifyRazorpayPayment(
              response.razorpay_payment_id,
              String(order.id),
              response.razorpay_signature
            );

            if (verificationResponse.success) {
              setIsOrderPlaced(true);
              setScheduledOrderDetails({
                id: order.id,
                pickupDate: formatDate(selectedDate),
                pickupTime: selectedTime,
                total: totalPrice
              });
              clearCart();
              toast.success('Payment successful! Your order has been scheduled!');
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || user.email,
          contact: user.user_metadata?.phone || ''
        },
        theme: {
          color: '#667eea'
        }
      };

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // Open Razorpay payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);

    } catch (error) {
      console.error('Error scheduling order:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  // Calculate total
  const calculateTotal = () => {
    return totalPrice;
  };
  
  return (
    <PageContainer>
      <AppHeader title="Self Pickup" />

      <ContentContainer>
        {!isOrderPlaced ? (
          <>
            <Card>
              <SectionTitle>
                <FaCalendarAlt style={{ marginRight: '10px' }} />
                Self Pickup Order
              </SectionTitle>

              <IntroText>
                Pay now and collect your order at your preferred time.
                No delivery charges - just a ₹2 platform fee!
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Subtotal</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#666' }}>
                      <span>Platform Fee</span>
                      <span>₹2.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                      <span>Total Amount</span>
                      <span>₹{(totalPrice + 2).toFixed(2)}</span>
                    </div>
                  </TotalSection>
                </>
              ) : (
                <EmptyCartMessage>
                  <p>Your cart is empty</p>
                  <p>Add items to place a pickup order</p>
                </EmptyCartMessage>
              )}
              
              <AddItemsButton onClick={goToMenu}>
                <FaUtensils /> {items.length > 0 ? 'Add More Items' : 'Browse Menu'}
              </AddItemsButton>
            </CartOverview>
            
            <PlatformFeeNotice>
              <FaClock />
              <div>
                <strong>Self Pickup Service:</strong> Pay now and collect your order at the selected time.
                Only ₹2 platform fee - no delivery charges!
              </div>
            </PlatformFeeNotice>

            <PickupTimeNotice>
              <strong>Note:</strong> Pickup times are available only within the next few hours.
              Please select a time that works for you today.
            </PickupTimeNotice>

            <ScheduleButton
              onClick={handleSelfPickupOrder}
              disabled={loading || items.length === 0 || !selectedDate || !selectedTime}
            >
              <FaClock /> Pay & Confirm Pickup
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

export default SelfPickupPage;
