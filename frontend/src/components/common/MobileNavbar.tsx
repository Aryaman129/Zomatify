import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome, FaUtensils, FaShoppingCart, FaUser, FaHistory } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0));
  height: 65px;
`;

const NavItem = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(props: { $isActive: boolean }) => props.$isActive ? '#FF5A5F' : '#666'};
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: ${(props: { $isActive: boolean }) => props.$isActive ? '600' : '400'};
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    color: #FF5A5F;
  }
`;

const NavIcon = styled.div`
  margin-bottom: 4px;
`;

const NavLabel = styled.span`
  font-size: 0.65rem;
  text-align: center;
`;

const BadgeCounter = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #FF5A5F;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <NavContainer>
      <NavItem to="/" $isActive={isActive('/')}>
        <NavIcon>
          <FaHome size={22} />
        </NavIcon>
        <NavLabel>Home</NavLabel>
      </NavItem>
      
      <NavItem to="/menu" $isActive={isActive('/menu')}>
        <NavIcon>
          <FaUtensils size={22} />
        </NavIcon>
        <NavLabel>Menu</NavLabel>
      </NavItem>
      
      <NavItem to="/cart" $isActive={isActive('/cart')}>
        <NavIcon>
          <FaShoppingCart size={22} />
        </NavIcon>
        <NavLabel>Cart</NavLabel>
        {totalItems > 0 && <BadgeCounter>{totalItems > 99 ? '99+' : totalItems}</BadgeCounter>}
      </NavItem>
      
      <NavItem to="/orders" $isActive={isActive('/orders')}>
        <NavIcon>
          <FaHistory size={22} />
        </NavIcon>
        <NavLabel>Orders</NavLabel>
      </NavItem>
      
      <NavItem to="/profile" $isActive={isActive('/profile')}>
        <NavIcon>
          <FaUser size={22} />
        </NavIcon>
        <NavLabel>Profile</NavLabel>
      </NavItem>
    </NavContainer>
  );
};

export default MobileNavbar;
