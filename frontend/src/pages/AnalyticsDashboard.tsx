import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaChartBar, 
  FaChartLine, 
  FaUsers, 
  FaUtensils, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaClock, 
  FaExclamationTriangle,
  FaReceipt
} from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/api';
import { toast } from 'react-toastify';
import supabase from '../services/supabaseClient';
import { format } from 'date-fns';

const PageContainer = styled.div`
  padding-bottom: 80px;
`;

const ContentSection = styled.div`
  padding: 16px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #FF5A5F;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 12px;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardContent = styled.div`
  padding: 16px;
`;

const TimeFilter = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background-color: ${(props: { $active: boolean }) => props.$active ? '#FF5A5F' : 'white'};
  color: ${(props: { $active: boolean }) => props.$active ? 'white' : '#333'};
  border: 1px solid ${(props: { $active: boolean }) => props.$active ? '#FF5A5F' : '#ddd'};
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: ${(props: { $active: boolean }) => props.$active ? '#FF5A5F' : '#f5f5f5'};
  }
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  color: #333;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
`;

// Add new styled components for enhanced displays
const ProgressBar = styled.div`
  background-color: #f0f0f0;
  border-radius: 10px;
  height: 12px;
  margin-top: 6px;
  position: relative;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number; $color: string }>`
  position: absolute;
  height: 100%;
  width: ${(props: { $width: number; $color: string }) => `${props.$width}%`};
  background-color: ${(props: { $width: number; $color: string }) => props.$color};
  border-radius: 10px;
  transition: width 0.5s ease-in-out;
`;

const StatusLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendColor = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${(props: { $color: string }) => props.$color};
`;

const LegendLabel = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  popularItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  queueStatus?: {
    activeOrders: number;
    maxCapacity: number;
    capacityPercentage: number;
    isAcceptingOrders: boolean;
    nextInterval: string;
    ordersInLastHour: number;
    averageWaitTime: number;
  };
  orderStatusDistribution: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  hourlyOrderData: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Create timeframe filter based on selected range
        const now = new Date();
        let startDate = new Date();
        
        if (timeRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeRange === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
        }
        
        const startDateStr = startDate.toISOString();
        
        // Get total orders and revenue
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_price, status, created_at')
          .gte('created_at', startDateStr);
          
        if (ordersError) throw ordersError;
        
        // Get unique customers
        const { data: customers, error: customersError } = await supabase
          .from('orders')
          .select('user_id')
          .gte('created_at', startDateStr);
          
        if (customersError) throw customersError;
        
        // Get popular items from orders.items JSONB column
        const { data: ordersWithItems, error: itemsError } = await supabase
          .from('orders')
          .select('items')
          .gte('created_at', startDateStr)
          .not('items', 'is', null);
          
        if (itemsError) throw itemsError;
        
        // Process the popular items from orders.items JSONB
        const itemCounts: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
        
        ordersWithItems?.forEach((order: any) => {
          order.items?.forEach((item: any) => {
            const menuItemId = item.menu_item_id;
            const menuItemName = item.menu_item?.name || 'Unknown Item';
            const price = item.menu_item?.price || 0;
            const quantity = item.quantity || 0;
            
            if (itemCounts[menuItemId]) {
              itemCounts[menuItemId].quantity += quantity;
              itemCounts[menuItemId].revenue += price * quantity;
            } else {
              itemCounts[menuItemId] = {
                name: menuItemName,
                quantity: quantity,
                revenue: price * quantity
              };
            }
          });
        });
        
        const popularItems = Object.entries(itemCounts)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        
        // Get order status distribution
        const orderStatusDistribution = {
          pending: 0,
          preparing: 0,
          ready: 0,
          completed: 0,
          cancelled: 0
        };
        
        orders.forEach((order: any) => {
          if (orderStatusDistribution[order.status as keyof typeof orderStatusDistribution] !== undefined) {
            orderStatusDistribution[order.status as keyof typeof orderStatusDistribution]++;
          }
        });
        
        // Get hourly order data
        const hourlyOrderData: AnalyticsData['hourlyOrderData'] = [];
        
        // Initialize hours
        for (let hour = 0; hour < 24; hour++) {
          hourlyOrderData.push({
            hour,
            orders: 0,
            revenue: 0
          });
        }
        
        // Fill in the data from orders
        orders.forEach((order: any) => {
          const orderDate = new Date(order.created_at);
          const hour = orderDate.getHours();
          
          hourlyOrderData[hour].orders++;
          hourlyOrderData[hour].revenue += order.total_price;
        });
        
        // Calculate queue status metrics
        const { data: queueSettings, error: queueError } = await supabase
          .from('queue_settings')
          .select('*')
          .single();
          
        if (queueError) throw queueError;
        
        const { data: activeOrders, error: activeOrdersError } = await supabase
          .from('orders')
          .select('id')
          .in('status', ['pending', 'accepted', 'preparing']);
          
        if (activeOrdersError) throw activeOrdersError;
        
        // Get recent orders for the table
        const { data: recentOrdersData, error: recentOrdersError } = await supabase
          .from('orders')
          .select('id, total_price, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (recentOrdersError) throw recentOrdersError;
        
        const recentOrders = recentOrdersData.map((order: any) => ({
          id: order.id,
          date: order.created_at,
          amount: order.total_price,
          status: order.status
        }));
        
        // Calculate last hour orders
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        const ordersInLastHour = orders.filter((order: any) => 
          new Date(order.created_at) >= oneHourAgo
        ).length;
        
        // Set the analytics data
        setAnalyticsData({
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, order: any) => sum + order.total_price, 0),
          totalCustomers: new Set(customers.map((c: any) => c.user_id)).size,
          popularItems,
          recentOrders,
          queueStatus: {
          activeOrders: activeOrders.length,
            maxCapacity: queueSettings.max_active_orders || 50,
            capacityPercentage: (activeOrders.length / (queueSettings.max_active_orders || 50)) * 100,
          isAcceptingOrders: queueSettings.is_accepting_orders,
            nextInterval: queueSettings.next_interval_time,
            ordersInLastHour,
            averageWaitTime: 15 * Math.ceil(activeOrders.length / 3) // 15 min avg * orders/3 staff
          },
          orderStatusDistribution,
          hourlyOrderData
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeRange]);
  
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  
  // Get percentage for order status
  const getStatusPercentage = (status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    if (!analyticsData || analyticsData.totalOrders === 0) return 0;
    return (analyticsData.orderStatusDistribution[status] / analyticsData.totalOrders) * 100;
  };
  
  // Status colors for chart
  const statusColors = {
    pending: '#FFC107',
    preparing: '#2196F3',
    ready: '#4CAF50',
    completed: '#8BC34A',
    cancelled: '#F44336'
  };
  
  if (loading) {
    return (
      <LoadingContainer>
        Loading analytics data...
      </LoadingContainer>
    );
  }
  
  return (
    <PageContainer>
      <AppHeader title="Analytics Dashboard" />
      
      <ContentSection>
        {/* Time range filter */}
        <TimeFilter>
          <FilterButton 
            $active={timeRange === 'today'}
            onClick={() => handleTimeRangeChange('today')}
          >
            Today
          </FilterButton>
          <FilterButton 
            $active={timeRange === 'week'}
            onClick={() => handleTimeRangeChange('week')}
          >
            Last 7 Days
          </FilterButton>
          <FilterButton 
            $active={timeRange === 'month'}
            onClick={() => handleTimeRangeChange('month')}
          >
            Last 30 Days
          </FilterButton>
          <FilterButton 
            $active={timeRange === 'year'}
            onClick={() => handleTimeRangeChange('year')}
          >
            Last Year
          </FilterButton>
        </TimeFilter>
        
        {/* Summary Cards */}
        <DashboardGrid>
          <StatCard>
            <StatIcon>
              <FaReceipt />
            </StatIcon>
            <StatValue>{analyticsData?.totalOrders || 0}</StatValue>
            <StatLabel>Total Orders</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaMoneyBillWave />
            </StatIcon>
            <StatValue>{formatCurrency(analyticsData?.totalRevenue || 0)}</StatValue>
            <StatLabel>Revenue</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaUsers />
            </StatIcon>
            <StatValue>{analyticsData?.totalCustomers || 0}</StatValue>
            <StatLabel>Customers</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaClock />
            </StatIcon>
            <StatValue>{analyticsData?.queueStatus?.averageWaitTime || 0}m</StatValue>
            <StatLabel>Avg. Wait Time</StatLabel>
          </StatCard>
        </DashboardGrid>
        
        {/* Popular Items */}
        <Card>
          <CardHeader>
            <FaUtensils style={{ marginRight: '8px' }} />
            Most Popular Items
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Item</TableHeader>
                    <TableHeader>Quantity Sold</TableHeader>
                    <TableHeader>Revenue</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.popularItems?.length ? (
                    analyticsData.popularItems.map((item, index) => (
                    <tr key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.revenue)}</TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <TableCell colSpan={3} style={{ textAlign: 'center' }}>
                        No data available
                      </TableCell>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <FaChartBar style={{ marginRight: '8px' }} />
            Order Status Distribution
          </CardHeader>
          <CardContent>
            <div>
              {/* Pending */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pending</span>
                  <span>{analyticsData?.orderStatusDistribution.pending || 0} orders ({getStatusPercentage('pending').toFixed(1)}%)</span>
                </div>
                <ProgressBar>
                  <ProgressFill $width={getStatusPercentage('pending')} $color={statusColors.pending} />
                </ProgressBar>
              </div>
              
              {/* Preparing */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Preparing</span>
                  <span>{analyticsData?.orderStatusDistribution.preparing || 0} orders ({getStatusPercentage('preparing').toFixed(1)}%)</span>
                </div>
                <ProgressBar>
                  <ProgressFill $width={getStatusPercentage('preparing')} $color={statusColors.preparing} />
                </ProgressBar>
              </div>
              
              {/* Ready */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ready</span>
                  <span>{analyticsData?.orderStatusDistribution.ready || 0} orders ({getStatusPercentage('ready').toFixed(1)}%)</span>
                </div>
                <ProgressBar>
                  <ProgressFill $width={getStatusPercentage('ready')} $color={statusColors.ready} />
                </ProgressBar>
              </div>
              
              {/* Completed */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Completed</span>
                  <span>{analyticsData?.orderStatusDistribution.completed || 0} orders ({getStatusPercentage('completed').toFixed(1)}%)</span>
                </div>
                <ProgressBar>
                  <ProgressFill $width={getStatusPercentage('completed')} $color={statusColors.completed} />
                </ProgressBar>
              </div>
              
              {/* Cancelled */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cancelled</span>
                  <span>{analyticsData?.orderStatusDistribution.cancelled || 0} orders ({getStatusPercentage('cancelled').toFixed(1)}%)</span>
                </div>
                <ProgressBar>
                  <ProgressFill $width={getStatusPercentage('cancelled')} $color={statusColors.cancelled} />
                </ProgressBar>
              </div>
              
              <StatusLegend>
                {Object.entries(statusColors).map(([status, color]) => (
                  <LegendItem key={status}>
                    <LegendColor $color={color} />
                    <LegendLabel>{status.charAt(0).toUpperCase() + status.slice(1)}</LegendLabel>
                  </LegendItem>
                ))}
              </StatusLegend>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Orders Table */}
        <Card>
          <CardHeader>
            <FaReceipt style={{ marginRight: '8px' }} />
            Recent Orders
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHeader>Order ID</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.recentOrders?.length ? (
                    analyticsData.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <TableCell>#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>{format(new Date(order.date), 'MMM d, h:mm a')}</TableCell>
                        <TableCell>{formatCurrency(order.amount)}</TableCell>
                        <TableCell>
                          <OrderStatus $status={order.status}>{order.status}</OrderStatus>
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                        No recent orders
                      </TableCell>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </ContentSection>
    </PageContainer>
  );
};

// Add OrderStatus component
const OrderStatus = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  
  background-color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'pending': return '#FFF3CD';
      case 'accepted': return '#E1F5FE';
      case 'preparing': return '#E0F2F1';
      case 'ready': return '#E8F5E9';
      case 'completed': return '#F1F8E9';
      case 'cancelled': return '#FFEBEE';
      default: return '#EEEEEE';
    }
  }};
  
  color: ${({ $status }: { $status: string }) => {
    switch ($status) {
      case 'pending': return '#856404';
      case 'accepted': return '#0277BD';
      case 'preparing': return '#00695C';
      case 'ready': return '#2E7D32';
      case 'completed': return '#558B2F';
      case 'cancelled': return '#C62828';
      default: return '#616161';
    }
  }};
`;

export default AnalyticsDashboard;
