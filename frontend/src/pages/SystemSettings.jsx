import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Drawer, Modal, message, Input, Form, Tabs, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { TextArea } = Input;

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('prompts');
  
  // 提示词管理状态
  const [prompts, setPrompts] = useState([]);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptDrawerVisible, setPromptDrawerVisible] = useState(false);
  const [promptHistoryVisible, setPromptHistoryVisible] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);
  const [promptForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  // 获取提示词列表
  const fetchPrompts = async () => {
    try {
      setPromptLoading(true);
      const response = await fetch('/api/v1/prompt/template/list');
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const result = await response.json();
      setPrompts(result.data || []);
    } catch (error) {
      console.error('获取提示词列表失败:', error);
      message.error('获取提示词列表失败: ' + error.message);
    } finally {
      setPromptLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchPrompts();
  }, []);

  // 查看提示词详情
  const viewPromptDetail = (prompt) => {
    setCurrentPrompt(prompt);
    setIsEditing(false);
    setPromptDrawerVisible(true);
    promptForm.setFieldsValue({
      name: prompt.prompt_template_name,
      description: prompt.description,
      content: prompt.system_message,
    });
  };

  // 编辑提示词
  const editPrompt = (prompt) => {
    setCurrentPrompt(prompt);
    setIsEditing(true);
    setPromptDrawerVisible(true);
    promptForm.setFieldsValue({
      name: prompt.prompt_template_name,
      description: prompt.description,
      content: prompt.system_message,
    });
  };

  // 保存提示词
  const savePrompt = async (values) => {
    try {
      const url = '/api/v1/prompt/template';
      const method = 'POST';
      
      const body = {
        prompt_template_key: currentPrompt?.prompt_template_key || values.name,
        prompt_template_name: values.name,
        description: values.description,
        system_message: values.content,
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      message.success(currentPrompt ? '更新成功' : '创建成功');
      setPromptDrawerVisible(false);
      fetchPrompts();
    } catch (error) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 删除提示词
  const deletePrompt = async (prompt) => {
    try {
      const response = await fetch('/api/v1/prompt/template', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_template_key: prompt.prompt_template_key }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      message.success('删除成功');
      fetchPrompts();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 查看提示词历史
  const viewPromptHistory = async (prompt) => {
    try {
      const response = await fetch(`/api/v1/prompt/template/version/count?prompt_template_key=${prompt.prompt_template_key}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const data = await response.json();
      const history = [];
      for (let i = 1; i <= (data.data?.count || 1); i++) {
        history.push({
          version: i,
          created_at: new Date().toISOString(),
          description: `版本 ${i}`,
        });
      }
      setPromptHistory(history);
      setPromptHistoryVisible(true);
    } catch (error) {
      message.error('获取历史版本失败: ' + error.message);
    }
  };

  // 新建提示词
  const createNewPrompt = () => {
    setCurrentPrompt(null);
    setIsEditing(true);
    setPromptDrawerVisible(true);
    promptForm.resetFields();
  };

  // 提示词表格列定义
  const promptColumns = [
    {
      title: '名称',
      dataIndex: 'prompt_template_name',
      key: 'prompt_template_name',
      width: 200,
      render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 350,
      ellipsis: true,
      render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: () => <Tag color="blue" style={{ fontSize: '13px' }}>v1</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_timestamp',
      key: 'updated_timestamp',
      width: 200,
      render: (time) => <span style={{ fontSize: '14px' }}>{time ? new Date(time).toLocaleString('zh-CN') : '无'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space style={{ fontSize: '14px' }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewPromptDetail(record)}
            style={{ fontSize: '14px' }}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => editPrompt(record)}
            style={{ fontSize: '14px' }}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => viewPromptHistory(record)}
          >
            历史
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个提示词吗？"
            onConfirm={() => deletePrompt(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="提示词管理" key="prompts">
          <Card
            title="提示词管理"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={createNewPrompt}
              >
                新建提示词
              </Button>
            }
            className="page-card"
            headStyle={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
          >
            <Table
              columns={promptColumns}
              dataSource={prompts}
              rowKey="prompt_template_key"
              loading={promptLoading}
              scroll={{ x: 1200, y: 'calc(100vh - 400px)' }}
              style={{ fontSize: '14px' }}
              rowStyle={{ padding: '8px 0' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 提示词详情/编辑抽屉 */}
      <Drawer
        title={isEditing ? (currentPrompt ? '编辑提示词' : '新建提示词') : '提示词详情'}
        placement="right"
        onClose={() => setPromptDrawerVisible(false)}
        open={promptDrawerVisible}
        width={900}
        footer={
          isEditing && (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setPromptDrawerVisible(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" onClick={() => promptForm.submit()} icon={<SaveOutlined />}>
                保存
              </Button>
            </div>
          )
        }
      >
        <Form
          form={promptForm}
          layout="vertical"
          onFinish={savePrompt}
          disabled={!isEditing}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入提示词名称' }]}
          >
            <Input placeholder="请输入提示词名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input placeholder="请输入提示词描述" />
          </Form.Item>
          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <TextArea
              rows={20}
              placeholder="请输入提示词内容..."
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 历史版本抽屉 */}
      <Drawer
        title="历史版本"
        placement="right"
        onClose={() => setPromptHistoryVisible(false)}
        open={promptHistoryVisible}
        width={750}
      >
        {promptHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            暂无历史版本
          </div>
        ) : (
          <div>
            {promptHistory.map((history, index) => (
              <Card key={index} size="small" style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Tag color="blue">v{history.version}</Tag>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(history.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {history.description || '无描述'}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SystemSettings;
