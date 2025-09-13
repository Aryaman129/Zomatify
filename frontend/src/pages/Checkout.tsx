import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaMapMarkerAlt, FaMoneyBillWave, FaCreditCard, FaCheck, FaHourglass } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AppHeader from '../components/common/AppHeader';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService, paymentService, queueService, vendorPaymentService } from '../services/api';
import supabase from '../services/supabaseClient';
import { QueueStatus, RazorpayOptions, RazorpayResponse } from '../types/index';
import { normalizeQueueStatus } from '../utils/normalizers';

const CheckoutContainer = styled.div`
  padding-bottom: 100px;
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
`;

const AddressCard = styled(Card)`
  position: relative;
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AddressTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #2196F3;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
`;

const AddressFilled = styled.div`
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const AddressLine = styled.p`
  margin: 6px 0;
  font-size: 1.1rem;
  color: #333;
`;

const AddressForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 1.1rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1.1rem;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.2);
  }
`;

const SaveButton = styled.button`
  background-color: #4CAF50;
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
  
  &:hover {
    background-color: #45a049;
  }
`;

const PaymentCard = styled(Card)`
  position: relative;
`;

const PaymentOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PaymentOption = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid ${(props: { $isSelected: boolean }) => props.$isSelected ? '#4CAF50' : '#eee'};
  border-radius: 12px;
  cursor: pointer;
  background-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#f0fff0' : 'white'};
`;

const PaymentIcon = styled.div`
  margin-right: 16px;
  font-size: 1.5rem;
  color: #555;
`;

const PaymentInfo = styled.div`
  flex: 1;
`;

const PaymentTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const PaymentDescription = styled.div`
  font-size: 1rem;
  color: #666;
  margin-top: 4px;
`;

const CheckIcon = styled.div`
  color: #4CAF50;
  margin-left: 12px;
`;

const RazorpayInfoCard = styled(Card)<{ $visible: boolean }>`
  display: ${(props: { $visible: boolean }) => props.$visible ? 'block' : 'none'};
  border-left: 4px solid #2196F3;
  padding: 16px;
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
`;

const OrderSummaryCard = styled(Card)`
  position: relative;
`;

const OrderItemsList = styled.div`
  margin-bottom: 20px;
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

const SummarySection = styled.div`
  margin-top: 20px;
  border-top: 2px dashed #eee;
  padding-top: 16px;
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
  border-top: 1px solid #eee;
  font-size: 1.25rem;
  font-weight: 600;
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
  box-shadow: 0 4px 8px rgba(255, 90, 95, 0.2);
  
  &:hover {
    background-color: #E54B50;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const BackToCartButton = styled.button`
  width: 100%;
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

// Add this type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Add new styled components for queue status
const CardContent = styled.div`
  padding: 12px;
`;

const StatusInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: #333;
`;

const StatusValue = styled.span`
  font-weight: 600;
  color: #FF5A5F;
`;

const StatusWarning = styled.div`
  padding: 12px;
  background-color: #FFF9C4;
  border-radius: 8px;
  border-left: 4px solid #FFC107;
  font-size: 1.1rem;
  color: #F57C00;
  margin-top: 8px;
`;

const Checkout: React.FC = () => {
  const { items, updateItemQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for delivery address
  const [editingAddress, setEditingAddress] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.user_metadata?.first_name && user?.user_metadata?.last_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : '',
    phone: user?.user_metadata?.phone_number || '',
    addressLine1: '',
    addressLine2: '',
    landmark: ''
  });
  
  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState<'razorpay'>('razorpay');
  
  // State for order type
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  
  // State for order processing
  const [loading, setLoading] = useState(false);
  
  // Add states for Razorpay and queue
  const [orderId, setOrderId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  
  // Redirect to cart if no items
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      toast.info('Your cart is empty');
    }
  }, [items, navigate]);
  
  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Add effect to fetch queue status
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const { success, data, error } = await queueService.getQueueStatus();
        
        if (success && data) {
          setQueueStatus(normalizeQueueStatus(data));
        } else {
          console.error('Error fetching queue status:', error);
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
      }
    };
    
    fetchQueueStatus();
    
    // Refresh queue status every minute
    const intervalId = setInterval(fetchQueueStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle address input changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save address
  const handleSaveAddress = () => {
    // Validate required fields
    if (!address.fullName || !address.phone || !address.addressLine1) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(address.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setEditingAddress(false);
    toast.success('Delivery address saved');
  };
  
  // Select payment method
  const handleSelectPayment = (method: 'razorpay') => {
    setPaymentMethod(method);
  };
  
  // Calculate order summary values
  const calculateSubtotal = () => {
    return totalPrice;
  };
  
  const calculateServiceCharge = () => {
    return 5; // Fixed 5Rs service charge
  };
  
  const calculateServiceDiscount = () => {
    return 2; // Fixed 2Rs discount (5Rs - 3Rs = 2Rs discount)
  };
  
  const calculateNetServiceCharge = () => {
    return calculateServiceCharge() - calculateServiceDiscount(); // 5Rs - 2Rs = 3Rs final charge
  };
  
  const calculateDeliveryFee = () => {
    // Free delivery over ₹300, otherwise ₹30 (only for delivery orders)
    if (orderType === 'pickup') return 0;
    return calculateSubtotal() > 300 ? 0 : 30;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateNetServiceCharge() + calculateDeliveryFee();
  };
  
  // Update handlePlaceOrder to use Razorpay integration
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }
    
    // Validate address only for delivery orders
    if (orderType === 'delivery' && (!address.fullName || !address.phone || !address.addressLine1)) {
      toast.error('Please add a delivery address');
      setEditingAddress(true);
      return;
    }
    
    try {
      setLoading(true);
      
      // First check if we can accept more orders
      if (queueStatus && !queueStatus.is_accepting_orders) {
        const message = queueStatus.cooldown_remaining
          ? `Our kitchen is at full capacity. Please try again in ${queueStatus.cooldown_remaining} minutes.`
          : 'Our kitchen is at full capacity. Please try again later.';
        
        toast.error(message);
        setLoading(false);
        return;
      }
      
      // Convert CartItem[] to OrderItem[] by mapping the items
      const orderItems = items.map(item => ({
        menu_item_id: String(item.menuItem.id),
        menu_item: item.menuItem,
        quantity: item.quantity,
        special_instructions: item.specialInstructions,
        selected_options: item.selected_options
      }));

      // Get vendor_id from the first item (assuming all items are from the same vendor)
      const vendorId = items.length > 0 ? items[0].menuItem.vendor_id : undefined;

      console.log('Checkout - Cart items:', items.map(item => ({
        name: item.menuItem.name,
        vendor_id: item.menuItem.vendor_id
      })));
      console.log('Checkout - Identified vendor_id:', vendorId);

      // Validate that all items are from the same vendor
      const allSameVendor = items.every(item => item.menuItem.vendor_id === vendorId);
      if (!allSameVendor) {
        console.error('Items from different vendors detected:', items.map(item => ({
          name: item.menuItem.name,
          vendor_id: item.menuItem.vendor_id
        })));
        toast.error('All items must be from the same vendor');
        return;
      }

      if (!vendorId) {
        console.error('No vendor_id found in cart items:', items);
        toast.error('Unable to identify vendor for this order. Please try adding items to cart again.');
        return;
      }

      const orderData = {
        user_id: user.id,
        vendor_id: vendorId, // Add vendor_id to link order to specific vendor
        items: orderItems, // Use converted items
        total_price: calculateTotal(),
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: paymentMethod,
        order_type: orderType, // Add order type
        delivery_address: orderType === 'delivery' ? {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          landmark: address.landmark
        } : {
          fullName: 'PICKUP',
          phone: 'N/A',
          addressLine1: 'Customer Pickup',
          addressLine2: '',
          landmark: ''
        }
      };
      
      const { success, data, error } = await orderService.createOrder(orderData);
      
      if (success && data) {
        setOrderId(String(data.id));
        
        // Handle payment based on the selected method
        if (paymentMethod === 'razorpay') {
          // Create Razorpay order and convert order ID to string
          const paymentResponse = await paymentService.createRazorpayOrder(
            calculateTotal(),
            String(data.id)
          );
          
          if (!paymentResponse.success || !paymentResponse.data) {
            toast.error(paymentResponse.error || 'Failed to initialize payment');
            setLoading(false);
            return;
          }
          
          // Initialize Razorpay payment
          const options: RazorpayOptions = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID!,
            amount: Math.round(calculateTotal() * 100), // Amount in paisa
            name: 'Zomatify',
            description: `Order #${String(data.id).substring(0, 8)}`,
            order_id: String(paymentResponse.data.id),
            handler: async function (response: RazorpayResponse) {
              try {
                // Verify payment with backend
                const verifyResponse = await paymentService.verifyRazorpayPayment(
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature
                );
                
                if (verifyResponse.success && verifyResponse.data?.verified) {
                  // Update payment status
                  await paymentService.updatePaymentStatus(
                    String(data.id),
                    response.razorpay_payment_id,
                    'paid'
                  );

                  // Do NOT create vendor payment distribution here
                  // Payment will be held in escrow until vendor accepts the order
                  console.log('Payment verified and held in escrow for order:', String(data.id));

        // Clear cart and navigate to success page
        clearCart();
        navigate(`/order-success/${String(data.id)}`);

        // Show queue position in the success message
        if (data.queue_position) {
          toast.success(`Payment successful! Order placed in queue: ${data.queue_position}`);
        } else {
          toast.success('Payment successful! Your receipt is ready.');
                  }
                } else {
                  toast.error('Payment verification failed. Please contact support.');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast.error('An error occurred during payment verification');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: address.fullName,
              contact: address.phone
            },
            theme: {
              color: '#FF5A5F'
            }
          };
          
          // Open Razorpay payment modal
          const razorpay = new window.Razorpay(options);
          razorpay.open();
          setLoading(false);
        } else {
          // Cash on delivery - just place the order
          clearCart();
          navigate(`/order-success/${String(data.id)}`);
          
          // Show queue position in the success message
          if (data.queue_position) {
            toast.success(`Order placed successfully! Your position in queue: ${data.queue_position}`);
          } else {
            toast.success('Order placed successfully!');
          }
          setLoading(false);
        }
      } else {
        toast.error(error || 'Failed to place order');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };
  
  // Go back to cart
  const handleBackToCart = () => {
    navigate('/cart');
  };
  
  // Add Queue Status section to render
  const renderQueueStatus = () => {
    if (!queueStatus) return null;
    
    return (
      <Card>
        <SectionTitle>
          <FaHourglass style={{ marginRight: '8px' }} />
          Kitchen Status
        </SectionTitle>
        <CardContent>
          <StatusInfo>
            Current Active Orders: <StatusValue>{queueStatus.current_position} / {queueStatus.max_active_orders}</StatusValue>
          </StatusInfo>
          <StatusInfo>
            Real-time Users: <StatusValue>{(queueStatus as any).real_time_users || 0} online</StatusValue>
          </StatusInfo>
          {!queueStatus.is_accepting_orders && queueStatus.cooldown_remaining && (
            <StatusWarning>
              Our kitchen is currently at full capacity. 
              New orders will be accepted in {queueStatus.cooldown_remaining} minutes.
            </StatusWarning>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <CheckoutContainer>
      <AppHeader title="Checkout" />
      
      <ContentSection>
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          {/* Delivery Address - Only for delivery orders */}
          {orderType === 'delivery' && (
            <AddressCard>
              <AddressHeader>
                <AddressTitle>
                  <FaMapMarkerAlt style={{ marginRight: '8px' }} />
                Delivery Address
              </AddressTitle>
              {!editingAddress && (
                <EditButton onClick={() => setEditingAddress(true)}>
                  Edit
                </EditButton>
              )}
            </AddressHeader>
            
            {!editingAddress && (address.fullName && address.addressLine1) ? (
              <AddressFilled>
                <AddressLine><strong>{address.fullName}</strong></AddressLine>
                <AddressLine>{address.phone}</AddressLine>
                <AddressLine>{address.addressLine1}</AddressLine>
                {address.addressLine2 && <AddressLine>{address.addressLine2}</AddressLine>}
                {address.landmark && <AddressLine>Landmark: {address.landmark}</AddressLine>}
              </AddressFilled>
            ) : (
              <AddressForm>
                <FormGroup>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleAddressChange}
                    placeholder="Enter your full name"
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={address.phone}
                    onChange={handleAddressChange}
                    placeholder="10-digit mobile number"
                    required
                    pattern="[0-9]{10}"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleAddressChange}
                    placeholder="Building, street name"
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={handleAddressChange}
                    placeholder="Area, locality (optional)"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={address.landmark}
                    onChange={handleAddressChange}
                    placeholder="Nearby landmark (optional)"
                  />
                </FormGroup>
                
                <SaveButton onClick={handleSaveAddress}>
                  <FaCheck /> Save Address
                </SaveButton>
              </AddressForm>
            )}
          </AddressCard>
          )}
          
          {/* Order Type Selection */}
          <Card>
            <SectionTitle>Order Type</SectionTitle>
            
            <PaymentOptionsContainer>
              <PaymentOption
                $isSelected={orderType === 'delivery'}
                onClick={() => setOrderType('delivery')}
              >
                <PaymentIcon>
                  <FaMapMarkerAlt />
                </PaymentIcon>
                <PaymentInfo>
                  <PaymentTitle>Delivery</PaymentTitle>
                  <PaymentDescription>Get it delivered to your address</PaymentDescription>
                </PaymentInfo>
                {orderType === 'delivery' && (
                  <CheckIcon>
                    <FaCheck size={20} />
                  </CheckIcon>
                )}
              </PaymentOption>
              
              <PaymentOption
                $isSelected={orderType === 'pickup'}
                onClick={() => setOrderType('pickup')}
              >
                <PaymentIcon>
                  <FaHourglass />
                </PaymentIcon>
                <PaymentInfo>
                  <PaymentTitle>Pickup</PaymentTitle>
                  <PaymentDescription>Pick up from restaurant</PaymentDescription>
                </PaymentInfo>
                {orderType === 'pickup' && (
                  <CheckIcon>
                    <FaCheck size={20} />
                  </CheckIcon>
                )}
              </PaymentOption>
            </PaymentOptionsContainer>
          </Card>
          
          {/* Payment Method */}
          <PaymentCard>
            <SectionTitle>Payment Method</SectionTitle>
            
            <PaymentOptionsContainer>
              <PaymentOption
                $isSelected={paymentMethod === 'razorpay'}
                onClick={() => handleSelectPayment('razorpay')}
              >
                <PaymentIcon>
                  <FaCreditCard />
                </PaymentIcon>
                <PaymentInfo>
                  <PaymentTitle>Pay Online</PaymentTitle>
                  <PaymentDescription>Credit/Debit Card, UPI, Wallets</PaymentDescription>
                </PaymentInfo>
                {paymentMethod === 'razorpay' && (
                  <CheckIcon>
                    <FaCheck size={20} />
                  </CheckIcon>
                )}
              </PaymentOption>
            </PaymentOptionsContainer>
          </PaymentCard>
          
          {/* Info about Razorpay */}
          <RazorpayInfoCard $visible={paymentMethod === 'razorpay'}>
            <p>We use Razorpay for secure payment processing. After placing your order, you'll be redirected to the payment gateway to complete your transaction.</p>
            <p style={{ marginTop: '8px' }}>All payment information is encrypted and secure.</p>
          </RazorpayInfoCard>
          
          {/* Queue Information */}
          {renderQueueStatus()}
          
          {/* Order Summary */}
          <OrderSummaryCard>
            <SectionTitle>Order Summary</SectionTitle>
            
            <OrderItemsList>
              {items.map((item, index) => (
                <OrderItem key={index}>
                  <ItemDetails>
                    <ItemQuantity>{item.quantity}x</ItemQuantity>
                    <ItemName>{item.menuItem.name}</ItemName>
                  </ItemDetails>
                  <ItemPrice>
                    {formatCurrency(item.menuItem.price * item.quantity)}
                  </ItemPrice>
                </OrderItem>
              ))}
            </OrderItemsList>
            
            <SummarySection>
              <SummaryRow>
                <SummaryLabel>Subtotal</SummaryLabel>
                <SummaryValue>{formatCurrency(calculateSubtotal())}</SummaryValue>
              </SummaryRow>
              
              <SummaryRow>
                <SummaryLabel>Service Charge</SummaryLabel>
                <SummaryValue style={{ color: '#28a745', fontWeight: 'bold' }}>
                  <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px', fontSize: '0.9em' }}>
                    {formatCurrency(calculateServiceCharge())}
                  </span>
                  <span style={{ color: '#28a745' }}>
                    {formatCurrency(calculateNetServiceCharge())}
                  </span>
                </SummaryValue>
              </SummaryRow>
              
              {orderType === 'delivery' && (
                <SummaryRow>
                  <SummaryLabel>Delivery Fee</SummaryLabel>
                  <SummaryValue>
                    {calculateDeliveryFee() === 0 ? 'Free' : formatCurrency(calculateDeliveryFee())}
                  </SummaryValue>
                </SummaryRow>
              )}
              
              <TotalRow>
                <SummaryLabel>Total Amount</SummaryLabel>
                <SummaryValue>{formatCurrency(calculateTotal())}</SummaryValue>
              </TotalRow>
            </SummarySection>
          </OrderSummaryCard>
          
          {/* Action Buttons */}
          <PlaceOrderButton
            onClick={handlePlaceOrder}
            disabled={loading || editingAddress || (orderType === 'delivery' && !address.addressLine1)}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </PlaceOrderButton>
          
          <BackToCartButton onClick={handleBackToCart}>
            <FaArrowLeft /> Back to Cart
          </BackToCartButton>
        </motion.div>
      </ContentSection>
    </CheckoutContainer>
  );
};

export default Checkout;
