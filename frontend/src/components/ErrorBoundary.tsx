import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaRedo, FaBug } from 'react-icons/fa';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ff6b6b;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.5rem;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 30px;
  max-width: 500px;
  line-height: 1.6;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  background: ${(props: { $variant?: 'primary' | 'secondary' }) => props.$variant === 'secondary' ? '#f8f9fa' : '#667eea'};
  color: ${(props: { $variant?: 'primary' | 'secondary' }) => props.$variant === 'secondary' ? '#666' : 'white'};
  border: ${(props: { $variant?: 'primary' | 'secondary' }) => props.$variant === 'secondary' ? '1px solid #ddd' : 'none'};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const ErrorDetails = styled.details`
  margin-top: 20px;
  text-align: left;
  max-width: 600px;
  
  summary {
    cursor: pointer;
    color: #666;
    font-weight: 600;
    margin-bottom: 10px;
    
    &:hover {
      color: #333;
    }
  }
`;

const ErrorStack = styled.pre`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #666;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service (in production)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: Send to monitoring service
    // errorMonitoringService.captureException(errorData);
    console.error('Error logged:', errorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Create mailto link with error details
    const subject = encodeURIComponent('Bug Report: Dashboard Error');
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@zomatify.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorIcon>
            <FaExclamationTriangle />
          </ErrorIcon>
          
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          
          <ErrorMessage>
            We're sorry, but something unexpected happened. This error has been logged 
            and our team will investigate. Please try refreshing the page or contact 
            support if the problem persists.
          </ErrorMessage>

          <ErrorActions>
            <ActionButton onClick={this.handleRetry}>
              <FaRedo />
              Try Again
            </ActionButton>

            <ActionButton $variant="secondary" onClick={this.handleReload}>
              <FaRedo />
              Reload Page
            </ActionButton>
            
            <ActionButton $variant="secondary" onClick={this.handleReportBug}>
              <FaBug />
              Report Bug
            </ActionButton>
          </ErrorActions>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <summary>Error Details (Development Only)</summary>
              <ErrorStack>
                <strong>Error:</strong> {this.state.error.message}
                {'\n\n'}
                <strong>Stack Trace:</strong>
                {'\n'}
                {this.state.error.stack}
                {'\n\n'}
                <strong>Component Stack:</strong>
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </ErrorStack>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // In production, log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // errorMonitoringService.captureException(error, { context });
    }
  };

  return { handleError };
};

export default ErrorBoundary;
