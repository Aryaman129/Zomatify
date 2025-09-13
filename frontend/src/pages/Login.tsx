import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: calc(100vh - 60px);
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  text-align: center;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #FF5A5F;
    outline: none;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: #FF5A5F;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #FF4448;
  }
  
  &:disabled {
    background-color: #ffb3b5;
    cursor: not-allowed;
  }
`;

const ShopkeeperButton = styled.button`
  width: 100%;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
  
  &:hover {
    background-color: #3e8e41;
  }
`;

const FormFooter = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;

  a {
  color: #FF5A5F;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const { success, error } = await signIn(email, password);
      
      if (success) {
        toast.success('Logged in successfully');
        navigate('/');
      } else {
        toast.error(error || 'Failed to login. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Special handler for direct shopkeeper access
  const handleShopkeeperAccess = () => {
    navigate('/vendor/login');
    toast.info('Redirecting to vendor login');
  };
  
  return (
    <>
      <AppHeader title="Login" />
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <FormTitle>Welcome Back</FormTitle>
          <FormSubtitle>Sign in to continue to Zomatify</FormSubtitle>
          
          <InputGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </InputGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </SubmitButton>
          
          <ShopkeeperButton type="button" onClick={handleShopkeeperAccess}>
            Shopkeeper Access
          </ShopkeeperButton>
          
          <FormFooter>
            Don't have an account? <Link to="/register">Register</Link>
          </FormFooter>
        </LoginForm>
      </LoginContainer>
    </>
  );
};

export default Login;
