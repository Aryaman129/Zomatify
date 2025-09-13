import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSignOutAlt, FaHistory, FaCreditCard, FaBell, FaCog } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ProfileSection = styled.div`
  padding: 20px;
`;

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const ProfileAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #FF5A5F;
  margin-bottom: 16px;
`;

const ProfileName = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const ProfileEmail = styled.p`
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: #666;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  padding: 0;
`;

const ProfileField = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FieldIcon = styled.div`
  width: 40px;
  color: #FF5A5F;
`;

const FieldContent = styled.div`
  flex: 1;
`;

const FieldLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  font-size: 0.95rem;
  color: #333;
`;

const MenuOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px;
  background: none;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

const OptionIcon = styled.div`
  width: 40px;
  color: #FF5A5F;
`;

const OptionText = styled.div`
  flex: 1;
  font-size: 0.95rem;
  color: #333;
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        // Since we don't have a separate userService, we'll use the current user data
        // In a real implementation, we would call a dedicated API endpoint
        const success = true;
        const data = {
          id: user.id,
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
          email: user.email || '',
          phone: user.user_metadata?.phone_number,
          address: ''
        };
        const error = null;
        
        if (success && data) {
          setProfile(data);
        } else {
          console.error('Failed to fetch profile:', error);
          toast.error('Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);
  
  const handleLogout = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        toast.success('Logged out successfully');
        navigate('/login');
      } else {
        toast.error(error || 'Failed to logout');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <PageContainer>
      <AppHeader title="Profile" showBackButton={false} />
      
      <ProfileSection>
        <ProfileHeader>
          <ProfileAvatar>
            <FaUser />
          </ProfileAvatar>
          <ProfileName>{profile?.name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'User'}</ProfileName>
          <ProfileEmail>{profile?.email || user.email}</ProfileEmail>
        </ProfileHeader>
        
        <Card>
          <CardHeader>Personal Information</CardHeader>
          <CardContent>
            <ProfileField>
              <FieldIcon>
                <FaUser />
              </FieldIcon>
              <FieldContent>
                <FieldLabel>Full Name</FieldLabel>
                <FieldValue>{profile?.name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'Not provided'}</FieldValue>
              </FieldContent>
            </ProfileField>
            
            <ProfileField>
              <FieldIcon>
                <FaEnvelope />
              </FieldIcon>
              <FieldContent>
                <FieldLabel>Email</FieldLabel>
                <FieldValue>{profile?.email || user.email}</FieldValue>
              </FieldContent>
            </ProfileField>
            
            <ProfileField>
              <FieldIcon>
                <FaPhone />
              </FieldIcon>
              <FieldContent>
                <FieldLabel>Phone Number</FieldLabel>
                <FieldValue>{profile?.phone || 'Not provided'}</FieldValue>
              </FieldContent>
            </ProfileField>
            
            <ProfileField>
              <FieldIcon>
                <FaMapMarkerAlt />
              </FieldIcon>
              <FieldContent>
                <FieldLabel>Default Address</FieldLabel>
                <FieldValue>{profile?.address || 'Not provided'}</FieldValue>
              </FieldContent>
            </ProfileField>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>Account</CardHeader>
          <CardContent>
            <MenuOption onClick={() => navigate('/orders')}>
              <OptionIcon>
                <FaHistory />
              </OptionIcon>
              <OptionText>Order History</OptionText>
            </MenuOption>
            
            <MenuOption onClick={() => navigate('/payment-methods')}>
              <OptionIcon>
                <FaCreditCard />
              </OptionIcon>
              <OptionText>Payment Methods</OptionText>
            </MenuOption>
            
            <MenuOption onClick={() => navigate('/notifications')}>
              <OptionIcon>
                <FaBell />
              </OptionIcon>
              <OptionText>Notifications</OptionText>
            </MenuOption>
            
            <MenuOption onClick={() => navigate('/settings')}>
              <OptionIcon>
                <FaCog />
              </OptionIcon>
              <OptionText>Settings</OptionText>
            </MenuOption>
          </CardContent>
        </Card>
        
        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </LogoutButton>
      </ProfileSection>
    </PageContainer>
  );
};

export default Profile;
