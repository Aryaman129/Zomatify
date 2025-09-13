import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaUtensils, FaCalendarAlt, FaUsers, FaBell } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';

const HomeContainer = styled.div`
  padding-bottom: 80px;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #FF5A5F 0%, #FF385C 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
  border-radius: 0 0 20px 20px;
`;

const HeroTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  margin-bottom: 20px;
  opacity: 0.9;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
`;

const FeatureCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  text-decoration: none;
  color: #333;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 150px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: #FF5A5F;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0;
`;

const RecentOrdersSection = styled.div`
  padding: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #333;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 12px;
  color: #666;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background-color: #FF5A5F;
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 16px;
  box-shadow: 0 4px 8px rgba(255, 90, 95, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #FF385C;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(255, 90, 95, 0.4);
  }
`;

const Home: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <HomeContainer>
      <AppHeader title="Zomatify" showBackButton={false} />
      
      <HeroSection>
        <HeroTitle>Welcome{user ? `, ${user.user_metadata?.first_name || 'back'}` : ''}!</HeroTitle>
        <HeroSubtitle>Order delicious food from your favorite restaurants</HeroSubtitle>
      </HeroSection>
      
      <FeaturesGrid>
        <FeatureCard to="/vendors">
          <FeatureIcon>
            <FaUtensils />
          </FeatureIcon>
          <FeatureTitle>Choose Restaurant</FeatureTitle>
        </FeatureCard>
        
        <FeatureCard to="/schedule-order">
          <FeatureIcon>
            <FaCalendarAlt />
          </FeatureIcon>
          <FeatureTitle>Schedule Order</FeatureTitle>
        </FeatureCard>
        
        <FeatureCard to="/group-order">
          <FeatureIcon>
            <FaUsers />
          </FeatureIcon>
          <FeatureTitle>Group Order</FeatureTitle>
        </FeatureCard>
        
        <FeatureCard to="/notifications">
          <FeatureIcon>
            <FaBell />
          </FeatureIcon>
          <FeatureTitle>Notifications</FeatureTitle>
        </FeatureCard>
      </FeaturesGrid>
      
      <RecentOrdersSection>
        <SectionTitle>Recent Orders</SectionTitle>
        <EmptyState>
          <p>You don't have any recent orders</p>
          <CTAButton to="/vendors">Choose Restaurant</CTAButton>
        </EmptyState>
      </RecentOrdersSection>
    </HomeContainer>
  );
};

export default Home;
