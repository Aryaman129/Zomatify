import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  onNotificationClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

const HeaderContainer = styled.header<{ $backgroundColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: ${(props: { $backgroundColor: string }) => props.$backgroundColor};
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  margin-right: 16px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const HeaderTitle = styled.h1<{ $textColor: string }>`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props: { $textColor: string }) => props.$textColor};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
`;

const NotificationButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  position: relative;
  
  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background-color: #ff3b30;
  border-radius: 50%;
`;

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = true,
  showNotificationButton = false,
  onNotificationClick,
  backgroundColor = '#FF5A5F',
  textColor = '#FFFFFF'
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      // Default notification behavior
      navigate('/notifications');
    }
  };

  return (
    <HeaderContainer 
      as={motion.header}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      $backgroundColor={backgroundColor}
    >
      <HeaderLeft>
        {showBackButton && (
          <BackButton onClick={handleBackClick}>
            <FaArrowLeft color={textColor} size={18} />
          </BackButton>
        )}
        <HeaderTitle $textColor={textColor}>{title}</HeaderTitle>
      </HeaderLeft>
      
      <HeaderRight>
        {showNotificationButton && (
          <NotificationButton onClick={handleNotificationClick}>
            <FaBell color={textColor} size={18} />
            <NotificationDot />
          </NotificationButton>
        )}
      </HeaderRight>
    </HeaderContainer>
  );
};

export default AppHeader;
