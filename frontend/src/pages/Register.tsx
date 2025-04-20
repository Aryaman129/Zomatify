import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import AppHeader from '../components/common/AppHeader';

const RegisterContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
`;

const RegisterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

const FormTitle = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 15px 15px 50px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #FF5A5F;
    outline: none;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const Button = styled.button`
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #FF3B41;
  }
  
  &:disabled {
    background-color: #ffb3b5;
    cursor: not-allowed;
  }
`;

const BottomText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 0.9rem;
`;

const StyledLink = styled(Link)`
  color: #FF5A5F;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const { success, error } = await signUp(email, password, firstName, lastName, phone);
      
      if (success) {
        toast.success('Registration successful! Please check your email for verification.');
        navigate('/login');
      } else {
        toast.error(error || 'Failed to register. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <AppHeader title="Register" />
      <RegisterContainer>
        <RegisterForm onSubmit={handleSubmit}>
          <FormTitle>Create Account</FormTitle>
          <FormSubtitle>Sign up to get started with Zomatify</FormSubtitle>
          
          <InputGroup>
            <InputIcon>
              <FaUser />
            </InputIcon>
            <Input 
              type="text" 
              placeholder="First Name" 
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <InputIcon>
              <FaUser />
            </InputIcon>
            <Input 
              type="text" 
              placeholder="Last Name" 
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </InputGroup>
          
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
              <FaPhone />
            </InputIcon>
            <Input 
              type="tel" 
              placeholder="Phone Number (optional)" 
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              autoComplete="tel"
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
              autoComplete="new-password"
              required
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </RegisterForm>
        
        <Spacer />
        
        <BottomText>
          Already have an account? <StyledLink to="/login">Sign In</StyledLink>
        </BottomText>
      </RegisterContainer>
    </>
  );
};

export default Register;
