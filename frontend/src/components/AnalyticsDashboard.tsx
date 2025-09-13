import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaClock, 
  FaTrophy, 
  FaDownload,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { enhancedAnalyticsService } from '../services/enhancedApi';
import { toast } from 'react-toastify';

interface AnalyticsData {
  salesAnalytics: {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    completion_rate: number;
  };
  popularItems: Array<{
    menu_item_id: string;
    menu_item_name: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
  }>;
  peakHours: Array<{
    hour_of_day: number;
    order_count: number;
    total_revenue: number;
  }>;
  statusDistribution: Record<string, number>;
}

const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 2px solid #667eea;
  background: ${(props: { $active: boolean }) => props.$active ? '#667eea' : 'white'};
  color: ${(props: { $active: boolean }) => props.$active ? 'white' : '#667eea'};
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props: { $active: boolean }) => props.$active ? '#5a6fd8' : '#f0f2ff'};
  }
`;

const ExportButton = styled.button`
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: #218838;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const MetricCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MetricInfo = styled.div`
  flex: 1;
`;

const MetricLabel = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.h3`
  color: #2c3e50;
  font-size: 2rem;
  margin: 0 0 5px 0;
  font-weight: 700;
`;

const MetricChange = styled.div<{ $positive: boolean }>`
  color: ${(props: { $positive: boolean }) => props.$positive ? '#28a745' : '#dc3545'};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
`;

const MetricIcon = styled.div<{ $color: string }>`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: ${(props: { $color: string }) => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
`;

const ChartCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const ChartTitle = styled.h3`
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PopularItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PopularItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const ItemStats = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const ItemRevenue = styled.div`
  font-weight: 600;
  color: #28a745;
  text-align: right;
`;

const PeakHoursChart = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
  margin-top: 15px;
`;

const HourBar = styled.div<{ $height: number; $isActive: boolean }>`
  background: ${(props: { $height: number; $isActive: boolean }) => props.$isActive ? '#667eea' : '#e9ecef'};
  height: ${(props: { $height: number; $isActive: boolean }) => Math.max(props.$height, 10)}px;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #5a6fd8;
  }
`;

const HourLabel = styled.div`
  font-size: 0.7rem;
  text-align: center;
  margin-top: 5px;
  color: #666;
`;

const StatusChart = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
`;

const StatusItem = styled.div<{ $color: string }>`
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background: ${(props: { $color: string }) => props.$color}20;
  border: 2px solid ${(props: { $color: string }) => props.$color};
`;

const StatusCount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const StatusLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-transform: capitalize;
`;

const AnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [salesResult, popularResult, peakResult, statusResult] = await Promise.all([
        enhancedAnalyticsService.getSalesAnalytics(period),
        enhancedAnalyticsService.getPopularItems(5, period),
        enhancedAnalyticsService.getPeakHours(period),
        enhancedAnalyticsService.getStatusDistribution(period)
      ]);

      if (salesResult.success && popularResult.success && peakResult.success && statusResult.success) {
        setAnalytics({
          salesAnalytics: salesResult.data,
          popularItems: popularResult.data || [],
          peakHours: peakResult.data || [],
          statusDistribution: statusResult.data
        });
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const data = {
      period,
      generated_at: new Date().toISOString(),
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ffc107',
      accepted: '#17a2b8',
      preparing: '#fd7e14',
      ready: '#28a745',
      completed: '#6f42c1',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const maxPeakHour = Math.max(...analytics.peakHours.map(h => h.order_count));

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FaChartBar size={24} color="#667eea" />
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Analytics Dashboard</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <PeriodSelector>
            <FaCalendarAlt color="#666" />
            {(['day', 'week', 'month'] as const).map(p => (
              <PeriodButton
                key={p}
                $active={period === p}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </PeriodButton>
            ))}
          </PeriodSelector>
          
          <ExportButton onClick={exportAnalytics}>
            <FaDownload />
            Export Data
          </ExportButton>
        </div>
      </AnalyticsHeader>

      <MetricsGrid>
        <MetricCard>
          <MetricInfo>
            <MetricLabel>Total Orders</MetricLabel>
            <MetricValue>{analytics.salesAnalytics.total_orders}</MetricValue>
            <MetricChange $positive={true}>
              <FaArrowUp /> +12% vs last {period}
            </MetricChange>
          </MetricInfo>
          <MetricIcon $color="#667eea">
            <FaChartBar />
          </MetricIcon>
        </MetricCard>

        <MetricCard>
          <MetricInfo>
            <MetricLabel>Total Revenue</MetricLabel>
            <MetricValue>₹{analytics.salesAnalytics.total_revenue.toFixed(2)}</MetricValue>
            <MetricChange $positive={true}>
              <FaArrowUp /> +8% vs last {period}
            </MetricChange>
          </MetricInfo>
          <MetricIcon $color="#28a745">
            <FaChartLine />
          </MetricIcon>
        </MetricCard>

        <MetricCard>
          <MetricInfo>
            <MetricLabel>Avg Order Value</MetricLabel>
            <MetricValue>₹{analytics.salesAnalytics.average_order_value.toFixed(2)}</MetricValue>
            <MetricChange $positive={false}>
              <FaArrowDown /> -3% vs last {period}
            </MetricChange>
          </MetricInfo>
          <MetricIcon $color="#ffc107">
            <FaChartPie />
          </MetricIcon>
        </MetricCard>

        <MetricCard>
          <MetricInfo>
            <MetricLabel>Completion Rate</MetricLabel>
            <MetricValue>{analytics.salesAnalytics.completion_rate.toFixed(1)}%</MetricValue>
            <MetricChange $positive={true}>
              <FaArrowUp /> +5% vs last {period}
            </MetricChange>
          </MetricInfo>
          <MetricIcon $color="#17a2b8">
            <FaTrophy />
          </MetricIcon>
        </MetricCard>
      </MetricsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>
            <FaTrophy />
            Popular Items
          </ChartTitle>
          <PopularItemsList>
            {analytics.popularItems.map((item, index) => (
              <PopularItem key={item.menu_item_id}>
                <ItemInfo>
                  <ItemName>#{index + 1} {item.menu_item_name}</ItemName>
                  <ItemStats>{item.total_quantity} orders • {item.order_count} customers</ItemStats>
                </ItemInfo>
                <ItemRevenue>₹{item.total_revenue.toFixed(2)}</ItemRevenue>
              </PopularItem>
            ))}
          </PopularItemsList>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <FaClock />
            Peak Hours
          </ChartTitle>
          <PeakHoursChart>
            {Array.from({ length: 24 }, (_, hour) => {
              const hourData = analytics.peakHours.find(h => h.hour_of_day === hour);
              const orderCount = hourData?.order_count || 0;
              const height = maxPeakHour > 0 ? (orderCount / maxPeakHour) * 100 : 0;
              
              return (
                <div key={hour}>
                  <HourBar 
                    $height={height} 
                    $isActive={orderCount > 0}
                    title={`${hour}:00 - ${orderCount} orders`}
                  />
                  <HourLabel>{hour}</HourLabel>
                </div>
              );
            })}
          </PeakHoursChart>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <FaChartPie />
            Order Status Distribution
          </ChartTitle>
          <StatusChart>
            {Object.entries(analytics.statusDistribution).map(([status, count]) => (
              <StatusItem key={status} $color={getStatusColor(status)}>
                <StatusCount>{count}</StatusCount>
                <StatusLabel>{status}</StatusLabel>
              </StatusItem>
            ))}
          </StatusChart>
        </ChartCard>
      </ChartsGrid>
    </AnalyticsContainer>
  );
};

export default AnalyticsDashboard;
