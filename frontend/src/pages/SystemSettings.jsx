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
  const [publishStatus, setPublishStatus] = useState('draft');

  // 获取提示词列表
  const fetchPrompts = async () => {
    try {
      setPromptLoading(true);
      const response = await fetch('/api/v1/prompt/template/list');
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const result = await response.json();
      const promptsList = result.data || [];
      
      // 为每个提示词获取历史版本
      const promptsWithVersions = await Promise.all(
        promptsList.map(async (prompt) => {
          try {
            const versionResponse = await fetch(`/api/v1/prompt/template?prompt_template_key=${prompt.prompt_template_key}`);
            if (versionResponse.ok) {
              const versionResult = await versionResponse.json();
              return {
                ...prompt,
                versions: versionResult.data || [],
              };
            }
            return prompt;
          } catch (error) {
            console.error(`获取提示词 ${prompt.prompt_template_key} 的版本失败:`, error);
            return prompt;
          }
        })
      );
      
      setPrompts(promptsWithVersions);
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
      systemMessage: prompt.system_message,
      userMessage: prompt.user_message,
      assistantMessage: prompt.assistant_message,
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
      systemMessage: prompt.system_message,
      userMessage: prompt.user_message,
      assistantMessage: prompt.assistant_message,
    });
  };

  // 保存提示词
  const savePrompt = async (values) => {
    try {
      const url = '/api/v1/prompt/template';
      const method = 'PUT';
      
      const body = {
        prompt_key: currentPrompt?.prompt_template_key || values.name,
        prompt_name: values.name,
        description: values.description,
        system_message: values.systemMessage,
        user_message: values.userMessage,
        assistant_message: values.assistantMessage,
        publish_status: publishStatus,
        updated_by: 'admin',
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

  // 回滚版本
  const rollbackVersion = async (prompt, version) => {
    try {
      const url = '/api/v1/prompt/template/rollback';
      const method = 'PUT';
      
      const body = {
        prompt_key: prompt.prompt_template_key,
        version: version,
        updated_by: 'admin',
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      
      message.success('版本回滚成功');
      fetchPrompts();
    } catch (error) {
      message.error('回滚失败: ' + error.message);
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
      const response = await fetch(`/api/v1/prompt/template?prompt_template_key=${prompt.prompt_template_key}`);
      if (!response.ok) {
        throw new Error(`API调用失败 (${response.status})`);
      }
      const data = await response.json();
      setPromptHistory(data.data || []);
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
      title: '模板KEY',
      dataIndex: 'prompt_template_key',
      key: 'prompt_template_key',
      width: 150,
      render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
    },
    {
      title: '模板名称',
      dataIndex: 'prompt_template_name',
      key: 'prompt_template_name',
      width: 200,
      render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
    },
    {
      title: '版本数量',
      dataIndex: 'version',
      key: 'version_count',
      width: 100,
      render: (_, record) => <span style={{ fontSize: '14px' }}>{record.versions?.length || 1}</span>,
    },
    {
      title: '当前版本',
      dataIndex: 'version',
      key: 'current_version',
      width: 100,
      render: (version) => <span style={{ fontSize: '14px' }}>{version || 1}</span>,
    },
    {
      title: '发布状态',
      dataIndex: 'publish_status',
      key: 'publish_status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'active': <Tag color="green" style={{ fontSize: '13px' }}>已发布</Tag>,
          'draft': <Tag color="orange" style={{ fontSize: '13px' }}>草稿</Tag>,
        };
        return statusMap[status] || <Tag style={{ fontSize: '13px' }}>{status || '无'}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_timestamp',
      key: 'created_timestamp',
      width: 200,
      render: (time) => <span style={{ fontSize: '14px' }}>{time ? new Date(time).toLocaleString('zh-CN') : '无'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space style={{ fontSize: '14px' }}>
          <Button
            type="link"
            onClick={() => editPrompt(record)}
            style={{ fontSize: '14px' }}
          >
            新建版本
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
              style={{ fontSize: '14px' }}
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
                新建提示词模板
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
              expandable={{
                expandedRowRender: (record) => {
                  return (
                    <div style={{ margin: '16px 0' }}>
                      <Table
                        columns={[
                          {
                            title: '版本号',
                            dataIndex: 'version',
                            key: 'version',
                            width: 100,
                            render: (version) => <span style={{ fontSize: '14px' }}>{version || 1}</span>,
                          },
                          {
                            title: '模板名称',
                            dataIndex: 'prompt_template_name',
                            key: 'prompt_template_name',
                            width: 200,
                            render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
                          },
                          {
                            title: '描述',
                            dataIndex: 'description',
                            key: 'description',
                            width: 300,
                            ellipsis: true,
                            render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
                          },
                          {
                            title: '发布状态',
                            dataIndex: 'publish_status',
                            key: 'publish_status',
                            width: 100,
                            render: (status) => {
                              const statusMap = {
                                'active': <Tag color="green" style={{ fontSize: '13px' }}>已发布</Tag>,
                                'draft': <Tag color="orange" style={{ fontSize: '13px' }}>草稿</Tag>,
                              };
                              return statusMap[status] || <Tag style={{ fontSize: '13px' }}>{status || '无'}</Tag>;
                            },
                          },
                          {
                            title: '创建时间',
                            dataIndex: 'created_timestamp',
                            key: 'created_timestamp',
                            width: 200,
                            render: (time) => <span style={{ fontSize: '14px' }}>{time ? new Date(time).toLocaleString('zh-CN') : '无'}</span>,
                          },
                          {
                            title: '操作',
                            key: 'action',
                            width: 150,
                            render: (_, historyRecord) => (
                              <Space style={{ fontSize: '14px' }}>
                                <Button
                                  type="link"
                                  onClick={() => viewPromptDetail(historyRecord)}
                                  style={{ fontSize: '14px' }}
                                >
                                  查看
                                </Button>
                                <Button
                                  type="link"
                                  onClick={() => rollbackVersion(historyRecord, historyRecord.version)}
                                  style={{ fontSize: '14px' }}
                                >
                                  回滚
                                </Button>
                              </Space>
                            ),
                          },
                        ]}
                        dataSource={record.versions || []}
                        rowKey="prompt_template_uid"
                        scroll={{ x: 1100 }}
                        style={{ fontSize: '14px' }}
                        rowStyle={{ padding: '8px 0' }}
                      />
                    </div>
                  );
                },
                onExpand: async (expanded, record) => {
                  if (expanded) {
                    try {
                      const versionResponse = await fetch(`/api/v1/prompt/template?prompt_template_key=${record.prompt_template_key}`);
                      if (versionResponse.ok) {
                        const versionResult = await versionResponse.json();
                        setPrompts(prevPrompts => 
                          prevPrompts.map(prompt => 
                            prompt.prompt_template_key === record.prompt_template_key
                              ? { ...prompt, versions: versionResult.data || [] }
                              : prompt
                          )
                        );
                      }
                    } catch (error) {
                      console.error(`获取提示词 ${record.prompt_template_key} 的版本失败:`, error);
                    }
                  }
                },
              }}
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
              <Button onClick={() => { setPublishStatus('draft'); promptForm.submit(); }} style={{ marginRight: 8 }}>
                保存
              </Button>
              <Button type="primary" onClick={() => { setPublishStatus('active'); promptForm.submit(); }} icon={<SaveOutlined />}>
                保存并发布
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
            label="系统角色提示词"
            name="systemMessage"
          >
            <TextArea
              rows={8}
              placeholder="请输入系统角色提示词..."
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            />
          </Form.Item>
          <Form.Item
            label="用户角色提示词"
            name="userMessage"
          >
            <TextArea
              rows={8}
              placeholder="请输入用户角色提示词..."
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            />
          </Form.Item>
          <Form.Item
            label="助手角色提示词"
            name="assistantMessage"
          >
            <TextArea
              rows={8}
              placeholder="请输入助手角色提示词..."
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
        width={1000}
      >
        {promptHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            暂无历史版本
          </div>
        ) : (
          <div>
            <Table
              columns={[
                {
                  title: '版本号',
                  dataIndex: 'version',
                  key: 'version',
                  width: 100,
                  render: (version) => <span style={{ fontSize: '14px' }}>{version || 1}</span>,
                },
                {
                  title: '模板名称',
                  dataIndex: 'prompt_template_name',
                  key: 'prompt_template_name',
                  width: 200,
                  render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description',
                  width: 300,
                  ellipsis: true,
                  render: (text) => <span style={{ fontSize: '14px' }}>{text || '无'}</span>,
                },
                {
                  title: '发布状态',
                  dataIndex: 'publish_status',
                  key: 'publish_status',
                  width: 100,
                  render: (status) => {
                    const statusMap = {
                      'active': <Tag color="green" style={{ fontSize: '13px' }}>已发布</Tag>,
                      'draft': <Tag color="orange" style={{ fontSize: '13px' }}>草稿</Tag>,
                    };
                    return statusMap[status] || <Tag style={{ fontSize: '13px' }}>{status || '无'}</Tag>;
                  },
                },
                {
                  title: '创建时间',
                  dataIndex: 'created_timestamp',
                  key: 'created_timestamp',
                  width: 200,
                  render: (time) => <span style={{ fontSize: '14px' }}>{time ? new Date(time).toLocaleString('zh-CN') : '无'}</span>,
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 150,
                  render: (_, record) => (
                    <Space style={{ fontSize: '14px' }}>
                      <Button
                        type="link"
                        onClick={() => viewPromptDetail(record)}
                        style={{ fontSize: '14px' }}
                      >
                        查看
                      </Button>
                      <Button
                                  type="link"
                                  onClick={() => rollbackVersion(record, record.version)}
                                  style={{ fontSize: '14px' }}
                                >
                                  回滚
                                </Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={promptHistory}
              rowKey="prompt_template_uid"
              scroll={{ x: 900 }}
              style={{ fontSize: '14px' }}
              rowStyle={{ padding: '8px 0' }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SystemSettings;
