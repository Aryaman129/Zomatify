import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaRupeeSign, FaClock, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { vendorPaymentService } from '../services/api';
import { useVendorAuth } from '../contexts/VendorAuthContext';
import { format } from 'date-fns';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const PaymentList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const PaymentCard = styled(motion.div)`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
  }
`;

const PaymentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const PaymentInfo = styled.div`
  flex: 1;
`;

const OrderId = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const PaymentDate = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const PaymentStatus = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  background: ${(props: { status: string }) => {
    switch (props.status) {
      case 'completed': return '#d4edda';
      case 'processing': return '#cce5ff';
      case 'pending': return '#fff3cd';
      case 'failed': return '#f8d7da';
      default: return '#e9ecef';
    }
  }};
  
  color: ${(props: { status: string }) => {
    switch (props.status) {
      case 'completed': return '#155724';
      case 'processing': return '#004085';
      case 'pending': return '#856404';
      case 'failed': return '#721c24';
      default: return '#495057';
    }
  }};
`;

const PaymentDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const DetailItem = styled.div`
  text-align: center;
`;

const DetailLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 5px;
  text-transform: uppercase;
  font-weight: 600;
`;

const DetailValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
`;

const UpiInfo = styled.div`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
`;

interface PaymentDistribution {
  id: string;
  order_id: string;
  amount: number;
  platform_fee: number;
  vendor_amount: number;
  transfer_status: string;
  created_at: string;
  transferred_at?: string;
  vendor_upi_id: string;
  orders?: {
    id: string;
    total_price: number;
    created_at: string;
    delivery_address?: any;
  };
}

const VendorPaymentDashboard: React.FC = () => {
  const { vendor } = useVendorAuth();
  const [payments, setPayments] = useState<PaymentDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingAmount: 0,
    completedPayments: 0,
    todayEarnings: 0
  });

  useEffect(() => {
    if (vendor) {
      loadPaymentData();
    }
  }, [vendor]);

  const loadPaymentData = async () => {
    if (!vendor) return;
    
    setLoading(true);
    try {
      const result = await vendorPaymentService.getVendorPaymentDistributions(vendor.id);
      
      if (result.success) {
        const paymentData = result.data || [];
        setPayments(paymentData);
        
        // Calculate stats
        const totalEarnings = paymentData
          .filter(p => p.transfer_status === 'completed')
          .reduce((sum, p) => sum + p.vendor_amount, 0);
        
        const pendingAmount = paymentData
          .filter(p => p.transfer_status === 'pending' || p.transfer_status === 'processing')
          .reduce((sum, p) => sum + p.vendor_amount, 0);
        
        const completedPayments = paymentData.filter(p => p.transfer_status === 'completed').length;
        
        const todayEarnings = paymentData
          .filter(p => {
            const paymentDate = new Date(p.created_at).toDateString();
            const today = new Date().toDateString();
            return paymentDate === today && p.transfer_status === 'completed';
          })
          .reduce((sum, p) => sum + p.vendor_amount, 0);
        
        setStats({
          totalEarnings,
          pendingAmount,
          completedPayments,
          todayEarnings
        });
      } else {
        toast.error('Failed to load payment data');
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'processing': return <FaClock />;
      case 'pending': return <FaClock />;
      case 'failed': return <FaExclamationTriangle />;
      default: return <FaClock />;
    }
  };

  if (!vendor) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>💳 Payment Dashboard</Title>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatIcon><FaRupeeSign /></StatIcon>
          <StatValue>₹{stats.totalEarnings.toFixed(2)}</StatValue>
          <StatLabel>Total Earnings</StatLabel>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatIcon><FaClock /></StatIcon>
          <StatValue>₹{stats.pendingAmount.toFixed(2)}</StatValue>
          <StatLabel>Pending Amount</StatLabel>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatIcon><FaCheckCircle /></StatIcon>
          <StatValue>{stats.completedPayments}</StatValue>
          <StatLabel>Completed Payments</StatLabel>
        </StatCard>
        
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatIcon><FaRupeeSign /></StatIcon>
          <StatValue>₹{stats.todayEarnings.toFixed(2)}</StatValue>
          <StatLabel>Today's Earnings</StatLabel>
        </StatCard>
      </StatsGrid>

      {vendor.upi_id && (
        <UpiInfo>
          <strong>💰 Payment UPI ID:</strong> {vendor.upi_id}
          <br />
          <small>All payments are automatically transferred to this UPI ID</small>
        </UpiInfo>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Recent Payments</h3>
        
        {loading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <p>Loading payment data...</p>
          </EmptyState>
        ) : payments.length === 0 ? (
          <EmptyState>
            <EmptyIcon>💳</EmptyIcon>
            <p>No payments yet. Payments will appear here when customers place orders.</p>
          </EmptyState>
        ) : (
          <PaymentList>
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentHeader>
                  <PaymentInfo>
                    <OrderId>Order #{String(payment.order_id).slice(-8)}</OrderId>
                    <PaymentDate>
                      {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                    </PaymentDate>
                  </PaymentInfo>
                  
                  <PaymentStatus status={payment.transfer_status}>
                    {getStatusIcon(payment.transfer_status)}
                    {payment.transfer_status}
                  </PaymentStatus>
                </PaymentHeader>

                <PaymentDetails>
                  <DetailItem>
                    <DetailLabel>Order Amount</DetailLabel>
                    <DetailValue>₹{payment.amount.toFixed(2)}</DetailValue>
                  </DetailItem>
                  
                  <DetailItem>
                    <DetailLabel>Platform Fee</DetailLabel>
                    <DetailValue>₹{payment.platform_fee.toFixed(2)}</DetailValue>
                  </DetailItem>
                  
                  <DetailItem>
                    <DetailLabel>Your Earnings</DetailLabel>
                    <DetailValue style={{ color: '#28a745' }}>₹{payment.vendor_amount.toFixed(2)}</DetailValue>
                  </DetailItem>
                  
                  {payment.transferred_at && (
                    <DetailItem>
                      <DetailLabel>Transferred At</DetailLabel>
                      <DetailValue style={{ fontSize: '0.9rem' }}>
                        {format(new Date(payment.transferred_at), 'MMM dd, HH:mm')}
                      </DetailValue>
                    </DetailItem>
                  )}
                </PaymentDetails>
              </PaymentCard>
            ))}
          </PaymentList>
        )}
      </div>
    </Container>
  );
};

export default VendorPaymentDashboard;
