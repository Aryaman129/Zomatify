import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaToggleOn, FaToggleOff, FaClock, FaUsers, FaBell, FaChartLine, FaBoxes, FaUtensils, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useVendorAuth } from '../contexts/VendorAuthContext';
import supabase from '../services/supabaseClient';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
`;

const Header = styled.div`
  margin-bottom: 25px;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
  font-size: 0.95rem;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ControlCard = styled(motion.div)`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
  }
`;

const ControlHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const ControlIcon = styled.div`
  color: #667eea;
  font-size: 1.5rem;
`;

const ControlTitle = styled.h3`
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
`;

const ControlDescription = styled.p`
  color: #666;
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 15px 0;
`;

const ToggleLabel = styled.span`
  color: #2c3e50;
  font-weight: 600;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  color: ${(props: { $active: boolean }) => props.$active ? '#28a745' : '#6c757d'};
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const InputGroup = styled.div`
  margin: 15px 0;
`;

const InputLabel = styled.label`
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'busy' | 'offline' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;

  background: ${(props: { $status: 'online' | 'busy' | 'offline' }) => {
    switch (props.$status) {
      case 'online': return '#d4edda';
      case 'busy': return '#fff3cd';
      case 'offline': return '#f8d7da';
    }
  }};

  color: ${(props: { $status: 'online' | 'busy' | 'offline' }) => {
    switch (props.$status) {
      case 'online': return '#155724';
      case 'busy': return '#856404';
      case 'offline': return '#721c24';
    }
  }};
`;

const StatusDot = styled.div<{ $status: 'online' | 'busy' | 'offline' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props: { $status: 'online' | 'busy' | 'offline' }) => {
    switch (props.$status) {
      case 'online': return '#28a745';
      case 'busy': return '#ffc107';
      case 'offline': return '#dc3545';
    }
  }};
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const StatLabel = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const StatValue = styled.span`
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.1rem;
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
  margin-top: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

interface VendorSettings {
  is_accepting_orders: boolean;
  max_concurrent_orders: number;
  is_busy_mode: boolean;
  default_preparation_time: number;
}

interface OrderStats {
  activeOrders: number;
  todayOrders: number;
  avgPreparationTime: number;
}

const VendorOperationalControls: React.FC = () => {
  const { vendor } = useVendorAuth();
  const [settings, setSettings] = useState<VendorSettings>({
    is_accepting_orders: true,
    max_concurrent_orders: 10,
    is_busy_mode: false,
    default_preparation_time: 20
  });
  const [orderStats, setOrderStats] = useState<OrderStats>({
    activeOrders: 0,
    todayOrders: 0,
    avgPreparationTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      loadSettings();
      loadOrderStats();
    }
  }, [vendor]);

  const loadSettings = async () => {
    if (!vendor) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_settings')
        .select('*')
        .eq('vendor_id', vendor.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          is_accepting_orders: data.is_accepting_orders,
          max_concurrent_orders: data.max_concurrent_orders,
          is_busy_mode: data.is_busy_mode,
          default_preparation_time: data.default_preparation_time
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    if (!vendor) return;
    
    try {
      // Get active orders count
      const { data: activeOrdersData, error: activeError } = await supabase
        .from('orders')
        .select('id')
        .eq('vendor_id', vendor.id)
        .in('status', ['pending', 'confirmed', 'preparing']);

      if (activeError) throw activeError;

      // Get today's orders count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrdersData, error: todayError } = await supabase
        .from('orders')
        .select('id')
        .eq('vendor_id', vendor.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (todayError) throw todayError;

      setOrderStats({
        activeOrders: activeOrdersData?.length || 0,
        todayOrders: todayOrdersData?.length || 0,
        avgPreparationTime: settings.default_preparation_time
      });
    } catch (error: any) {
      console.error('Error loading order stats:', error);
    }
  };

  const saveSettings = async () => {
    if (!vendor) return;

    setSaving(true);
    try {
      // First try to update existing settings
      const { error: updateError } = await supabase
        .from('vendor_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendor.id);

      if (updateError) {
        // If update fails, try to insert new record
        const { error: insertError } = await supabase
          .from('vendor_settings')
          .insert({
            vendor_id: vendor.id,
            ...settings,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleAcceptingOrders = async () => {
    const newValue = !settings.is_accepting_orders;
    setSettings(prev => ({ ...prev, is_accepting_orders: newValue }));

    try {
      const { error } = await supabase
        .from('vendor_settings')
        .update({
          is_accepting_orders: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendor?.id);

      if (error) throw error;

      toast.success(newValue ? 'Now accepting orders!' : 'Stopped accepting orders');
    } catch (error: any) {
      console.error('Error updating order acceptance:', error);
      setSettings(prev => ({ ...prev, is_accepting_orders: !newValue }));
      toast.error('Failed to update order acceptance');
    }
  };

  const toggleBusyMode = async () => {
    const newValue = !settings.is_busy_mode;
    setSettings(prev => ({ ...prev, is_busy_mode: newValue }));

    try {
      const { error } = await supabase
        .from('vendor_settings')
        .update({
          is_busy_mode: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendor?.id);

      if (error) throw error;

      toast.success(newValue ? 'Busy mode activated' : 'Busy mode deactivated');
    } catch (error: any) {
      console.error('Error updating busy mode:', error);
      setSettings(prev => ({ ...prev, is_busy_mode: !newValue }));
      toast.error('Failed to update busy mode');
    }
  };

  const getOperationalStatus = (): 'online' | 'busy' | 'offline' => {
    if (!settings.is_accepting_orders) return 'offline';
    if (settings.is_busy_mode || orderStats.activeOrders >= settings.max_concurrent_orders) return 'busy';
    return 'online';
  };

  if (!vendor) {
    return <div>Please log in to access operational controls.</div>;
  }

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading operational controls...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>⚙️ Operational Controls</Title>
        <Subtitle>Manage your restaurant's operational settings and capacity</Subtitle>
      </Header>

      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <StatusIndicator $status={getOperationalStatus()}>
          <StatusDot $status={getOperationalStatus()} />
          {getOperationalStatus() === 'online' && 'Online & Accepting Orders'}
          {getOperationalStatus() === 'busy' && 'Busy - Limited Capacity'}
          {getOperationalStatus() === 'offline' && 'Offline - Not Accepting Orders'}
        </StatusIndicator>
      </div>

      <ControlsGrid>
        <ControlCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ControlHeader>
            <ControlIcon><FaToggleOn /></ControlIcon>
            <ControlTitle>Order Acceptance</ControlTitle>
          </ControlHeader>
          <ControlDescription>
            Control whether your restaurant is accepting new orders. Turn off during breaks or when overwhelmed.
          </ControlDescription>
          
          <ToggleContainer>
            <ToggleLabel>Accept New Orders</ToggleLabel>
            <ToggleButton
              $active={settings.is_accepting_orders}
              onClick={toggleAcceptingOrders}
            >
              {settings.is_accepting_orders ? <FaToggleOn /> : <FaToggleOff />}
            </ToggleButton>
          </ToggleContainer>

          <StatsRow>
            <StatLabel>Current Status</StatLabel>
            <StatValue style={{ color: settings.is_accepting_orders ? '#28a745' : '#dc3545' }}>
              {settings.is_accepting_orders ? 'Accepting Orders' : 'Not Accepting'}
            </StatValue>
          </StatsRow>
        </ControlCard>

        <ControlCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ControlHeader>
            <ControlIcon><FaUsers /></ControlIcon>
            <ControlTitle>Capacity Management</ControlTitle>
          </ControlHeader>
          <ControlDescription>
            Set the maximum number of orders you can handle simultaneously to maintain quality.
          </ControlDescription>
          
          <InputGroup>
            <InputLabel>Maximum Concurrent Orders</InputLabel>
            <Input
              type="number"
              min="1"
              max="50"
              value={settings.max_concurrent_orders}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                ...prev,
                max_concurrent_orders: parseInt(e.target.value) || 10
              }))}
            />
          </InputGroup>

          <StatsRow>
            <StatLabel>Active Orders</StatLabel>
            <StatValue style={{ color: orderStats.activeOrders >= settings.max_concurrent_orders ? '#dc3545' : '#28a745' }}>
              {orderStats.activeOrders} / {settings.max_concurrent_orders}
            </StatValue>
          </StatsRow>

          <ToggleContainer>
            <ToggleLabel>Auto Busy Mode</ToggleLabel>
            <ToggleButton
              $active={settings.is_busy_mode}
              onClick={toggleBusyMode}
            >
              {settings.is_busy_mode ? <FaToggleOn /> : <FaToggleOff />}
            </ToggleButton>
          </ToggleContainer>
        </ControlCard>

        <ControlCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ControlHeader>
            <ControlIcon><FaClock /></ControlIcon>
            <ControlTitle>Preparation Time</ControlTitle>
          </ControlHeader>
          <ControlDescription>
            Adjust your default preparation time based on current workload and kitchen capacity.
          </ControlDescription>
          
          <InputGroup>
            <InputLabel>Default Preparation Time (minutes)</InputLabel>
            <Input
              type="number"
              min="5"
              max="120"
              value={settings.default_preparation_time}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                ...prev,
                default_preparation_time: parseInt(e.target.value) || 20
              }))}
            />
          </InputGroup>

          <StatsRow>
            <StatLabel>Current Setting</StatLabel>
            <StatValue>{settings.default_preparation_time} minutes</StatValue>
          </StatsRow>

          <StatsRow>
            <StatLabel>Today's Average</StatLabel>
            <StatValue>{orderStats.avgPreparationTime} minutes</StatValue>
          </StatsRow>
        </ControlCard>

        <ControlCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ControlHeader>
            <ControlIcon><FaChartLine /></ControlIcon>
            <ControlTitle>Today's Performance</ControlTitle>
          </ControlHeader>
          <ControlDescription>
            Monitor your restaurant's performance and order flow for today.
          </ControlDescription>
          
          <StatsRow>
            <StatLabel>Total Orders Today</StatLabel>
            <StatValue>{orderStats.todayOrders}</StatValue>
          </StatsRow>

          <StatsRow>
            <StatLabel>Active Orders</StatLabel>
            <StatValue style={{ color: orderStats.activeOrders > 0 ? '#667eea' : '#666' }}>
              {orderStats.activeOrders}
            </StatValue>
          </StatsRow>

          <StatsRow>
            <StatLabel>Capacity Utilization</StatLabel>
            <StatValue style={{ 
              color: (orderStats.activeOrders / settings.max_concurrent_orders) > 0.8 ? '#dc3545' : '#28a745' 
            }}>
              {Math.round((orderStats.activeOrders / settings.max_concurrent_orders) * 100)}%
            </StatValue>
          </StatsRow>

          <SaveButton onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Settings'}
          </SaveButton>
        </ControlCard>
      </ControlsGrid>
    </Container>
  );
};

export default VendorOperationalControls;
