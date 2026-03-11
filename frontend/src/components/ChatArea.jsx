import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Tag, Card, Space, Divider } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ExclamationCircleOutlined, BulbOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ChatArea = ({ session, onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAlertLevelColor = (alertData) => {
    const levelMap = {
      critical: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
      high: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },
      medium: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
      low: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
    };
    return levelMap.medium;
  };

  const quickQuestions = [
    '这条告警的严重程度如何？',
    '请分析这条告警的攻击路径',
    '提供处置建议',
    '查看相关历史告警',
  ];

  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)'
      }}>
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: 20, 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            SOC Agent 智能助手
          </h3>
        </div>
        
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
          }}>
            <RobotOutlined style={{ fontSize: 60, color: '#fff' }} />
          </div>
          
          <h2 style={{ 
            margin: '0 0 16px 0', 
            fontSize: 28, 
            fontWeight: 700,
            color: '#1e293b'
          }}>
            欢迎使用 SOC Agent
          </h2>
          
          <p style={{ 
            margin: '0 0 32px 0', 
            fontSize: 16, 
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 500
          }}>
            您的智能安全分析助手，可以帮您快速分析告警、提供处置建议、检索相关知识
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <Tag 
              icon={<BulbOutlined />}
              color="blue"
              style={{ 
                padding: '8px 16px', 
                fontSize: 14,
                borderRadius: 20,
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontWeight: 500
              }}
            >
              智能分析
            </Tag>
            <Tag 
              icon={<ThunderboltOutlined />}
              color="purple"
              style={{ 
                padding: '8px 16px', 
                fontSize: 14,
                borderRadius: 20,
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 500
              }}
            >
              实时响应
            </Tag>
            <Tag 
              icon={<SafetyOutlined />}
              color="green"
              style={{ 
                padding: '8px 16px', 
                fontSize: 14,
                borderRadius: 20,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 500
              }}
            >
              安全可靠
            </Tag>
          </div>
          
          <Card 
            style={{ 
              width: '100%', 
              maxWidth: 600,
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ marginBottom: 16, fontWeight: 600, color: '#1e293b' }}>
              快速开始
            </div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  block
                  style={{
                    textAlign: 'left',
                    height: 'auto',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 14
                  }}
                  onClick={() => {
                    setInputValue(question);
                  }}
                >
                  {question}
                </Button>
              ))}
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  const levelColors = getAlertLevelColor(session.alert_data);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)'
    }}>
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        marginTop: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 16, 
              fontWeight: 600,
              color: '#1e293b'
            }}>
              {session.title || '未命名对话'}
            </h3>
          </div>
        </div>
      </div>
      
      {session.alert_data && (
        <div style={{
          margin: '6px 20px',
          padding: '6px 12px',
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid rgba(0,0,0,0.06)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <ExclamationCircleOutlined style={{ fontSize: 14, color: '#64748b' }} />
            <span style={{ 
              fontSize: 12, 
              fontWeight: 600,
              color: '#1e293b'
            }}>
              告警信息
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            告警ID: 未知
          </div>
        </div>
      )}

      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100% - 120px)'
      }}>
        {session.messages && session.messages.length > 0 ? (
          session.messages.map((message, index) => (
            <div 
              key={message.message_uid || index} 
              style={{ 
                display: 'flex', 
                marginBottom: 12,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {message.role === 'agent' && (
                <Avatar 
                  size={28}
                  icon={<RobotOutlined />} 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    marginRight: 8,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                />
              )}
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: message.role === 'user' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#fff',
                  color: message.role === 'user' ? '#fff' : '#1e293b',
                  boxShadow: message.role === 'user' 
                    ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  border: message.role === 'agent' ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  fontSize: 13,
                  lineHeight: 1.4,
                  wordBreak: 'break-word'
                }}>
                  {message.content}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: '#94a3b8',
                  marginTop: 2,
                  marginLeft: message.role === 'agent' ? '8px' : '8px'
                }}>
                  {new Date(message.submit_timestamp).toLocaleString('zh-CN')}
                </div>
              </div>
              {message.role === 'user' && (
                <Avatar 
                  size={28}
                  icon={<UserOutlined />} 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    marginLeft: 8,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 16 }}>开始对话</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>输入消息开始与 SOC Agent 交流</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ 
        padding: '14px 20px', 
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Enter 发送，Shift + Enter 换行)"
          rows={1}
          disabled={isLoading}
          style={{ 
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 13,
            resize: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        />
        <div style={{ 
          marginTop: 8, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>
            {inputValue.length} / 2000
          </span>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="small"
            style={{ 
              borderRadius: 6,
              fontWeight: 600,
              height: 32,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              fontSize: 12,
              color: '#fff'
            }}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
