import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaClock, FaMapMarkerAlt, FaStar, FaRupeeSign, FaUtensils, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import supabase from '../services/supabaseClient';
import { useCart } from '../contexts/CartContext';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
`;

const VendorContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const VendorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
`;

const VendorCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }
`;

const VendorImage = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  position: relative;
  overflow: hidden;
`;

const VendorContent = styled.div`
  padding: 25px;
`;

const VendorName = styled.h3`
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
`;

const VendorDescription = styled.p`
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VendorStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;
`;

const StatIcon = styled.div`
  color: #667eea;
  font-size: 1rem;
`;

const VendorBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const Badge = styled.span<{ type?: 'cuisine' | 'feature' }>`
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
  
  background: ${(props: { type?: 'cuisine' | 'feature' }) => {
    switch (props.type) {
      case 'cuisine': return '#e3f2fd';
      case 'feature': return '#f3e5f5';
      default: return '#e8f5e8';
    }
  }};
  
  color: ${(props: { type?: 'cuisine' | 'feature' }) => {
    switch (props.type) {
      case 'cuisine': return '#1976d2';
      case 'feature': return '#7b1fa2';
      default: return '#388e3c';
    }
  }};
`;

const ViewMenuButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const FloatingCartButton = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CartBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
`;

interface Vendor {
  id: string;
  business_name: string;
  description: string;
  business_type: string;
  address: any;
  phone_number: string;
  email: string;
  delivery_fee: number;
  minimum_order_amount: number;
  estimated_delivery_time: number;
  is_active: boolean;
}

const VendorSelection: React.FC = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading vendors...');

      // First, let's check if we can access the vendors table at all
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          description,
          business_type,
          address,
          phone_number,
          vendor_email,
          delivery_fee,
          minimum_order_amount,
          estimated_delivery_time,
          is_active
        `)
        .eq('is_active', true)
        .order('business_name');

      console.log('Vendors query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No vendors found in database');
        // Let's try without the is_active filter to see if vendors exist
        const { data: allVendors, error: allError } = await supabase
          .from('vendors')
          .select('id, business_name, is_active');

        console.log('All vendors check:', { allVendors, allError });
      }

      setVendors(data || []);
      console.log('Set vendors:', data?.length || 0, 'vendors loaded');
    } catch (error: any) {
      console.error('Error loading vendors:', error);
      setError(error.message || 'Failed to load vendors');
      toast.error('Failed to load vendors: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVendorClick = (vendorId: string) => {
    navigate(`/vendor/${vendorId}/menu`);
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const getVendorIcon = (businessType: string) => {
    switch (businessType?.toLowerCase()) {
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'bakery': return '🥖';
      case 'fast_food': return '🍔';
      default: return '🍕';
    }
  };

  const getCuisineType = (businessName: string, description: string) => {
    const text = `${businessName} ${description}`.toLowerCase();
    
    if (text.includes('north indian') || text.includes('punjabi') || text.includes('dhaba')) {
      return 'North Indian';
    } else if (text.includes('south indian') || text.includes('dosa') || text.includes('idli')) {
      return 'South Indian';
    } else if (text.includes('pizza') || text.includes('italian')) {
      return 'Italian';
    } else if (text.includes('chinese') || text.includes('noodles')) {
      return 'Chinese';
    } else if (text.includes('fast food') || text.includes('burger')) {
      return 'Fast Food';
    }
    return 'Multi-Cuisine';
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Choose Your Restaurant</Title>
          <Subtitle>Discover amazing food from local vendors</Subtitle>
        </Header>
        <LoadingState>Loading restaurants...</LoadingState>
      </Container>
    );
  }

  if (error || vendors.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Choose Your Restaurant</Title>
          <Subtitle>Discover amazing food from local vendors</Subtitle>
        </Header>
        <EmptyState>
          <h3>No restaurants available</h3>
          <p>We're working on adding more restaurants to your area.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Choose Your Restaurant</Title>
        <Subtitle>Discover amazing food from {vendors.length} local vendors</Subtitle>
      </Header>

      <VendorContainer>
        <VendorGrid>
          {vendors.map((vendor, index) => (
            <VendorCard
              key={vendor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => handleVendorClick(vendor.id)}
            >
              <VendorImage>
                <span style={{ fontSize: '4rem' }}>
                  {getVendorIcon(vendor.business_type)}
                </span>
              </VendorImage>
              
              <VendorContent>
                <VendorName>{vendor.business_name}</VendorName>
                <VendorDescription>{vendor.description}</VendorDescription>
                
                <VendorBadges>
                  <Badge type="cuisine">
                    {getCuisineType(vendor.business_name, vendor.description)}
                  </Badge>
                  <Badge type="feature">
                    {vendor.business_type || 'Restaurant'}
                  </Badge>
                </VendorBadges>
                
                <VendorStats>
                  <StatItem>
                    <StatIcon><FaClock /></StatIcon>
                    {vendor.estimated_delivery_time || 30} mins
                  </StatItem>
                  
                  <StatItem>
                    <StatIcon><FaRupeeSign /></StatIcon>
                    Min ₹{vendor.minimum_order_amount || 100}
                  </StatItem>
                  
                  <StatItem>
                    <StatIcon><FaMapMarkerAlt /></StatIcon>
                    {vendor.address && typeof vendor.address === 'object' && vendor.address.city
                      ? vendor.address.city
                      : typeof vendor.address === 'string'
                        ? vendor.address
                        : 'Nearby'}
                  </StatItem>
                  
                  <StatItem>
                    <StatIcon><FaStar /></StatIcon>
                    4.5 (120+ reviews)
                  </StatItem>
                </VendorStats>
                
                <ViewMenuButton>
                  <FaUtensils style={{ marginRight: '8px' }} />
                  View Menu
                </ViewMenuButton>
              </VendorContent>
            </VendorCard>
          ))}
        </VendorGrid>
      </VendorContainer>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <FloatingCartButton
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={handleCartClick}
        >
          <FaShoppingCart />
          View Cart
          <CartBadge>{totalItems}</CartBadge>
        </FloatingCartButton>
      )}
    </Container>
  );
};

export default VendorSelection;
