import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  background-color: #FF5A5F;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
`;

const Sidebar = styled.aside`
  background-color: #f8f9fa;
  width: 250px;
  padding: 16px 0;
  position: fixed;
  height: calc(100vh - 64px);
  left: 0;
  top: 64px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  z-index: 10;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    padding: 0;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  }
`;

const NavMenu = styled.nav`
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #efefef;
  }
  
  &.active {
    background-color: #e6e6e6;
    color: #FF5A5F;
    border-left: 3px solid #FF5A5F;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 10px;
    
    &.active {
      border-left: none;
      border-top: 3px solid #FF5A5F;
    }
  }
`;

const NavIcon = styled.span`
  margin-right: 12px;
  
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 4px;
  }
`;

const NavText = styled.span`
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 20px;
  margin-left: 250px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding-bottom: 70px;
  }
`;

const ShopkeeperLayout: React.FC = () => {
  // Get user from authentication
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isDev = window.location.pathname.includes('dev-shopkeeper');
  
  // Use mock user data if in development route
  const displayName = isDev ? 'Development User' : (user?.first_name || 'Shopkeeper');
  
  const handleSignOut = async () => {
    if (isDev) {
      // In dev mode, just redirect to login
      navigate('/login');
      return;
    }
    
    // Normal signout for authenticated users
    await signOut();
    navigate('/login');
  };
  
  return (
    <LayoutContainer>
      <Header>
        <Title>Zomatify Shopkeeper {isDev && '(Development Mode)'}</Title>
      </Header>
      
      <Sidebar>
        <NavMenu>
          <NavItem to={isDev ? "/dev-shopkeeper" : "/shopkeeper"}>
            <NavIcon><FaHome size={20} /></NavIcon>
            <NavText>Dashboard</NavText>
          </NavItem>
          <NavItem to={isDev ? "/dev-shopkeeper/analytics" : "/shopkeeper/analytics"}>
            <NavIcon><FaChartBar size={20} /></NavIcon>
            <NavText>Analytics</NavText>
          </NavItem>
          <NavItem to="/login" onClick={handleSignOut}>
            <NavIcon><FaSignOutAlt size={20} /></NavIcon>
            <NavText>Sign Out</NavText>
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <Content>
        <Outlet />
      </Content>
    </LayoutContainer>
  );
};

export default ShopkeeperLayout;
