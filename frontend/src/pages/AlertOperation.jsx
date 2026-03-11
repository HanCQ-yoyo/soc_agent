import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Drawer, Modal, message, Input, Select, DatePicker, Row, Col } from 'antd';
import { EyeOutlined, RobotOutlined, MessageOutlined, DownloadOutlined, SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, ExclamationOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AlertOperation = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    resultType: '',
    severity: '',
    dateRange: null,
  });
  
  // 抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [aiDrawerVisible, setAiDrawerVisible] = useState(false);
  const [feedbackDrawerVisible, setFeedbackDrawerVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  
  // AI助手状态
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // 反馈状态
  const [feedbackForm, setFeedbackForm] = useState({
    evaluation: null,
    correctedResult: null,
    feedbackReason: '',
    coreFeatures: [],
    currentFeature: '',
  });

  // 获取告警列表
  const fetchAlerts = async (page = 1, pageSize = 10, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', pageSize);
      
      if (filterParams.keyword) params.append('keyword', filterParams.keyword);
      if (filterParams.resultType) params.append('result_type', filterParams.resultType);
      if (filterParams.severity) params.append('severity', filterParams.severity);
      if (filterParams.dateRange) {
        params.append('start_date', filterParams.dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', filterParams.dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/v1/alert/analysis/result/list?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const result = await response.json();
      
      if (result.data) {
        setAlerts(result.data);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.total || result.data.length,
        });
      }
    } catch (error) {
      console.error('获取告警列表失败:', error);
      message.error('获取告警列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchAlerts();
  }, []);

  // 处理表格分页
  const handleTableChange = (pagination) => {
    fetchAlerts(pagination.current, pagination.pageSize, filters);
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return '无';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  // 获取结果类型标签
  const getResultTypeTag = (type) => {
    const typeMap = {
      true_positive: { color: 'error', text: '真实攻击' },
      false_positive: { color: 'success', text: '误报' },
      suspicious: { color: 'warning', text: '可疑' },
      invalid: { color: 'default', text: '无效' },
    };
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  // 获取严重程度标签
  const getSeverityTag = (severity) => {
    const severityMap = {
      critical: { color: 'error', text: '严重' },
      high: { color: 'orange', text: '高危' },
      medium: { color: 'warning', text: '中危' },
      low: { color: 'success', text: '低危' },
      info: { color: 'default', text: '信息' },
    };
    const severityInfo = severityMap[severity] || { color: 'default', text: severity };
    return <Tag color={severityInfo.color}>{severityInfo.text}</Tag>;
  };

  // 查看详情
  const viewDetail = (alert) => {
    setCurrentAlert(alert);
    setDetailDrawerVisible(true);
  };

  // 打开AI助手
  const openAiAssistant = (alert) => {
    setCurrentAlert(alert);
    setAiMessages([
      { role: 'assistant', content: '您好，我是AI助手。我可以帮您分析这条告警，请问有什么问题？' }
    ]);
    setAiDrawerVisible(true);
  };

  // 发送AI消息
  const sendAiMessage = async () => {
    if (!aiInput.trim() || !currentAlert) return;
    
    const userMessage = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      const response = await fetch('/api/v1/chat/alert/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: currentAlert.detail?.analysis_id,
          question: userMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      const result = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: result.data?.answer || result.answer || '抱歉，我无法回答这个问题。' }]);
    } catch (error) {
      message.error('发送消息失败: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 打开反馈
  const openFeedback = (alert) => {
    setCurrentAlert(alert);
    setFeedbackForm({
      evaluation: null,
      correctedResult: null,
      feedbackReason: '',
      coreFeatures: [],
      currentFeature: '',
    });
    setFeedbackDrawerVisible(true);
  };

  // 提交反馈
  const submitFeedback = async () => {
    if (!currentAlert || !feedbackForm.evaluation) {
      message.warning('请评估研判结果');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/alert/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: currentAlert.detail?.analysis_id,
          evaluation: feedbackForm.evaluation,
          corrected_result: feedbackForm.correctedResult,
          feedback_reason: feedbackForm.feedbackReason,
          core_features: feedbackForm.coreFeatures,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      message.success('反馈提交成功');
      setFeedbackDrawerVisible(false);
      // 重置表单
      setFeedbackForm({
        evaluation: null,
        correctedResult: null,
        feedbackReason: '',
        coreFeatures: [],
        currentFeature: '',
      });
    } catch (error) {
      message.error('提交反馈失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理核心特征输入
  const handleFeatureInput = (e) => {
    setFeedbackForm({ ...feedbackForm, currentFeature: e.target.value });
  };

  // 处理核心特征确认
  const handleFeatureConfirm = (e) => {
    if (e.key === 'Enter' && feedbackForm.currentFeature.trim()) {
      setFeedbackForm({
        ...feedbackForm,
        coreFeatures: [...feedbackForm.coreFeatures, feedbackForm.currentFeature.trim()],
        currentFeature: '',
      });
    }
  };

  // 移除核心特征
  const removeFeature = (index) => {
    const newFeatures = [...feedbackForm.coreFeatures];
    newFeatures.splice(index, 1);
    setFeedbackForm({ ...feedbackForm, coreFeatures: newFeatures });
  };

  // 导出报告 - 暂不支持
  const exportReport = async (alert) => {
    message.info('导出功能开发中...');
  };

  // 处理筛选
  const handleFilter = () => {
    fetchAlerts(1, pagination.pageSize, filters);
  };

  // 重置筛选
  const resetFilter = () => {
    const newFilters = {
      keyword: '',
      resultType: '',
      severity: '',
      dateRange: null,
    };
    setFilters(newFilters);
    fetchAlerts(1, pagination.pageSize, newFilters);
  };

  // 表格列定义
  // 计算持续时间
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '无';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 1000;
    if (duration < 60) {
      return `${duration.toFixed(1)}秒`;
    } else {
      return `${(duration / 60).toFixed(1)}分钟`;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '告警名称',
      dataIndex: 'detail',
      key: 'alert_name',
      width: 250,
      ellipsis: true,
      render: (text, record) => <span style={{ fontSize: '14px' }}>{record.detail?.alert_name || '无'}</span>,
    },
    {
      title: '告警来源',
      dataIndex: 'detail',
      key: 'source',
      width: 120,
      render: (text, record) => (
        <Tag color="blue" style={{ fontSize: '13px' }}>{record.detail?.alert_source || '未知'}</Tag>
      ),
    },
    {
      title: '告警资产ID',
      dataIndex: 'detail',
      key: 'alert_asset_id',
      width: 200,
      render: (text, record) => (
        <div style={{ fontSize: '14px' }}>
          {record.detail?.alert_asset_id || '未知'}
          {record.detail?.alert_asset_type && (
            <Tag size="small" style={{ marginLeft: 4, background: '#dcfce7', color: '#16a34a', border: 'none', fontSize: '12px' }}>{record.detail.alert_asset_type}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '网络信息',
      dataIndex: 'detail',
      key: 'network_info',
      width: 400,
      render: (text, record) => {
        const sourceIp = record.detail?.alert_source_ip || '未知';
        const destIp = record.detail?.alert_destination_ip || '未知';
        const destPort = record.detail?.alert_destination_port || '8080';
        const direction = record.detail?.alert_direction || '未知';
        
        const directionColor = {
          '外到内': 'blue',
          '内到外': 'purple',
          '内到内': 'green',
          '外到外': 'gray'
        };
        
        return (
          <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{sourceIp} - {destIp}:{destPort}</span>
            <Tag size="small" color={directionColor[direction] || 'default'} style={{ fontSize: '13px' }}>{direction}</Tag>
          </div>
        );
      },
    },
    {
      title: '研判结果',
      dataIndex: 'detail',
      key: 'analysis_result_type',
      width: 200,
      render: (text, record) => {
        const tag = getResultTypeTag(record.detail?.analysis_result_type);
        return (
          <Space style={{ fontSize: '14px' }}>
            {React.cloneElement(tag, { style: { fontSize: '14px' } })}
            <Tag size="small" style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', fontSize: '13px' }}>
              {Math.round((record.detail?.analysis_confidence || 0) * 100)}%
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '告警发生时间',
      dataIndex: 'detail',
      key: 'alert_event_timestamp',
      width: 200,
      render: (text, record) => {
        const timestamp = record.detail?.alert_event_timestamp || record.timestamp;
        return <span style={{ fontSize: '14px' }}>{timestamp ? formatTime(timestamp) : '无'}</span>;
      },
    },
    {
      title: '研判时间',
      dataIndex: 'detail',
      key: 'analysis_end_time',
      width: 250,
      render: (text, record) => {
        const endTime = record.detail?.analysis_end_time;
        const startTime = record.detail?.analysis_start_time;
        const duration = calculateDuration(startTime, endTime);
        return (
          <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{endTime ? formatTime(endTime) : '无'}</span>
            {duration !== '无' && (
              <Tag size="small" style={{ background: '#fef3c7', color: '#d97706', border: 'none', fontSize: '13px' }}>
                {duration}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space style={{ fontSize: '14px' }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record)}
            style={{ fontSize: '14px' }}
            tooltip="详情"
          />
          <Button
            type="link"
            icon={<RobotOutlined />}
            onClick={() => openAiAssistant(record)}
            style={{ fontSize: '14px' }}
            tooltip="AI助手"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选栏 */}
      <Card style={{ marginBottom: '1rem' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索告警名称"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="研判结果"
              value={filters.resultType}
              onChange={(value) => setFilters({ ...filters, resultType: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="true_positive">真实攻击</Option>
              <Option value="false_positive">误报</Option>
              <Option value="suspicious">可疑</Option>
              <Option value="invalid">无效</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="严重程度"
              value={filters.severity}
              onChange={(value) => setFilters({ ...filters, severity: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="critical">严重</Option>
              <Option value="high">高危</Option>
              <Option value="medium">中危</Option>
              <Option value="low">低危</Option>
              <Option value="info">信息</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={resetFilter}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 告警列表 */}
      <Card
        title="告警运营"
        className="page-card"
        headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          onChange={handleTableChange}
          scroll={{ x: 1800, y: 'calc(100vh - 500px)' }}
          style={{ fontSize: '14px' }}
          rowStyle={{ padding: '8px 0' }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="告警详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={1050}
      >
        {currentAlert && currentAlert.detail && (
          <div>
            <Card title="基本信息" style={{ marginBottom: '1rem' }}>
              <p><strong>分析ID:</strong> {currentAlert.detail.analysis_id}</p>
              <p><strong>告警名称:</strong> {currentAlert.detail.alert_name}</p>
              <p><strong>告警来源:</strong> {currentAlert.detail.alert_source}</p>
              <p><strong>告警类别:</strong> {currentAlert.detail.alert_category}</p>
              <p><strong>严重程度:</strong> {getSeverityTag(currentAlert.detail.alert_severity)}</p>
              <p><strong>研判时间:</strong> {formatTime(currentAlert.detail.analysis_end_time)}</p>
              <p><strong>告警发生时间:</strong> {formatTime(currentAlert.detail.alert_event_timestamp)}</p>
              <p><strong>告警UUID:</strong> {currentAlert.detail.alert_uuid}</p>
            </Card>
            
            <Card title="网络信息" style={{ marginBottom: '1rem' }}>
              <p><strong>源IP:</strong> {currentAlert.detail.alert_source_ip}</p>
              <p><strong>目标IP:</strong> {currentAlert.detail.alert_destination_ip}</p>
              <p><strong>目标端口:</strong> {currentAlert.detail.alert_destination_port}</p>
              <p><strong>流量方向:</strong> {currentAlert.detail.alert_direction}</p>
              <p><strong>资产类型:</strong> {currentAlert.detail.alert_asset_type}</p>
            </Card>
            
            <Card title="研判结果" style={{ marginBottom: '1rem' }}>
              <p><strong>结果类型:</strong> {getResultTypeTag(currentAlert.detail.analysis_result_type)}</p>
              <p><strong>置信度:</strong> {Math.round((currentAlert.detail.analysis_confidence || 0) * 100)}%</p>
              <p><strong>结果描述:</strong> {currentAlert.detail.analysis_result_desc}</p>
            </Card>
            
            <Card title="详细分析" style={{ marginBottom: '1rem' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {currentAlert.detail.analysis_deep_detail}
              </pre>
            </Card>
            
            <Card title="处置建议" style={{ marginBottom: '1rem' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {currentAlert.detail.analysis_disposal_suggestion}
              </pre>
            </Card>
            
            <Card title="相关IOCs" style={{ marginBottom: '1rem' }}>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {currentAlert.detail.analysis_related_iocs && currentAlert.detail.analysis_related_iocs.map((ioc, index) => (
                  <li key={index} style={{ marginBottom: 4, padding: 4, background: '#f8fafc', borderRadius: 4 }}>
                    {ioc}
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card title="告警描述" style={{ marginBottom: '1rem' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {currentAlert.detail.alert_description}
              </pre>
            </Card>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <Button 
                type="primary" 
                icon={<MessageOutlined />}
                onClick={() => openFeedback(currentAlert)}
              >
                评估反馈
              </Button>
              <Button 
                type="default" 
                icon={<DownloadOutlined />}
                onClick={() => exportReport(currentAlert)}
              >
                导出报告
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* AI助手抽屉 */}
      <Drawer
        title="AI助手"
        placement="right"
        onClose={() => setAiDrawerVisible(false)}
        open={aiDrawerVisible}
        width={750}
      >
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
            {aiMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: msg.role === 'user' ? '#3b82f6' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1e293b',
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    maxWidth: '80%',
                    textAlign: 'left',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Tag color="processing">AI思考中...</Tag>
              </div>
            )}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onPressEnter={sendAiMessage}
              placeholder="输入您的问题..."
              disabled={aiLoading}
            />
            <Button type="primary" onClick={sendAiMessage} loading={aiLoading}>
              发送
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 反馈抽屉 */}
      <Drawer
        title="反馈与评价"
        placement="right"
        onClose={() => setFeedbackDrawerVisible(false)}
        open={feedbackDrawerVisible}
        width={600}
      >
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 500, marginRight: 8 }}>评估研判结果</label>
              <Tag size="small" color="blue" style={{ cursor: 'help' }}>i</Tag>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                type={feedbackForm.evaluation === 'correct' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, evaluation: 'correct' })}
                style={{ minWidth: 120 }}
              >
                <CheckOutlined /> 研判正确
              </Button>
              <Button
                type={feedbackForm.evaluation === 'false_positive' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, evaluation: 'false_positive' })}
                style={{ minWidth: 120 }}
              >
                <CloseOutlined /> 误判
              </Button>
              <Button
                type={feedbackForm.evaluation === '漏判' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, evaluation: '漏判' })}
                style={{ minWidth: 120 }}
              >
                <ExclamationOutlined /> 漏判
              </Button>
              <Button
                type={feedbackForm.evaluation === 'inaccurate' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, evaluation: 'inaccurate' })}
                style={{ minWidth: 120 }}
              >
                <SearchOutlined /> 研判不精准
              </Button>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 500, marginRight: 8 }}>修正后研判结果</label>
              <Tag size="small" color="blue" style={{ cursor: 'help' }}>i</Tag>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                type={feedbackForm.correctedResult === 'true_attack' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, correctedResult: 'true_attack' })}
                style={{ minWidth: 100 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div>
                  真实攻击
                </div>
              </Button>
              <Button
                type={feedbackForm.correctedResult === 'false_alert' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, correctedResult: 'false_alert' })}
                style={{ minWidth: 100 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
                  误报
                </div>
              </Button>
              <Button
                type={feedbackForm.correctedResult === 'suspicious' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, correctedResult: 'suspicious' })}
                style={{ minWidth: 100 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
                  可疑告警
                </div>
              </Button>
              <Button
                type={feedbackForm.correctedResult === 'invalid' ? 'primary' : 'default'}
                onClick={() => setFeedbackForm({ ...feedbackForm, correctedResult: 'invalid' })}
                style={{ minWidth: 100 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#94a3b8' }}></div>
                  无效告警
                </div>
              </Button>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              反馈原因（可选）
            </label>
            <Input.TextArea
              value={feedbackForm.feedbackReason}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackReason: e.target.value })}
              rows={4}
              placeholder="请输入您的反馈原因..."
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              核心特征标注（可选）
            </label>
            <Input
              value={feedbackForm.currentFeature}
              onChange={handleFeatureInput}
              onKeyPress={handleFeatureConfirm}
              placeholder="输入后按Enter确认，再次输入下一个"
            />
            {feedbackForm.coreFeatures.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {feedbackForm.coreFeatures.map((feature, index) => (
                  <Tag key={index} closable onClose={() => removeFeature(index)}>
                    {feature}
                  </Tag>
                ))}
              </div>
            )}
          </div>
          
          <Button type="primary" onClick={submitFeedback} style={{ width: '100%', height: 40, fontSize: 14 }}>
            评估反馈
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default AlertOperation;
