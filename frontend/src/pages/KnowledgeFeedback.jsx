import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Drawer, Modal, message, Input, Select, Row, Col, Form, Tabs } from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const KnowledgeFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    feedbackType: '',
  });
  
  // 抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  
  // 知识检索状态
  const [searchParams, setSearchParams] = useState({
    queryExpression: '',
    searchType: 'keyword',
    keyword: '',
    topK: 10,
    similarity: 0.5,
    metricType: 'COSINE',
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 元数据模态框
  const [metadataModalVisible, setMetadataModalVisible] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState(null);

  // 获取反馈列表
  const fetchFeedbacks = async (page = 1, pageSize = 10, filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', pageSize);
      
      if (filterParams.keyword) params.append('keyword', filterParams.keyword);
      if (filterParams.feedbackType) params.append('feedback_type', filterParams.feedbackType);

      const response = await fetch(`/api/v1/alert/feedback/list?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const result = await response.json();
      
      if (result.items) {
        setFeedbacks(result.items || []);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.total || (result.items?.length || 0),
        });
      }
    } catch (error) {
      console.error('获取反馈列表失败:', error);
      message.error('获取反馈列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // 处理表格分页
  const handleTableChange = (pagination) => {
    fetchFeedbacks(pagination.current, pagination.pageSize, filters);
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return '无';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  // 获取反馈类型标签
  const getFeedbackTypeTag = (type) => {
    const typeMap = {
      misjudgment: { color: 'error', text: '误判' },
      correct: { color: 'success', text: '正确' },
      suggestion: { color: 'processing', text: '建议' },
      imprecision: { color: 'warning', text: '研判不精确' },
      omission: { color: 'warning', text: '漏判' },
      accurate: { color: 'success', text: '研判正确' },
    };
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  // 获取正确结果标签
  const getCorrectResultTag = (result) => {
    const resultMap = {
      true_positive: { color: 'error', text: '真实攻击' },
      false_positive: { color: 'success', text: '误报' },
      suspicious: { color: 'warning', text: '可疑' },
      invalid: { color: 'default', text: '无效' },
    };
    const resultInfo = resultMap[result] || { color: 'default', text: result };
    return <Tag color={resultInfo.color}>{resultInfo.text}</Tag>;
  };

  // 查看详情
  const viewDetail = (feedback) => {
    setCurrentFeedback(feedback);
    setDetailDrawerVisible(true);
  };

  // 删除反馈
  const deleteFeedback = async (feedbackId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条反馈吗？此操作不可恢复。',
      onOk: async () => {
        try {
          const response = await fetch(`/api/v1/alert/feedback/${feedbackId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败 (${response.status})`);
          }
          
          message.success('删除成功');
          fetchFeedbacks(pagination.current, pagination.pageSize, filters);
        } catch (error) {
          message.error('删除失败: ' + error.message);
        }
      },
    });
  };

  // 知识检索
  const searchKnowledge = async () => {
    try {
      setSearchLoading(true);
      const response = await fetch('/api/v1/vector/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          page_size: 10,
          query_expr: searchParams.queryExpression,
          similar_keyword: searchParams.keyword,
          top_k: searchParams.topK,
          score_threshold: searchParams.similarity,
          metric_type: searchParams.metricType,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      const result = await response.json();
      // 检查返回数据结构
      if (Array.isArray(result)) {
        setSearchResults(result);
      } else if (result.data) {
        // 如果data是数组，直接使用；否则尝试获取results属性
        setSearchResults(Array.isArray(result.data) ? result.data : []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      message.error('检索失败: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // 查看元数据
  const viewMetadata = (result) => {
    setCurrentMetadata(result);
    setMetadataModalVisible(true);
  };

  // 处理筛选
  const handleFilter = () => {
    fetchFeedbacks(1, pagination.pageSize, filters);
  };

  // 重置筛选
  const resetFilter = () => {
    const newFilters = {
      keyword: '',
      feedbackType: '',
    };
    setFilters(newFilters);
    fetchFeedbacks(1, pagination.pageSize, newFilters);
  };

  // 重置检索参数
  const resetSearchParams = () => {
    setSearchParams({
      queryExpression: '',
      searchType: 'keyword',
      keyword: '',
      topK: 10,
      similarity: 0.5,
      metricType: 'COSINE',
    });
    setSearchResults([]);
  };

  // 反馈表格列定义
  const feedbackColumns = [
    {
      title: '反馈时间',
      dataIndex: 'feedback_time',
      key: 'feedback_time',
      width: 160,
      render: (time) => formatTime(time),
    },
    {
      title: '分析ID',
      dataIndex: 'analysis_uid',
      key: 'analysis_uid',
      width: 180,
      ellipsis: true,
    },
    {
      title: '反馈类型',
      dataIndex: 'feedback_type',
      key: 'feedback_type',
      width: 120,
      render: (type) => getFeedbackTypeTag(type),
    },
    {
      title: '正确结果',
      dataIndex: 'correct_result',
      key: 'correct_result',
      width: 100,
      render: (result) => getCorrectResultTag(result),
    },
    {
      title: '核心特征tags',
      dataIndex: 'core_feature_tags',
      key: 'core_feature_tags',
      width: 180,
      render: (tags) => {
        if (!tags || tags.length === 0) {
          return '无';
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {tags.map((tag, index) => (
              <Tag key={index} size="small" color="blue">{tag}</Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: '反馈原因',
      dataIndex: 'feedback_reason',
      key: 'feedback_reason',
      flex: 1,
      minWidth: 200,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteFeedback(record.feedback_uid)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 检索结果表格列定义
  const searchResultColumns = [
    {
      title: '创建时间',
      dataIndex: 'create_timestamp',
      key: 'create_timestamp',
      width: 150,
      render: (time) => formatTime(time),
    },
    {
      title: 'ANALYSIS ID',
      dataIndex: 'analysis_id',
      key: 'analysis_id',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'MILVUS_VECTOR_ID',
      dataIndex: 'milvus_vector_id',
      key: 'milvus_vector_id',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'CONTENT',
      dataIndex: 'content',
      key: 'content',
      flex: 1,
      ellipsis: true,
    },
    {
      title: 'SCORE',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => (
        <Tag color={score > 0.7 ? 'green' : score > 0.5 ? 'orange' : 'red'}>
          {((score || 0) * 100).toFixed(2)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<InfoCircleOutlined />}
          onClick={() => viewMetadata(record)}
        >
          查看元数据
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Tabs 
        defaultActiveKey="feedback" 
        style={{ marginBottom: '1rem' }} 
        tabBarStyle={{ color: '#ffffff' }}
        items={[
          {
            key: 'feedback',
            label: '反馈管理',
            children: (
              <>
                {/* 反馈列表筛选栏 */}
                <Card style={{ marginBottom: '1rem' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={8}>
                      <Input
                        placeholder="搜索反馈内容"
                        value={filters.keyword}
                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        prefix={<SearchOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Select
                        placeholder="反馈类型"
                        value={filters.feedbackType}
                        onChange={(value) => setFilters({ ...filters, feedbackType: value })}
                        style={{ width: '100%' }}
                        allowClear
                      >
                        <Option value="misjudgment">误判</Option>
                        <Option value="correct">正确</Option>
                        <Option value="suggestion">建议</Option>
                        <Option value="imprecision">研判不精确</Option>
                        <Option value="omission">漏判</Option>
                        <Option value="accurate">研判正确</Option>
                      </Select>
                    </Col>
                    <Col span={10}>
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

                {/* 反馈列表 */}
                <Card
                  className="table-container"
                  styles={{ header: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }}
                >
                  <Table
                    columns={feedbackColumns}
                    dataSource={feedbacks}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ y: 'calc(100vh - 400px)' }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'knowledge',
            label: '知识检索',
            children: (
              <Card className="page-card" styles={{ header: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }}>
                {/* 检索表单 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>标签查询表达式</div>
                      <Input.TextArea
                        placeholder="analysis_id == 'alert_analysis_78dde326c3e7421b8a88a7b12479770e' OR content like '%恶意软件检测%'"
                        value={searchParams.queryExpression}
                        onChange={(e) => setSearchParams({ ...searchParams, queryExpression: e.target.value })}
                        rows={2}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>向量检索类型</div>
                      <Select
                        value={searchParams.searchType}
                        onChange={(value) => setSearchParams({ ...searchParams, searchType: value })}
                        style={{ width: '100%' }}
                      >
                        <Option value="keyword">关键词</Option>
                        <Option value="semantic">语义</Option>
                      </Select>
                    </Col>
                    <Col span={16}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>检索关键词</div>
                      <Input
                        placeholder="输入检索关键词"
                        value={searchParams.keyword}
                        onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>TopK</div>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={searchParams.topK}
                        onChange={(e) => setSearchParams({ ...searchParams, topK: parseInt(e.target.value) || 10 })}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>相似度阈值</div>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={searchParams.similarity}
                        onChange={(e) => setSearchParams({ ...searchParams, similarity: parseFloat(e.target.value) || 0.5 })}
                      />
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>度量类型</div>
                      <Select
                        value={searchParams.metricType}
                        onChange={(value) => setSearchParams({ ...searchParams, metricType: value })}
                        style={{ width: '100%' }}
                      >
                        <Option value="COSINE">COSINE</Option>
                        <Option value="EUCLIDEAN">EUCLIDEAN</Option>
                        <Option value="IP">IP</Option>
                      </Select>
                    </Col>
                    <Col span={24} style={{ marginTop: '0.5rem' }}>
                      <Space>
                        <Button
                          type="primary"
                          icon={<SearchOutlined />}
                          onClick={searchKnowledge}
                          loading={searchLoading}
                        >
                          开始检索
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={resetSearchParams}>
                          重置
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>

                {/* 检索结果 */}
                <Table
                  columns={searchResultColumns}
                  dataSource={searchResults}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1200, y: 'calc(100vh - 600px)' }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* 详情抽屉 */}
      <Drawer
        title="反馈详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        size={600}
      >
        {currentFeedback && (
          <div>
            <Card title="基本信息" style={{ marginBottom: '1rem' }}>
              <p><strong>反馈ID:</strong> {currentFeedback.feedback_uid}</p>
              <p><strong>分析ID:</strong> {currentFeedback.analysis_uid}</p>
              <p><strong>反馈类型:</strong> {getFeedbackTypeTag(currentFeedback.feedback_type)}</p>
              <p><strong>正确结果:</strong> {getCorrectResultTag(currentFeedback.correct_result)}</p>
              <p><strong>反馈用户:</strong> {currentFeedback.feedback_user || '无'}</p>
              <p><strong>用户角色:</strong> {currentFeedback.user_role || '无'}</p>
              <p><strong>反馈时间:</strong> {formatTime(currentFeedback.feedback_time)}</p>
              <p><strong>状态:</strong> {currentFeedback.status || '无'}</p>
            </Card>
            
            <Card title="反馈原因">
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {currentFeedback.feedback_reason || '无'}
              </pre>
            </Card>
            
            {currentFeedback.core_feature_tags && currentFeedback.core_feature_tags.length > 0 && (
              <Card title="核心特征标签" style={{ marginTop: '1rem' }}>
                <Space wrap>
                  {currentFeedback.core_feature_tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* 元数据模态框 */}
      <Modal
        title="元数据详情"
        open={metadataModalVisible}
        onCancel={() => setMetadataModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMetadataModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {currentMetadata && (
          <div>
            <Card title="基本信息" style={{ marginBottom: '1rem' }}>
              <p><strong>分析ID:</strong> {currentMetadata.analysis_id}</p>
              <p><strong>向量ID:</strong> {currentMetadata.milvus_vector_id}</p>
              <p><strong>相似度:</strong> {((currentMetadata.score || 0) * 100).toFixed(2)}%</p>
              <p><strong>创建时间:</strong> {formatTime(currentMetadata.create_timestamp)}</p>
            </Card>
            <Card title="内容">
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {currentMetadata.content || '无'}
              </pre>
            </Card>
            {currentMetadata.metadata && (
              <Card title="元数据" style={{ marginTop: '1rem' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {JSON.stringify(currentMetadata.metadata, null, 2)}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KnowledgeFeedback;
