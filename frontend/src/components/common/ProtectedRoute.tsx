import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'shopkeeper' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading, error } = useAuth();
  const navigate = useNavigate();
  
  // Handle auth errors and redirect
  useEffect(() => {
    if (error) {
      console.error('Auth error in protected route:', error);
      toast.error('Authentication error. Please login again.');
      navigate('/login');
    }
  }, [error, navigate]);

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Role check if required
  if (requiredRole && user.role !== requiredRole) {
    console.log(`User role ${user.role} doesn't match required role ${requiredRole}`);
    
    // Redirect to appropriate page based on role
    if (user.role === 'shopkeeper') {
      return <Navigate to="/shopkeeper" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
};

export default ProtectedRoute;
