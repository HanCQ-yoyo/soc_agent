import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Space, Spin, message } from 'antd';
import { ThunderboltOutlined, SendOutlined } from '@ant-design/icons';

const AlertAnalysis = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisTime, setAnalysisTime] = useState(null);
  const resultRef = useRef(null);

  // 示例数据
  const exampleData = `ALERT-20260114-001: SQL Injection Detected
Source IP: 198.51.100.78
Target IP: 172.16.0.89
Time: 2026-01-14T14:30:22Z
Request: POST /api/user/login
Body: username=admin' OR 1=1 --&password=123456
WAF Rule: WAF-SQL-003`;

  useEffect(() => {
    // 填充示例数据
    form.setFieldsValue({ alertData: exampleData });
  }, []);

  // 保存告警来源到localStorage
  const saveSource = (source) => {
    if (!source || source.trim() === '') return;
    
    try {
      const saved = localStorage.getItem('alertSources');
      const sources = saved ? JSON.parse(saved) : ['WAF', 'IDS', 'SIEM', 'EDR', '其他'];
      
      if (!sources.includes(source)) {
        sources.push(source);
        localStorage.setItem('alertSources', JSON.stringify(sources));
      }
    } catch (error) {
      console.error('Error saving source:', error);
    }
  };

  // 调用告警分析API
  const callAnalyzeAPI = async (data) => {
    const response = await fetch('/api/v1/alert/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
  };

  // 调用异步告警分析API
  const callAsyncAnalyzeAPI = async (data) => {
    const response = await fetch('/api/v1/alert/analyze/async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    if (loading) return;
    
    const startTime = Date.now();
    
    try {
      setLoading(true);
      
      const formData = {
        alert_data: values.alertData.trim(),
        source: values.source.trim(),
      };
      
      // 保存告警来源
      saveSource(formData.source);
      
      // 调用API
      const result = await callAnalyzeAPI(formData);
      
      // 计算分析耗时
      const endTime = Date.now();
      const time = ((endTime - startTime) / 1000).toFixed(1);
      
      setResult(result);
      setAnalysisTime(time);
      
      // 滚动到结果
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('分析失败:', error);
      message.error('分析失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理提交任务
  const handleSubmitTask = async () => {
    const values = form.getFieldsValue();
    
    if (!values.source || !values.source.trim()) {
      message.error('请选择告警来源');
      return;
    }
    
    if (!values.alertData || !values.alertData.trim()) {
      message.error('请输入告警数据');
      return;
    }
    
    if (taskLoading) return;
    
    try {
      setTaskLoading(true);
      
      const formData = {
        alert_data: values.alertData.trim(),
        source: values.source.trim(),
      };
      
      // 保存告警来源
      saveSource(formData.source);
      
      // 调用异步API
      const result = await callAsyncAnalyzeAPI(formData);
      
      // 显示任务提交结果
      setResult({
        ...result,
        isTask: true,
        message: result.message || '任务提交成功，正在分析中...',
      });
      
      // 滚动到结果
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('提交任务失败:', error);
      message.error('提交任务失败: ' + error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // 获取结果类型样式
  const getResultTypeStyle = (type) => {
    const styles = {
      true_positive: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid #ef4444',
      },
      false_positive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        border: '1px solid #10b981',
      },
      suspicious: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        border: '1px solid #f59e0b',
      },
      invalid: {
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        color: '#64748b',
        border: '1px solid #64748b',
      },
    };
    return styles[type] || styles.invalid;
  };

  // 获取结果类型标签
  const getResultTypeLabel = (type) => {
    const labels = {
      true_positive: '真实攻击',
      false_positive: '误报',
      suspicious: '可疑告警',
      invalid: '无效告警',
    };
    return labels[type] || type;
  };

  // 获取结果类型图标
  const getResultTypeIcon = (type) => {
    const icons = {
      true_positive: '🔴',
      false_positive: '🟢',
      suspicious: '🟡',
      invalid: '⚪',
    };
    return icons[type] || '⚪';
  };

  return (
    <div className="two-column-layout">
      {/* 左侧输入区域 */}
      <Card
        title="告警数据输入"
        className="page-card"
        headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="告警来源"
            name="source"
            rules={[{ required: true, message: '请选择告警来源' }]}
          >
            <Input
              placeholder="请输入或选择告警来源"
              list="sourceList"
              onBlur={(e) => saveSource(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveSource(e.target.value);
                }
              }}
            />
          </Form.Item>
          
          <datalist id="sourceList">
            <option value="WAF" />
            <option value="IDS" />
            <option value="SIEM" />
            <option value="EDR" />
            <option value="其他" />
          </datalist>

          <Form.Item
            label="原始告警数据"
            name="alertData"
            rules={[{ required: true, message: '请输入告警数据' }]}
          >
            <Input.TextArea
              placeholder="请输入告警数据..."
              rows={12}
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={loading}
                htmlType="submit"
                style={{ flex: 1, backgroundColor: '#3b82f6' }}
              >
                开始分析
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={taskLoading}
                onClick={handleSubmitTask}
                style={{ flex: 1, backgroundColor: '#3b82f6' }}
              >
                提交任务
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 右侧结果展示区域 */}
      <Card
        title="分析结果"
        className="page-card"
        headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <div ref={resultRef}>
          {!result ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>请在左侧输入告警数据，点击开始分析按钮获取研判结果</p>
            </div>
          ) : result.isTask ? (
            // 任务提交结果
            <div className="result-card" style={{ borderColor: '#3b82f6' }}>
              <div className="result-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    className="result-type"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid #3b82f6',
                    }}
                  >
                    <span>⏳</span>
                    <span>{result.status || 'Pending'}</span>
                  </div>
                </div>
                {result.analysis_id && (
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 'normal',
                    color: '#fff',
                    backgroundColor: '#666',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                  }}>
                    分析ID: {result.analysis_id}
                  </span>
                )}
              </div>
              <div className="result-desc">{result.message}</div>
              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">提示</span>
                  <span className="detail-value">任务已提交，系统正在后台分析。分析完成后，可在告警运营页面查看结果。</span>
                </div>
              </div>
            </div>
          ) : (
            // 分析结果
            <>
              <div className="result-card">
                <div className="result-header">
                  <div
                    className="result-type"
                    style={getResultTypeStyle(result.analysis_result_type)}
                  >
                    <span>{getResultTypeIcon(result.analysis_result_type)}</span>
                    <span>{getResultTypeLabel(result.analysis_result_type)}</span>
                  </div>
                  <span className="result-confidence">
                    置信度: {Math.round((result.analysis_confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="result-desc">{result.analysis_result_desc}</div>
                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">分析ID</span>
                    <span className="detail-value">{result.analysis_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">分析耗时</span>
                    <span className="detail-value">{analysisTime}秒</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">告警来源</span>
                    <span className="detail-value">{result.alert_source}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">告警类别</span>
                    <span className="detail-value">{result.alert_category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">严重程度</span>
                    <span className="detail-value">{result.alert_severity}</span>
                  </div>
                </div>
              </div>

              {/* 详细分析 */}
              {result.analysis_deep_detail && (
                <div className="result-card">
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.75rem' }}>
                    详细分析
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {result.analysis_deep_detail}
                  </div>
                </div>
              )}

              {/* 处置建议 */}
              {result.analysis_disposal_suggestion && (
                <div className="result-card">
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.75rem' }}>
                    处置建议
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {result.analysis_disposal_suggestion}
                  </div>
                </div>
              )}

              {/* 相关IOCs */}
              {result.analysis_related_iocs && result.analysis_related_iocs.length > 0 && (
                <div className="result-card">
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.75rem' }}>
                    相关IOCs
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.analysis_related_iocs.map((ioc, index) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {ioc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AlertAnalysis;
