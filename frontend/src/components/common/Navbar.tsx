import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaShoppingCart, FaUser, FaUtensils, FaHistory, FaSignOutAlt, FaTable, FaBell, FaStore } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { notificationService } from '../../services/api';

const NavContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoText = styled.span`
  font-size: 1.5em;
  font-weight: bold;
  margin-left: 10px;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 10px;
  color: #333;
  transition: color 0.3s;

  &:hover {
    color: #007bff;
  }
`;

const LinkIcon = styled.span`
  margin-right: 10px;
`;

const LinkText = styled.span`
  font-size: 1em;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 10px;
  color: #333;
  transition: color 0.3s;

  &:hover {
    color: #007bff;
  }
`;

const ActionIcon = styled.span`
  margin-right: 10px;
`;

const NotificationBadge = styled.span`
  background-color: #dc3545;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.8em;
  margin-left: 5px;
`;

const CartBadge = styled.span`
  background-color: #dc3545;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.8em;
  margin-left: 5px;
`;

const ActionButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Count items in cart
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const { success, data } = await notificationService.getUnreadCount();
        if (success && data) {
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Set up poll interval for notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <NavContainer>
      <Logo to="/">
        <FaUtensils />
        <LogoText>Zomatify</LogoText>
      </Logo>
      
      <NavLinks>
        <NavLink to="/">
          <LinkIcon><FaHome /></LinkIcon>
          <LinkText>Home</LinkText>
        </NavLink>
        
        <NavLink to="/menu">
          <LinkIcon><FaUtensils /></LinkIcon>
          <LinkText>Menu</LinkText>
        </NavLink>
        
        {user && (
          <>
            <NavLink to="/orders">
              <LinkIcon><FaHistory /></LinkIcon>
              <LinkText>Orders</LinkText>
            </NavLink>
            
            {user.role === 'shopkeeper' && (
              <NavLink to="/shopkeeper">
                <LinkIcon><FaStore /></LinkIcon>
                <LinkText>Shopkeeper</LinkText>
              </NavLink>
            )}
          </>
        )}
      </NavLinks>
      
      <NavActions>
        {user ? (
          <>
            <ActionLink to="/notifications">
              <ActionIcon><FaBell /></ActionIcon>
              {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
            </ActionLink>
            
            <ActionLink to="/cart">
              <ActionIcon><FaShoppingCart /></ActionIcon>
              {cartItemCount > 0 && <CartBadge>{cartItemCount}</CartBadge>}
            </ActionLink>
            
            <ActionLink to="/profile">
              <ActionIcon><FaUser /></ActionIcon>
            </ActionLink>
          </>
        ) : (
          <ActionButton onClick={() => navigate('/login')}>Login</ActionButton>
        )}
      </NavActions>
    </NavContainer>
  );
};

export default Navbar; 