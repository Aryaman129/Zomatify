import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaUtensils, FaReceipt, FaClock, FaBell, FaPlusCircle, FaEdit, FaTrash, FaUpload, FaImage } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { orderService, queueService, menuService } from '../services/api';
import { Order, MenuItem } from '../types';
import type { OrderStatus } from '../types';
import { QueueStatus } from '../types/index';
import { toast } from 'react-toastify';
import { subscribeToRealtimeUpdates } from '../services/supabaseClient';
import { format, addMinutes, isPast } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const DashboardContainer = styled.div`
  padding: 0 0 20px 0;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 0 10px 20px;
  }
`;

const WelcomeSection = styled.div`
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 15px;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: #333;
`;

const StatusSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
`;

const StatusCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StatusCount = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #FF5A5F;
  margin-bottom: 8px;
`;

const StatusLabel = styled.div`
  font-size: 1rem;
  color: #666;
`;

const SectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin: 30px 0 15px;
  color: #333;
  padding: 0 20px;
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 10px;
    gap: 12px;
  }
`;

const OrderCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const OrderId = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
`;

const OrderTime = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const OrderStatus = styled.div<{ $status: string }>`
  display: inline-block;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: ${({ $status }: { $status: OrderStatus }) => {
    switch ($status) {
      case 'pending': return '#FFC107';
      case 'accepted': return '#2196F3';
      case 'preparing': return '#4CAF50';
      case 'ready': return '#009688';
      case 'completed': return '#8BC34A';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  }};
`;

const OrderItems = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 1.1rem;
`;

const ItemDetails = styled.div`
  display: flex;
`;

const ItemQuantity = styled.span`
  background-color: #f0f0f0;
  color: #333;
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 8px;
  font-weight: bold;
`;

const ItemName = styled.span`
  color: #333;
`;

const ItemPrice = styled.span`
  color: #FF5A5F;
  font-weight: 600;
`;

const OrderFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const OrderTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: bold;
  padding-top: 8px;
  border-top: 2px dashed #f0f0f0;
`;

const TotalLabel = styled.span`
  color: #333;
`;

const TotalAmount = styled.span`
  color: #FF5A5F;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const ActionButton = styled.button<{ $isPrimary?: boolean }>`
  padding: 16px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  background-color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? '#FF5A5F' : '#f0f0f0'};
  color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? 'white' : '#333'};
  
  &:hover {
    background-color: ${(props: { $isPrimary?: boolean }) => props.$isPrimary ? '#E54B50' : '#e0e0e0'};
  }
  
  &:disabled {
    background-color: #ccc;
    color: #666;
    cursor: not-allowed;
  }
  
  @media (max-width: 480px) {
    padding: 14px 10px;
    font-size: 0.9rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  margin: 20px;
`;

const EmptyStateText = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin: 16px 0;
`;

// New styled components for interval notifications
const NotificationBanner = styled.div`
  background-color: #4CAF50;
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NotificationText = styled.div`
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TimerContainer = styled.div`
  background-color: rgba(255,255,255,0.2);
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: bold;
`;

const PaymentIcon = styled.div`
  margin-right: 16px;
  font-size: 1.5rem;
  color: #555;
`;

// Add Card component that was missing
const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// Add styled components for menu management
const Tabs = styled.div`
  display: flex;
  margin: 20px 0;
  border-bottom: 1px solid #eee;
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 480px) {
    margin: 15px 0;
  }
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 12px 24px;
  background: ${(props: { $active?: boolean }) => props.$active ? '#FF5A5F' : 'transparent'};
  color: ${(props: { $active?: boolean }) => props.$active ? 'white' : '#333'};
  border: none;
  cursor: pointer;
  font-weight: 600;
  border-radius: 4px 4px 0 0;
  
  &:hover {
    background: ${(props: { $active?: boolean }) => props.$active ? '#FF5A5F' : '#f5f5f5'};
  }
`;

const MenuList = styled.div`
  margin-top: 20px;
`;

const MenuItemCard = styled.div`
  display: flex;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const MenuItemImage = styled.div<{ $bgImage: string }>`
  width: 120px;
  background-image: url(${(props: { $bgImage: string }) => props.$bgImage});
  background-size: cover;
  background-position: center;
  
  @media (max-width: 600px) {
    width: 100%;
    height: 150px;
  }
`;

const MenuItemDetails = styled.div`
  flex: 1;
  padding: 16px;
`;

const MenuItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const MenuItemName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #333;
`;

const MenuItemPrice = styled.span`
  font-weight: 600;
  color: #FF5A5F;
`;

const MenuItemDescription = styled.p`
  margin: 8px 0;
  color: #666;
  font-size: 0.9rem;
`;

const MenuItemCategory = styled.span`
  display: inline-block;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 8px;
`;

const MenuItemActions = styled.div`
  display: flex;
  margin-top: 12px;
  gap: 8px;
`;

const MenuItemButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:first-child {
    background: #eee;
    color: #333;
    
    &:hover {
      background: #ddd;
    }
  }
  
  &:last-child {
    background: #ffebee;
    color: #f44336;
    
    &:hover {
      background: #ffe0e0;
    }
  }
`;

const AddMenuItemButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: #f8f8f8;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  cursor: pointer;
  color: #888;
  font-weight: 600;
  
  &:hover {
    background: #f0f0f0;
    color: #FF5A5F;
    border-color: #FF5A5F;
  }
`;

// Add form components
const MenuForm = styled.form`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FormTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
  }
`;

const FormButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #eee;
  }
`;

const SaveButton = styled.button`
  padding: 10px 16px;
  background: #FF5A5F;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #FF4448;
  }
`;

const emptyMenuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category: '',
  available: true,
  preparation_time: 15,
  tags: [],
  ingredients: []
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'short'
  });
};

// Add styled components for image upload
const ImageUploadContainer = styled.div`
  margin-bottom: 16px;
  
  @media (max-width: 480px) {
    margin-bottom: 20px;
  }
`;

interface DropZoneProps {
  $isDragActive: boolean;
  $hasImage: boolean;
}

const DropZone = styled.div<DropZoneProps>`
  border: 2px dashed ${(props: DropZoneProps) => props.$isDragActive ? '#FF5A5F' : props.$hasImage ? '#4CAF50' : '#ddd'};
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: ${(props: DropZoneProps) => props.$isDragActive ? '#fff9f9' : props.$hasImage ? '#f9fff9' : '#fafafa'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #FF5A5F;
    background-color: #fff9f9;
  }
  
  @media (max-width: 480px) {
    padding: 15px;
  }
`;

interface UploadIconProps {
  color?: string;
}

const UploadIcon = styled.div<UploadIconProps>`
  margin-bottom: 10px;
  color: ${(props: UploadIconProps) => props.color || '#999'};
`;

const UploadText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #666;
`;

const ImagePreview = styled.div`
  width: 100%;
  height: 200px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 4px;
  margin-top: 10px;
  border: 1px solid #eee;
`;

interface ImageUploaderProps {
  currentImage: string;
  onImageUpload: (url: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Detect if we're on a mobile device
  const isMobile = window.innerWidth <= 768;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // For now, since bucket doesn't exist, use a placeholder URL instead
      if (isMobile) {
        toast.info('Processing image...', { autoClose: 2000, toastId: 'upload-progress' });
      }
      
      // Generate a data URL as fallback when bucket is missing
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Use the data URL temporarily
          onImageUpload(e.target.result as string);
          
          if (isMobile) {
            toast.dismiss('upload-progress');
            toast.success('Image processed successfully');
          }
        }
      };
      reader.readAsDataURL(file);
      
      // Keep the original Supabase upload code commented until bucket is created
      /*
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `menu_items/${fileName}`;
      
      // Show loading toast for mobile users
      if (isMobile) {
        toast.info('Uploading image...', { autoClose: false, toastId: 'upload-progress' });
      }
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      if (urlData && urlData.publicUrl) {
        // Pass the URL to parent component
        onImageUpload(urlData.publicUrl);
        
        // Update toast for mobile users
        if (isMobile) {
          toast.dismiss('upload-progress');
          toast.success('Image uploaded successfully');
        }
      }
      */
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
      
      // Show error toast for mobile users
      if (isMobile) {
        toast.dismiss('upload-progress');
        toast.error('Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <ImageUploadContainer>
      <DropZone 
        $isDragActive={isDragging}
        $hasImage={!!currentImage}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*"
          capture="environment"
          onChange={handleFileChange} 
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        
        <UploadIcon>
          {currentImage ? (
            <FaImage size={isMobile ? 24 : 32} color="#4CAF50" />
          ) : (
            <FaUpload size={isMobile ? 24 : 32} />
          )}
        </UploadIcon>
        
        {uploading ? (
          <UploadText>Uploading... Please wait</UploadText>
        ) : currentImage ? (
          <UploadText>Image uploaded. {isMobile ? 'Tap' : 'Click or drag'} to replace</UploadText>
        ) : (
          <UploadText>
            {isDragging ? 'Drop the image here' : isMobile ? 'Tap to take a photo or select an image' : 'Click or drag and drop to upload an image'}
          </UploadText>
        )}
      </DropZone>
      
      {error && (
        <p style={{ color: '#FF5A5F', fontSize: '0.8rem', marginTop: '5px' }}>{error}</p>
      )}
      
      {currentImage && (
        <ImagePreview style={{ backgroundImage: `url(${currentImage})` }} />
      )}
    </ImageUploadContainer>
  );
};

// Update the CartItem interface to match what the application expects
interface CartItem {
  id: string;
  quantity: number;
  menuItem: MenuItem;
}

// Add styled components
const QueueStatusCard = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
`;

const StatusText = styled.div`
  font-size: 1rem;
  color: #333;
  margin-bottom: 8px;
`;

const QueueSettings = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
`;

const SettingsTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 16px;
`;

const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}
interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}

const getInitialTab = (): 'orders' | 'menu' => {
  return window.location.hash === '#menu' ? 'menu' : 'orders';
};

const ShopkeeperDashboard: React.FC = () => {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>(getInitialTab());
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: '',
    is_available: true,
    preparation_time: 15,
    tags: [],
    ingredients: []
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, menuResponse, queueResponse] = await Promise.all([
        orderService.getShopOrders(),
        menuService.getMenuItems(),
        queueService.getQueueStatus()
      ]);

      if (ordersResponse.data) setOrders(ordersResponse.data);
      if (menuResponse.data) setMenuItems(menuResponse.data);
      if (queueResponse.data) setQueueStatus(queueResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!queueStatus) return;

    const updateCountdown = () => {
      if (!queueStatus.nextIntervalTime) return;

      const nextIntervalTime = new Date(queueStatus.nextIntervalTime);
      
      if (isPast(nextIntervalTime)) {
        setCountdown(0);
        toast.info('Time to review orders!');
        return;
      }

      const remainingTime = Math.floor((nextIntervalTime.getTime() - Date.now()) / 1000);
      setCountdown(remainingTime);
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queueStatus]);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading dashboard...</LoadingText>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorIcon />
        <ErrorText>{error}</ErrorText>
        <RetryButton onClick={fetchData}>Retry</RetryButton>
      </ErrorContainer>
    );
  }

  // Check if we're in development mode
  const isDev = window.location.pathname.includes('dev-shopkeeper');
  
  // Use a mock user for development mode
  const displayName = isDev ? 'Development User' : (auth.user?.first_name || 'Shopkeeper');
  
  // Count orders by status
  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const preparingCount = orders.filter(order => order.status === 'preparing').length;
  const readyCount = orders.filter(order => order.status === 'ready').length;
  const completedCount = orders.filter(order => order.status === 'completed').length;
  
  // Set up real-time order updates
  useEffect(() => {
    const orderSubscription = subscribeToRealtimeUpdates(
      'orders',
      (payload) => {
      if (payload.eventType === 'INSERT') {
          toast.info('New order received!');
          fetchData();
      } else if (payload.eventType === 'UPDATE') {
          fetchData();
        }
      }
    );

    return () => {
      orderSubscription();
    };
  }, [fetchData]);
  
  // Set up 10-minute interval notifications
  useEffect(() => {
    // Function to fetch queue settings and calculate next interval
    const fetchQueueSettings = async () => {
      try {
        const { data: settings, error } = await supabase
          .from('queue_settings')
          .select('*')
          .single();
          
        if (error) {
          console.log('Error fetching queue settings:', error);
          return;
        }
        
        // Calculate next interval based on last_interval_time and interval_minutes
        if (settings.last_interval_time && settings.interval_minutes) {
          const lastIntervalTime = new Date(settings.last_interval_time);
          const intervalMinutes = settings.interval_minutes;
          const nextTime = new Date(lastIntervalTime.getTime() + intervalMinutes * 60 * 1000);
          
          // If we've passed this interval, calculate the next one
          if (isPast(nextTime)) {
            // Calculate how many intervals have passed
            const now = new Date();
            const minutesSinceLastInterval = Math.floor((now.getTime() - lastIntervalTime.getTime()) / (60 * 1000));
            const intervalsToAdd = Math.ceil(minutesSinceLastInterval / intervalMinutes);
            
            // Set next interval time
            setQueueStatus(prev => ({ ...prev, nextIntervalTime: addMinutes(lastIntervalTime, intervalsToAdd * intervalMinutes).toISOString() }));
          } else {
            setQueueStatus(prev => ({ ...prev, nextIntervalTime: nextTime.toISOString() }));
          }
        } else {
          // If no interval data exists, initialize with default 10 minutes
          const now = new Date();
          const minutes = Math.ceil(now.getMinutes() / 10) * 10;
          const nextTime = new Date(now);
          nextTime.setMinutes(minutes);
          nextTime.setSeconds(0);
          nextTime.setMilliseconds(0);
          
          if (isPast(nextTime)) {
            setQueueStatus(prev => ({ ...prev, nextIntervalTime: addMinutes(nextTime, 10).toISOString() }));
          } else {
            setQueueStatus(prev => ({ ...prev, nextIntervalTime: nextTime.toISOString() }));
          }
        }
      } catch (error) {
        console.error('Error setting up interval:', error);
      }
    };
    
    fetchQueueSettings();
    
    // Timer to update the countdown
    const timer = setInterval(() => {
      if (queueStatus.nextIntervalTime) {
        const now = new Date();
        const diff = Math.max(0, Math.floor((new Date(queueStatus.nextIntervalTime).getTime() - now.getTime()) / 1000));
        setCountdown(diff);
        
        // If we've reached the interval time
        if (diff === 0) {
          // Show 10-minute interval notification
          toast.info('10-minute interval check: Time to review new and current orders!', {
            autoClose: 10000 // Keep it visible for 10 seconds
          });
          
          // Fetch latest orders
          fetchData();
          
          // Update last_interval_time in database
          updateLastIntervalTime(new Date());
          
          // Set next interval time based on interval_minutes (default to 10)
          const intervalMinutes = 10; // Would normally come from settings
          setQueueStatus(prev => ({ ...prev, nextIntervalTime: addMinutes(new Date(), intervalMinutes).toISOString() }));
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [queueStatus.nextIntervalTime, fetchData]);
  
  // Function to update last_interval_time in database
  const updateLastIntervalTime = async (time: Date) => {
    try {
      await supabase
        .from('queue_settings')
        .update({ 
          last_interval_time: time.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', '1'); // Assuming there's only one settings record
    } catch (error) {
      console.error('Failed to update last interval time:', error);
    }
  };
  
  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle menu item form submission
  const handleMenuItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updatedItem = await menuService.updateMenuItem({
        ...editingItem,
        is_available: editingItem.is_available
      });

      if (updatedItem) {
        setMenuItems(prevItems => 
          prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
        toast.success('Menu item updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update menu item');
    }
  };
  
  // Handle editing a menu item
  const handleEditMenuItem = (item: MenuItem) => {
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category: item.category,
      is_available: item.available,
      preparation_time: item.preparation_time,
      tags: item.tags || [],
      ingredients: item.ingredients || []
    });
    setEditingItem(item);
  };
  
  // Handle deleting a menu item
  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Menu item deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Failed to delete menu item');
    }
  };
  
  // Handle status updates
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { success, error } = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchData();
      } else {
        toast.error(error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  // Render menu management section
  const renderMenuSection = () => {
    return (
      <>
        {editingItem ? (
          <MenuForm onSubmit={handleMenuItemSubmit}>
            <FormTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</FormTitle>
            
            <FormGroup>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={newItem.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, name: e.target.value})}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="description">Description *</Label>
              <TextArea
                id="description"
                value={newItem.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewItem({...newItem, description: e.target.value})}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={newItem.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="image">Menu Item Image *</Label>
              <ImageUploader
                currentImage={newItem.image_url}
                onImageUpload={(url) => setNewItem({...newItem, image_url: url})}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                type="text"
                value={newItem.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, category: e.target.value})}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="preparation_time">Preparation Time (minutes) *</Label>
              <Input
                id="preparation_time"
                type="number"
                min="1"
                value={newItem.preparation_time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, preparation_time: parseInt(e.target.value)})}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="available">Availability</Label>
              <Select
                id="available"
                value={newItem.is_available ? 'true' : 'false'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItem({...newItem, is_available: e.target.value === 'true'})}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </Select>
            </FormGroup>
            
            <FormButtons>
              <CancelButton type="button" onClick={() => {
                setEditingItem(null);
                setNewItem({
                  name: '',
                  description: '',
                  price: 0,
                  image_url: '',
                  category: '',
                  is_available: true
                });
              }}>
                Cancel
              </CancelButton>
              <SaveButton type="submit">
                {editingItem ? 'Update Item' : 'Add Item'}
              </SaveButton>
            </FormButtons>
          </MenuForm>
        ) : (
          <AddMenuItemButton onClick={() => setEditingItem(null)}>
            <FaPlusCircle /> Add New Menu Item
          </AddMenuItemButton>
        )}
        
        <MenuList>
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <MenuItemCard key={item.id}>
                <MenuItemImage $bgImage={item.image_url || 'https://via.placeholder.com/120x120?text=No+Image'} />
                <MenuItemDetails>
                  <MenuItemHeader>
                    <div>
                      <MenuItemName>{item.name}</MenuItemName>
                      <MenuItemCategory>{item.category}</MenuItemCategory>
                      {!item.available && <MenuItemCategory style={{ background: '#ffebee', color: '#f44336' }}>Unavailable</MenuItemCategory>}
                    </div>
                    <MenuItemPrice>₹{item.price.toFixed(2)}</MenuItemPrice>
                  </MenuItemHeader>
                  <MenuItemDescription>{item.description}</MenuItemDescription>
                  <MenuItemActions>
                    <MenuItemButton onClick={() => handleEditMenuItem(item)}>
                      <FaEdit /> Edit
                    </MenuItemButton>
                    <MenuItemButton onClick={() => handleDeleteMenuItem(item.id)}>
                      <FaTrash /> Delete
                    </MenuItemButton>
                  </MenuItemActions>
                </MenuItemDetails>
              </MenuItemCard>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
              No menu items available. Click the button above to add your first menu item.
            </div>
          )}
        </MenuList>
      </>
    );
  };
  
  // Update tab setter to save preference
  const handleTabChange = (tab: 'orders' | 'menu') => {
    localStorage.setItem('shopkeeperActiveTab', tab);
  };
  
  if (loading && getInitialTab() === 'orders') {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome, {displayName}!</WelcomeTitle>
        <p>Here's an overview of your business:</p>
        
        <StatusSummary>
          <StatusCard>
            <StatusCount>{pendingCount}</StatusCount>
            <StatusLabel>Pending</StatusLabel>
          </StatusCard>
          <StatusCard>
            <StatusCount>{preparingCount}</StatusCount>
            <StatusLabel>Preparing</StatusLabel>
          </StatusCard>
          <StatusCard>
            <StatusCount>{readyCount}</StatusCount>
            <StatusLabel>Ready</StatusLabel>
          </StatusCard>
          <StatusCard>
            <StatusCount>{completedCount}</StatusCount>
            <StatusLabel>Completed</StatusLabel>
          </StatusCard>
        </StatusSummary>
      </WelcomeSection>
      
      {/* 10-minute interval notification */}
      {queueStatus && queueStatus.nextIntervalTime && (
        <NotificationBanner>
          <NotificationText>
            <FaClock size={20} />
            Next 10-minute order update in:
          </NotificationText>
          <TimerContainer>
            {countdown ? formatTimeRemaining(countdown) : 'Loading...'}
          </TimerContainer>
        </NotificationBanner>
      )}
      
      {/* Queue status info */}
      {queueStatus && (
        <Card style={{ margin: '20px', marginTop: 0 }}>
          <OrderHeader>
            <OrderId>Queue Status</OrderId>
            <OrderStatus $status={queueStatus.isAcceptingOrders ? 'ready' : 'cancelled'}>
              {queueStatus.isAcceptingOrders ? 'Accepting Orders' : 'Queue Full'}
            </OrderStatus>
          </OrderHeader>
          <div style={{ padding: '0 20px 20px' }}>
            <p>Active orders: {queueStatus.currentPosition} / {queueStatus.maxActiveOrders}</p>
            {!queueStatus.isAcceptingOrders && queueStatus.cooldownRemaining && (
              <p>Queue will open in: {queueStatus.cooldownRemaining} minutes</p>
            )}
          </div>
        </Card>
      )}
      
      {/* Tabs for Orders and Menu */}
      <Tabs>
        <Tab 
          $active={activeTab === 'orders'} 
          onClick={() => {
            handleTabChange('orders');
            setActiveTab('orders');
          }}
        >
          Orders
        </Tab>
        <Tab 
          $active={activeTab === 'menu'} 
          onClick={() => {
            handleTabChange('menu');
            setActiveTab('menu');
          }}
        >
          Menu Management
        </Tab>
      </Tabs>
      
      {activeTab === 'orders' ? (
        orders.length > 0 ? (
        <OrdersList>
            {orders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderId>Order #{order.id.slice(-6)}</OrderId>
                <OrderTime>{formatDate(order.created_at)}</OrderTime>
              </OrderHeader>
              
              <OrderStatus $status={order.status}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </OrderStatus>
              
              <OrderItems>
                {order.items.map((item, index) => (
                  <OrderItem key={index}>
                    <ItemDetails>
                      <ItemQuantity>{item.quantity}x</ItemQuantity>
                      <ItemName>{item.menuItem?.name || 'Unknown item'}</ItemName>
                    </ItemDetails>
                    <ItemPrice>₹{(item.menuItem?.price * item.quantity || 0).toFixed(2)}</ItemPrice>
                  </OrderItem>
                ))}
              </OrderItems>
              
              <OrderFooter>
                <OrderTotal>
                  <TotalLabel>Total Amount:</TotalLabel>
                  <TotalAmount>₹{order.total_price.toFixed(2)}</TotalAmount>
                </OrderTotal>
                
                  <ActionButtons>
                    {order.status === 'pending' && (
                      <>
                        <ActionButton onClick={() => handleStatusUpdate(order.id, 'cancelled')}>
                          <FaTimesCircle />
                          Cancel
                        </ActionButton>
                        <ActionButton 
                          $isPrimary 
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                        >
                          <FaUtensils />
                          Start Preparing
                        </ActionButton>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <ActionButton 
                        $isPrimary 
                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      >
                        <FaUtensils />
                        Start Preparing
                      </ActionButton>
                    )}
                    {order.status === 'preparing' && (
                      <ActionButton 
                        $isPrimary 
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                      >
                        <FaCheckCircle />
                        Mark as Ready
                      </ActionButton>
                    )}
                    {order.status === 'ready' && (
                      <ActionButton 
                        $isPrimary 
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                      >
                        <FaReceipt />
                        Mark as Complete
                      </ActionButton>
                    )}
                  </ActionButtons>
              </OrderFooter>
            </OrderCard>
          ))}
        </OrdersList>
      ) : (
        <EmptyState>
          <FaReceipt size={40} color="#999" />
          <EmptyStateText>No active orders at the moment.</EmptyStateText>
          <p>New orders will appear here automatically.</p>
        </EmptyState>
        )
      ) : (
        renderMenuSection()
      )}
      
      {queueStatus && (
        <>
          <QueueStatusCard>
            <StatusText>
              Current Queue Status: {queueStatus.currentPosition} / {queueStatus.maxActiveOrders}
            </StatusText>
            <StatusText>
              Next Review: {queueStatus.nextIntervalTime ? new Date(queueStatus.nextIntervalTime).toLocaleString() : 'Not set'}
            </StatusText>
          </QueueStatusCard>
          
          <QueueSettings>
            <SettingsTitle>Queue Settings</SettingsTitle>
            <SettingsForm>
              <FormGroup>
                <Label>Max Active Orders</Label>
                <Input
                  type="number"
                  value={queueStatus.maxActiveOrders}
                  onChange={(e: InputChangeEvent) => {
                    if (queueStatus) {
                      setQueueStatus({
                        ...queueStatus,
                        maxActiveOrders: parseInt(e.target.value)
                      });
                    }
                  }}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Review Interval (minutes)</Label>
                <Input
                  type="number"
                  value={queueStatus.interval_minutes || 10}
                  onChange={(e: InputChangeEvent) => {
                    if (queueStatus) {
                      setQueueStatus({
                        ...queueStatus,
                        interval_minutes: parseInt(e.target.value)
                      });
                    }
                  }}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Accepting Orders</Label>
                <Select
                  value={queueStatus.isAcceptingOrders ? 'true' : 'false'}
                  onChange={(e: SelectChangeEvent) => {
                    if (queueStatus) {
                      setQueueStatus({
                        ...queueStatus,
                        isAcceptingOrders: e.target.value === 'true'
                      });
                    }
                  }}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </FormGroup>
              
              <SaveButton onClick={() => {
                // Update queue settings
                if (!queueStatus) return;
                
                // Make a Supabase call directly since the API method doesn't exist
                supabase
                  .from('queue_settings')
                  .update({
                    max_active_orders: queueStatus.maxActiveOrders,
                    interval_minutes: queueStatus.interval_minutes || 10,
                    is_accepting_orders: queueStatus.isAcceptingOrders,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', 1) // Assuming there's only one settings row
                  .then(({ error }) => {
                    if (error) {
                      toast.error('Failed to update queue settings');
                      console.error('Error updating queue settings:', error);
                    } else {
                      toast.success('Queue settings updated successfully');
                    }
                  });
              }}>
                Update Settings
              </SaveButton>
            </SettingsForm>
          </QueueSettings>
        </>
      )}
    </DashboardContainer>
  );
};

// Add styled components for loading and error states
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const ErrorText = styled.p`
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
`;

const RetryButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

export default ShopkeeperDashboard;
