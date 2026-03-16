import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin, Empty } from 'antd';
import { 
  AlertOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined,
  StopOutlined 
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  
  const [stats, setStats] = useState({
    total: 0,
    true_positive: 0,
    false_positive: 0,
    suspicious: 0,
    invalid: 0,
  });
  
  const [trendData, setTrendData] = useState({
    dates: [],
    true_positive: [],
    false_positive: [],
    suspicious: [],
    invalid: [],
  });
  
  const [categoryData, setCategoryData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  const fetchDashboardStats = async (timeRange) => {
    const response = await fetch(`/api/v1/dashboard/overview?time_range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`API调用失败 (${response.status})`);
    }
    return await response.json();
  };

  const fetchDashboardTrend = async (timeRange) => {
    const response = await fetch(`/api/v1/dashboard/trend?time_range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`API调用失败 (${response.status})`);
    }
    return await response.json();
  };

  const fetchDashboardCategory = async (timeRange) => {
    const response = await fetch(`/api/v1/dashboard/detail?time_range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`API调用失败 (${response.status})`);
    }
    return await response.json();
  };

  const fetchDashboardSource = async (timeRange) => {
    const response = await fetch(`/api/v1/dashboard/efficiency?time_range=${timeRange}`);
    if (!response.ok) {
      throw new Error(`API调用失败 (${response.status})`);
    }
    return await response.json();
  };

  const loadData = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // 计算日期范围天数
      const startDate = dateRange?.[0];
      const endDate = dateRange?.[1];
      const days = endDate && startDate ? endDate.diff(startDate, 'day') : 30;
      const timeRange = `${days}days`;

      // 分别处理每个API调用，确保一个失败不影响其他
      try {
        const statsResult = await fetchDashboardStats(timeRange);
        setStats({
          total: statsResult.total_alerts || 0,
          true_positive: statsResult.true_positive_count || 0,
          false_positive: statsResult.false_positive_count || 0,
          suspicious: statsResult.suspicious_count || 0,
          invalid: statsResult.invalid_count || 0,
        });
      } catch (error) {
        console.error('加载统计数据失败:', error);
        // 保持现有数据不变
      }

      try {
        const trendResult = await fetchDashboardTrend(timeRange);
        if (Array.isArray(trendResult)) {
          const dates = trendResult.map(item => item.date);
          // 趋势数据只有总计数，我们使用它作为所有类型的数据源
          const counts = trendResult.map(item => item.count || 0);

          setTrendData({
            dates,
            true_positive: counts,
            false_positive: counts,
            suspicious: counts,
            invalid: counts,
          });
        }
      } catch (error) {
        console.error('加载趋势数据失败:', error);
        // 保持现有数据不变
      }

      try {
        const categoryResult = await fetchDashboardCategory(timeRange);
        if (categoryResult.result_type_distribution && Array.isArray(categoryResult.result_type_distribution)) {
          setCategoryData(categoryResult.result_type_distribution.map(item => ({
            name: item.name,
            value: item.value,
          })));
        }
      } catch (error) {
        console.error('加载分类数据失败:', error);
        // 保持现有数据不变
      }

      try {
        const sourceResult = await fetchDashboardSource(timeRange);
        if (sourceResult.alert_source_distribution && Array.isArray(sourceResult.alert_source_distribution)) {
          setSourceData(sourceResult.alert_source_distribution.map(item => ({
            name: item.name,
            value: item.value,
          })));
        }
      } catch (error) {
        console.error('加载来源数据失败:', error);
        // 保持现有数据不变
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['真实攻击', '误报', '可疑告警', '无效告警'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.dates,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '真实攻击',
        type: 'line',
        smooth: true,
        data: trendData.true_positive,
        itemStyle: { color: '#ef4444' },
        areaStyle: { color: 'rgba(239, 68, 68, 0.1)' },
      },
      {
        name: '误报',
        type: 'line',
        smooth: true,
        data: trendData.false_positive,
        itemStyle: { color: '#10b981' },
        areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
      },
      {
        name: '可疑告警',
        type: 'line',
        smooth: true,
        data: trendData.suspicious,
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' },
      },
      {
        name: '无效告警',
        type: 'line',
        smooth: true,
        data: trendData.invalid,
        itemStyle: { color: '#64748b' },
        areaStyle: { color: 'rgba(100, 116, 139, 0.1)' },
      },
    ],
  };

  const categoryOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '告警分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: categoryData,
      },
    ],
  };

  const sourceOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '告警来源',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: sourceData,
      },
    ],
  };

  return (
    <div>
      <Card
        title="数据看板"
        className="page-card"
        headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
        extra={
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 280 }}
          />
        }
      >
        <Spin spinning={loading}>
          <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="告警总数"
                  value={stats.total}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="真实攻击"
                  value={stats.true_positive}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#ef4444' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="误报"
                  value={stats.false_positive}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#10b981' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="可疑告警"
                  value={stats.suspicious}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#f59e0b' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="告警趋势" bordered={false}>
                {trendData.dates.length > 0 ? (
                  <ReactECharts option={trendOption} style={{ height: '400px' }} />
                ) : (
                  <Empty description="暂无数据" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="告警分类" bordered={false}>
                {categoryData.length > 0 ? (
                  <ReactECharts option={categoryOption} style={{ height: '400px' }} />
                ) : (
                  <Empty description="暂无数据" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '1rem' }}>
            <Col xs={24} lg={12}>
              <Card title="告警来源" bordered={false}>
                {sourceData.length > 0 ? (
                  <ReactECharts option={sourceOption} style={{ height: '350px' }} />
                ) : (
                  <Empty description="暂无数据" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                )}
              </Card>
            </Col>
          </Row>
        </Spin>
      </Card>
    </div>
  );
};

export default Dashboard;
