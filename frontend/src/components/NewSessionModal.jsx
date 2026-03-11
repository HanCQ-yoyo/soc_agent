import React, { useState } from 'react';
import { Modal, Form, Input, Button, Divider, Typography, Space, Card, Tag } from 'antd';
import { PlusOutlined, RobotOutlined, AlertOutlined, CheckCircleOutlined, BulbOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

const NewSessionModal = ({ visible, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onCreate(values.title, values.alertData);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={640}
      centered
      style={{ borderRadius: 16, maxWidth: '90%' }}
      bodyStyle={{ padding: 0 }}
      wrapClassName="new-session-modal"
    >
      <div style={{ 
        padding: '24px 32px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textAlign: 'center',
        borderRadius: '16px 16px 0 0'
      }}>
        <div style={{ 
          width: 60,
          height: 60,
          borderRadius: '50%', 
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <RobotOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <Title level={4} style={{ margin: 0, marginBottom: 6, color: '#fff' }}>新建会话</Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>创建一个新的对话会话，开始与SOC Agent交流</Text>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ title: `对话 ${new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` }}
        >
          <Form.Item
            name="title"
            label={
              <Space>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>会话标题</span>
                <Text type="danger">*</Text>
              </Space>
            }
            rules={[{ required: true, message: '请输入会话标题' }]}
          >
            <Input 
              placeholder="请输入会话标题" 
              maxLength={50}
              showCount
              size="large"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="alertData"
            label={
              <Space>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>需要分析的告警数据</span>
                <Text type="danger">*</Text>
              </Space>
            }
            rules={[{ required: true, message: '请输入告警数据' }]}
          >
            <TextArea
              placeholder="请输入需要分析的告警数据（支持JSON格式）"
              rows={6}
              maxLength={2000}
              showCount
              style={{ borderRadius: 8, fontFamily: 'monospace' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button 
              onClick={onCancel} 
              size="large"
              style={{ 
                flex: 1,
                borderRadius: 8,
                height: 44,
                fontSize: 15,
                fontWeight: 600
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              loading={loading}
              size="large"
              style={{ 
                flex: 1,
                borderRadius: 8,
                height: 44,
                fontSize: 15,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              创建会话
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default NewSessionModal;
