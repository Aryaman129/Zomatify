import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaSpinner, FaUtensils, FaReceipt, FaChartBar } from 'react-icons/fa';

// Loading animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// Basic spinner
const SpinnerContainer = styled.div<{ $size?: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props: { $size?: 'small' | 'medium' | 'large' }) => {
    switch (props.$size) {
      case 'small': return '10px';
      case 'large': return '40px';
      default: return '20px';
    }
  }};
`;

const Spinner = styled(FaSpinner)<{ $size?: 'small' | 'medium' | 'large' }>`
  animation: ${spin} 1s linear infinite;
  color: #667eea;
  font-size: ${(props: { $size?: 'small' | 'medium' | 'large' }) => {
    switch (props.$size) {
      case 'small': return '1rem';
      case 'large': return '2rem';
      default: return '1.5rem';
    }
  }};
`;

// Loading skeleton
const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
`;

const SkeletonItem = styled.div<{ $width?: string; $height?: string }>`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 6px;
  width: ${(props: { $width?: string; $height?: string }) => props.$width || '100%'};
  height: ${(props: { $width?: string; $height?: string }) => props.$height || '20px'};
`;

// Dashboard loading
const DashboardLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  text-align: center;
`;

const LoadingIcon = styled.div`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 20px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.2rem;
`;

const LoadingMessage = styled.p`
  color: #666;
  margin-bottom: 20px;
`;

const LoadingProgress = styled.div`
  width: 200px;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: ${(props: { $progress: number }) => props.$progress}%;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
`;

// Component loading states
export const LoadingSpinner: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => (
  <SpinnerContainer $size={size}>
    <Spinner $size={size} />
  </SpinnerContainer>
);

export const LoadingSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <SkeletonContainer>
    {Array.from({ length: lines }, (_, index) => (
      <SkeletonItem 
        key={index}
        $width={index === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </SkeletonContainer>
);

export const OrderCardSkeleton: React.FC = () => (
  <div style={{ 
    background: 'white', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: '15px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
      <div>
        <SkeletonItem $width="120px" $height="20px" />
        <div style={{ marginTop: '5px' }}>
          <SkeletonItem $width="80px" $height="16px" />
        </div>
      </div>
      <SkeletonItem $width="60px" $height="24px" />
    </div>
    
    <SkeletonItem $width="100%" $height="16px" />
    <div style={{ marginTop: '10px' }}>
      <SkeletonItem $width="80%" $height="16px" />
    </div>
    
    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
      <SkeletonItem $width="100px" $height="32px" />
      <SkeletonItem $width="80px" $height="32px" />
    </div>
  </div>
);

export const DashboardLoading: React.FC<{ 
  message?: string; 
  progress?: number;
  icon?: React.ReactNode;
}> = ({ 
  message = 'Loading dashboard...', 
  progress,
  icon = <FaUtensils />
}) => (
  <DashboardLoadingContainer>
    <LoadingIcon>
      {icon}
    </LoadingIcon>
    
    <LoadingTitle>Loading Dashboard</LoadingTitle>
    <LoadingMessage>{message}</LoadingMessage>
    
    {progress !== undefined && (
      <>
        <LoadingProgress>
          <ProgressBar $progress={progress} />
        </LoadingProgress>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          {progress}% complete
        </div>
      </>
    )}
    
    <LoadingSpinner size="large" />
  </DashboardLoadingContainer>
);

export const AnalyticsLoading: React.FC = () => (
  <DashboardLoading 
    message="Loading analytics data..."
    icon={<FaChartBar />}
  />
);

export const OrdersLoading: React.FC = () => (
  <div>
    <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
      <SkeletonItem $width="200px" $height="40px" />
      <SkeletonItem $width="120px" $height="40px" />
      <SkeletonItem $width="100px" $height="40px" />
    </div>
    
    {Array.from({ length: 3 }, (_, index) => (
      <OrderCardSkeleton key={index} />
    ))}
  </div>
);

export const MenuLoading: React.FC = () => (
  <div>
    <div style={{ marginBottom: '20px' }}>
      <SkeletonItem $width="150px" $height="40px" />
    </div>
    
    <div style={{ display: 'grid', gap: '15px' }}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '15px'
        }}>
          <SkeletonItem $width="100px" $height="100px" />
          <div style={{ flex: 1 }}>
            <SkeletonItem $width="60%" $height="20px" />
            <div style={{ marginTop: '10px' }}>
              <SkeletonItem $width="100%" $height="16px" />
            </div>
            <div style={{ marginTop: '10px' }}>
              <SkeletonItem $width="40%" $height="16px" />
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <SkeletonItem $width="60px" $height="28px" />
              <SkeletonItem $width="60px" $height="28px" />
              <SkeletonItem $width="60px" $height="28px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Loading overlay for forms
export const LoadingOverlay: React.FC<{ 
  isLoading: boolean; 
  message?: string;
  children: React.ReactNode;
}> = ({ isLoading, message = 'Processing...', children }) => (
  <div style={{ position: 'relative' }}>
    {children}
    {isLoading && (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        borderRadius: '12px'
      }}>
        <LoadingSpinner />
        <div style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem' }}>
          {message}
        </div>
      </div>
    )}
  </div>
);

// Button loading state
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}> = ({ isLoading, children, onClick, disabled, variant = 'primary' }) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    style={{
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      background: variant === 'primary' ? '#667eea' : '#f8f9fa',
      color: variant === 'primary' ? 'white' : '#666',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'all 0.3s ease'
    }}
  >
    {isLoading ? <LoadingSpinner size="small" /> : children}
  </button>
);

// Network status indicator
export const NetworkStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <div style={{
    position: 'fixed',
    top: '10px',
    right: '10px',
    padding: '8px 12px',
    borderRadius: '6px',
    background: isOnline ? '#28a745' : '#dc3545',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '600',
    zIndex: 1000,
    display: isOnline ? 'none' : 'block'
  }}>
    {isOnline ? '🟢 Online' : '🔴 Offline'}
  </div>
);
