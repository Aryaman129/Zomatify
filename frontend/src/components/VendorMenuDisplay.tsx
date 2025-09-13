import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaClock, FaMapMarkerAlt, FaStar, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { menuService } from '../services/api';
import { MenuItem, Vendor } from '../types/index';
import { useCart } from '../contexts/CartContext';
import supabase from '../services/supabaseClient';
import realtimeSync from '../services/realtimeSync';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const VendorHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  position: relative;
  overflow: hidden;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-5px);
  }
`;

const VendorInfo = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const VendorName = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const VendorDescription = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
  line-height: 1.6;
`;

const VendorStats = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  opacity: 0.9;
`;

const MenuContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const CategorySection = styled.div`
  margin-bottom: 40px;
`;

const CategoryTitle = styled.h2`
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 25px 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #667eea;
  display: inline-block;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
`;

const MenuItemCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ItemImage = styled.div.withConfig({
  shouldForwardProp: (prop: string) => prop !== 'imageUrl',
})<{ imageUrl?: string }>`
  width: 100%;
  height: 200px;
  background: ${(props: { imageUrl?: string }) => 
    props.imageUrl 
      ? `url(${props.imageUrl})` 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ItemImagePlaceholder = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const ItemContent = styled.div`
  padding: 20px;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ItemName = styled.h3`
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
`;

const ItemPrice = styled.div`
  color: #27ae60;
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ItemDescription = styled.p`
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 10px 0 15px 0;
`;

const ItemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const PrepTime = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9rem;
`;

const ItemTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const AddToCartButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

interface VendorMenuDisplayProps {
  vendorId?: string;
}

const VendorMenuDisplay: React.FC<VendorMenuDisplayProps> = ({ vendorId: propVendorId }) => {
  const { vendorId: paramVendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const vendorId = propVendorId || paramVendorId;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId) {
      loadVendorData();

      // Setup real-time menu synchronization
      const unsubscribe = realtimeSync.subscribeToMenuUpdates(
        vendorId,
        (payload) => {
          console.log('Customer menu update:', payload);

          if (payload.eventType === 'UPDATE') {
            setMenuItems(prev => prev.map(item =>
              String(item.id) === String(payload.new.id) ? payload.new : item
            ));
          } else if (payload.eventType === 'INSERT') {
            setMenuItems(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setMenuItems(prev => prev.filter(item => String(item.id) !== String(payload.old.id)));
          }
        }
      );

      return unsubscribe;
    }
  }, [vendorId]);

  const loadVendorData = async () => {
    if (!vendorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load vendor information
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      // Load vendor menu items
      const menuResult = await menuService.getMenuItems(vendorId);
      
      if (menuResult.success) {
        setMenuItems(menuResult.data || []);
      } else {
        throw new Error(menuResult.error || 'Failed to load menu items');
      }
    } catch (error: any) {
      console.error('Error loading vendor data:', error);
      setError(error.message || 'Failed to load vendor information');
      toast.error('Failed to load vendor information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    try {
      addItem(menuItem, 1);
      toast.success(`${menuItem.name} added to cart!`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const groupItemsByCategory = (items: MenuItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    
    return grouped;
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading vendor menu...</LoadingState>
      </Container>
    );
  }

  if (error || !vendor) {
    return (
      <Container>
        <EmptyState>
          <h3>Vendor not found</h3>
          <p>The requested vendor could not be found.</p>
          <button onClick={() => navigate('/')}>Go Back Home</button>
        </EmptyState>
      </Container>
    );
  }

  const groupedItems = groupItemsByCategory(menuItems);

  return (
    <Container>
      <VendorHeader>
        <VendorInfo>
          <BackButton onClick={() => navigate('/')}>
            <FaArrowLeft />
          </BackButton>
          
          <VendorName>{vendor.business_name}</VendorName>
          <VendorDescription>{vendor.description}</VendorDescription>
          
          <VendorStats>
            <StatItem>
              <FaClock />
              {vendor.estimated_delivery_time || 30} mins delivery
            </StatItem>
            <StatItem>
              <FaRupeeSign />
              Min order: ₹{vendor.minimum_order_amount || 100}
            </StatItem>
            <StatItem>
              <FaMapMarkerAlt />
              {vendor.address && typeof vendor.address === 'object' && vendor.address.city ? vendor.address.city : 'Location'}
            </StatItem>
            <StatItem>
              <FaStar />
              4.5 (120+ reviews)
            </StatItem>
          </VendorStats>
        </VendorInfo>
      </VendorHeader>

      <MenuContainer>
        {Object.keys(groupedItems).length === 0 ? (
          <EmptyState>
            <h3>No menu items available</h3>
            <p>This vendor hasn't added any menu items yet.</p>
          </EmptyState>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <CategorySection key={category}>
              <CategoryTitle>{category}</CategoryTitle>
              <MenuGrid>
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ItemImage imageUrl={item.image_url}>
                      {!item.image_url && (
                        <ItemImagePlaceholder>
                          {item.name}
                        </ItemImagePlaceholder>
                      )}
                    </ItemImage>
                    
                    <ItemContent>
                      <ItemHeader>
                        <ItemName>{item.name}</ItemName>
                        <ItemPrice>
                          <FaRupeeSign size={16} />
                          {item.price.toFixed(2)}
                        </ItemPrice>
                      </ItemHeader>
                      
                      <ItemDescription>{item.description}</ItemDescription>
                      
                      <ItemMeta>
                        <PrepTime>
                          <FaClock />
                          {item.preparation_time || 15} mins
                        </PrepTime>
                        
                        <ItemTags>
                          {item.tags?.slice(0, 2).map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                        </ItemTags>
                      </ItemMeta>
                      
                      <AddToCartButton
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.is_available}
                      >
                        {item.is_available ? 'Add to Cart' : 'Not Available'}
                      </AddToCartButton>
                    </ItemContent>
                  </MenuItemCard>
                ))}
              </MenuGrid>
            </CategorySection>
          ))
        )}
      </MenuContainer>
    </Container>
  );
};

export default VendorMenuDisplay;
