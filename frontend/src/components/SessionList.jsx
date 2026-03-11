import React from 'react';
import { Spin, Avatar, Tag, Empty, Tooltip } from 'antd';
import { MessageOutlined, CloseOutlined, ClockCircleOutlined, RobotOutlined } from '@ant-design/icons';

const SessionList = ({ sessions, currentSessionId, onSelectSession, onDeleteSession, isLoading, isLoadingMore, onLoadMore, hasMore }) => {
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 当滚动到底部时，加载更多数据
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !isLoadingMore) {
      onLoadMore && onLoadMore();
    }
  };
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        padding: 40
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ 
        padding: 40, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          opacity: 0.5
        }}>
          <RobotOutlined style={{ fontSize: 40, color: '#fff' }} />
        </div>
        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 8,
          color: '#1e293b'
        }}>
          暂无对话
        </h3>
        <p style={{ 
          fontSize: 14, 
          color: '#64748b',
          textAlign: 'center'
        }}>
          点击右上角"新建对话"开始聊天
        </p>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getAlertLevelColor = (alertData) => {
    const levelMap = {
      critical: { bg: '#fee2e2', text: '#dc2626' },
      high: { bg: '#ffedd5', text: '#ea580c' },
      medium: { bg: '#fef3c7', text: '#d97706' },
      low: { bg: '#dcfce7', text: '#16a34a' },
    };
    return levelMap.medium;
  };

  return (
    <div style={{ padding: '12px 8px', height: '100%', overflow: 'auto' }} onScroll={handleScroll}>
      {sessions.map((session, index) => {
        const isActive = session.session_id === currentSessionId;
        const levelColors = getAlertLevelColor(session.alert_data);
        
        return (
          <div
            key={session.session_id}
            onClick={() => onSelectSession(session.session_id)}
            style={{
              position: 'relative',
              padding: '10px 12px',
              marginBottom: 6,
              borderRadius: 10,
              cursor: 'pointer',
              background: isActive 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#fff',
              border: isActive ? 'none' : '1px solid rgba(0,0,0,0.06)',
              boxShadow: isActive 
                ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                : '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease',
              animation: `fadeIn 0.3s ease ${index * 0.05}s both`
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Avatar 
                size={32}
                icon={<MessageOutlined />}
                style={{ 
                  background: isActive 
                    ? 'rgba(255,255,255,0.2)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  flexShrink: 0,
                  boxShadow: isActive ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.2)'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 3
                }}>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 600,
                    color: isActive ? '#fff' : '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 'calc(100% - 36px)'
                  }}>
                    {session.title || '未命名对话'}
                  </span>
                  <Tooltip title="删除对话">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.session_id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        color: isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isActive 
                          ? 'rgba(255,255,255,0.2)' 
                          : 'rgba(0,0,0,0.06)';
                        e.currentTarget.style.color = isActive ? '#fff' : '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8';
                      }}
                    >
                      <CloseOutlined style={{ fontSize: 12 }} />
                    </button>
                  </Tooltip>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  marginBottom: 6
                }}>
                  <ClockCircleOutlined style={{ 
                    fontSize: 11, 
                    color: isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8' 
                  }} />
                  <span style={{ 
                    fontSize: 12, 
                    color: isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8' 
                  }}>
                    {formatTime(session.create_timestamp)}
                  </span>
                </div>
                
              </div>
            </div>
          </div>
        );
      })}
      
      {isLoadingMore && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 16
        }}>
          <Spin size="small" />
        </div>
      )}
      
      {!hasMore && sessions.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 16,
          fontSize: 12,
          color: '#94a3b8'
        }}>
          已加载全部会话
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SessionList;
