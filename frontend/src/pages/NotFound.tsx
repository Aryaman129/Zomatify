import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #FF5A5F;
  margin-bottom: 24px;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 32px;
  max-width: 500px;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #FF5A5F;
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #E54B50;
  }
`;

const NotFound: React.FC = () => {
  return (
    <PageContainer>
      <AppHeader title="Page Not Found" />
      
      <ContentContainer>
        <ErrorIcon>
          <FaExclamationTriangle />
        </ErrorIcon>
        
        <ErrorTitle>404 - Page Not Found</ErrorTitle>
        
        <ErrorMessage>
          Oops! The page you are looking for doesn't exist or has been moved.
        </ErrorMessage>
        
        <HomeButton to="/">
          <FaHome /> Go to Home
        </HomeButton>
      </ContentContainer>
    </PageContainer>
  );
};

export default NotFound;
