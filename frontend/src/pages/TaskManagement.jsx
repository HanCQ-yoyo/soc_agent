import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Drawer, message, Pagination, Tooltip } from 'antd';
import { EyeOutlined, ApartmentOutlined, CodeOutlined, AlertOutlined, CheckCircleOutlined, CloseCircleOutlined, AppstoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState('');
  const [drawerTitle, setDrawerTitle] = useState('');

  // 获取任务列表
  const fetchTasks = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/alert/analysis/task/list?page=${page}&page_size=${pageSize}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const result = await response.json();
      
      if (result.items) {
        setTasks(result.items);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.total || result.items.length,
        });
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error('获取任务列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取任务详情
  const fetchTaskDetail = async (analysisId) => {
    try {
      const response = await fetch(`/api/v1/alert/analysis/result/${analysisId}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取任务详情失败:', error);
      throw error;
    }
  };

  // 获取任务流程
  const fetchTaskWorkflow = async (analysisId) => {
    try {
      const response = await fetch(`/api/v1/alert/analysis/task/${analysisId}/workflow`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取任务流程失败:', error);
      throw error;
    }
  };

  // 初始加载
  useEffect(() => {
    fetchTasks();
  }, []);

  // 处理表格分页
  const handleTableChange = (pagination) => {
    fetchTasks(pagination.current, pagination.pageSize);
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return '无';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  // 计算持续时间
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '无';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 1000;
    if (duration < 60) {
      return `${duration.toFixed(1)}秒`;
    } else if (duration < 3600) {
      return `${(duration / 60).toFixed(1)}分钟`;
    } else {
      return `${(duration / 3600).toFixed(1)}小时`;
    }
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status, errorLog, errMessage) => {
    if (errorLog || status === 'failed') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag color="error">失败</Tag>
          {errMessage && (
            <Tooltip title={errMessage} placement="top">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '14px', cursor: 'help' }} />
            </Tooltip>
          )}
        </div>
      );
    }
    const statusMap = {
      success: { color: 'success', text: '成功' },
      processing: { color: 'processing', text: '处理中' },
      pending: { color: 'default', text: '待处理' },
      running: { color: 'processing', text: '运行中' },
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 查看原始告警
  const viewRawAlert = (rawAlert) => {
    setDrawerTitle('原始告警数据');
    setDrawerContent(rawAlert || '无数据');
    setDrawerVisible(true);
  };

  // 获取节点类型对应的颜色
  const getNodeTypeColor = (nodeType, component) => {
    const typeColors = {
      Lambda: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
      Workflow: { bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', text: '#fff' },
      default: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: '#fff' },
    };
    return typeColors[component] || typeColors.default;
  };

  // 获取节点类型对应的图标
  const getNodeTypeIcon = (component) => {
    const iconMap = {
      Lambda: <CodeOutlined />,
      Workflow: <AppstoreOutlined />,
      default: <CheckCircleOutlined />,
    };
    return iconMap[component] || iconMap.default;
  };

  // 查看任务流程
  const viewTaskWorkflow = async (analysisId) => {
    try {
      const data = await fetchTaskWorkflow(analysisId);
      setDrawerTitle('任务流程');
      setDrawerContent(
        <div style={{ maxHeight: '80vh', overflow: 'auto', padding: '0 20px' }}>
          {data.workflow_log && data.workflow_log.length > 0 ? (
            <div style={{ position: 'relative' }}>
              {/* 时间轴线 */}
              <div style={{
                position: 'absolute',
                left: 17,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }} />
              
              {data.workflow_log.map((step, index) => {
                const typeColors = getNodeTypeColor(step.node_type, step.component);
                const hasError = step.err_message && step.err_message !== '';
                
                return (
                  <div key={index} style={{
                    display: 'flex',
                    marginBottom: 32,
                    position: 'relative'
                  }}>
                    {/* 时间点 */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: hasError 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                        : typeColors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 1,
                      boxShadow: hasError 
                        ? '0 2px 8px rgba(239, 68, 68, 0.3)' 
                        : '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}>
                      <div style={{ color: typeColors.text, fontSize: 16 }}>
                        {hasError ? <CloseCircleOutlined /> : getNodeTypeIcon(step.component)}
                      </div>
                    </div>
                    
                    {/* 内容 */}
                    <div style={{
                      marginLeft: 16,
                      flex: 1,
                      background: '#f8fafc',
                      padding: 20,
                      borderRadius: 12,
                      border: hasError 
                        ? '1px solid #fee2e2' 
                        : '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: 16, 
                            fontWeight: 600, 
                            color: '#1e293b',
                            marginBottom: 4
                          }}>
                            {step.component || '未知组件'}
                          </h4>
                          {step.node_name && (
                            <div style={{ fontSize: 13, color: '#475569' }}>
                              节点: {step.node_name}
                            </div>
                          )}
                          {step.node_type && (
                            <div style={{ fontSize: 13, color: '#475569' }}>
                              类型: {step.node_type}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: 12, 
                            color: '#64748b',
                            display: 'block',
                            marginBottom: 4
                          }}>
                            {step.exec_time ? new Date(step.exec_time).toLocaleString('zh-CN') : '无时间信息'}
                          </span>
                          {hasError && (
                            <span style={{ 
                              fontSize: 12, 
                              color: '#dc2626',
                              fontWeight: 500
                            }}>
                              执行失败
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {step.input && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: '#64748b', 
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              marginRight: 6
                            }} />
                            输入
                          </div>
                          <pre style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.4,
                            background: '#e2e8f0',
                            padding: 12,
                            borderRadius: 8,
                            overflow: 'auto',
                            maxHeight: 120,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {step.output && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: '#64748b', 
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              marginRight: 6
                            }} />
                            输出
                          </div>
                          <pre style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.4,
                            background: '#e2e8f0',
                            padding: 12,
                            borderRadius: 8,
                            overflow: 'auto',
                            maxHeight: 120,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {hasError && (
                        <div>
                          <div style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: '#dc2626', 
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              marginRight: 6
                            }} />
                            错误信息
                          </div>
                          <pre style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.4,
                            background: '#fee2e2',
                            padding: 12,
                            borderRadius: 8,
                            overflow: 'auto',
                            maxHeight: 120,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {step.err_message}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>暂无任务流程数据</div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>该任务可能还在处理中</div>
            </div>
          )}
        </div>
      );
      setDrawerVisible(true);
    } catch (error) {
      message.error('获取任务流程失败: ' + error.message);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '告警分析ID',
      dataIndex: 'analysis_id',
      key: 'analysis_id',
      width: 250,
      ellipsis: true,
      render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
    },
    {
      title: '告警来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source) => (
        <Tag color="blue" style={{ fontSize: '13px' }}>{source || '未知'}</Tag>
      ),
    },
    {
      title: '研判开始时间',
      dataIndex: 'analysis_start_time',
      key: 'analysis_start_time',
      width: 200,
      render: (time) => <span style={{ fontSize: '14px' }}>{formatTime(time)}</span>,
    },
    {
      title: '研判结束时间',
      dataIndex: 'analysis_end_time',
      key: 'analysis_end_time',
      width: 250,
      render: (endTime, record) => {
        // 检查是否为1970-01-01 08:00:00
        const isEpochTime = endTime === '1970-01-01 08:00:00';
        if (!endTime || isEpochTime) {
          return <span style={{ fontSize: '14px' }}></span>;
        }
        const duration = calculateDuration(record.analysis_start_time, endTime);
        return (
          <div style={{ fontSize: '14px' }}>
            {formatTime(endTime)}
            {duration !== '无' && (
              <Tag size="small" style={{ marginLeft: 4, fontSize: '12px' }}>{duration}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '任务状态',
      dataIndex: 'disposal_status',
      key: 'disposal_status',
      width: 150,
      render: (status, record) => {
        const actualStatus = status || record.status;
        const errorLog = record.err_message || record.error_log;
        const errMessage = record.err_message || record.error_log;
        const statusElement = getTaskStatusTag(actualStatus, errorLog, errMessage);
        // 如果返回的是div（包含提示标识），直接返回
        if (statusElement.type === 'div') {
          return statusElement;
        }
        // 如果返回的是Tag，添加样式
        return React.cloneElement(statusElement, { style: { fontSize: '13px' } });
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space style={{ fontSize: '14px' }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewRawAlert(record.raw_alert || record.alert_data)}
            style={{ fontSize: '14px' }}
          >
            原始告警
          </Button>
          <Button
            type="link"
            icon={<ApartmentOutlined />}
            onClick={() => viewTaskWorkflow(record.analysis_id)}
            style={{ fontSize: '14px' }}
          >
            任务流程
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="任务管理"
        className="page-card"
        headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="analysis_id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          onChange={handleTableChange}
          scroll={{ x: 1500, y: 'calc(100vh - 400px)' }}
          style={{ fontSize: '14px' }}
          rowStyle={{ padding: '8px 0' }}
        />
      </Card>

      {/* 抽屉组件 */}
      <Drawer
        title={drawerTitle}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={900}
      >
        {typeof drawerContent === 'string' ? (
          <pre style={{
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: 1.5,
          }}>
            {drawerContent}
          </pre>
        ) : (
          drawerContent
        )}
      </Drawer>
    </div>
  );
};

export default TaskManagement;
