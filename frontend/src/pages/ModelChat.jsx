import React, { useState, useEffect } from 'react';
import { Button, message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import SessionList from '../components/SessionList';
import ChatArea from '../components/ChatArea';
import NewSessionModal from '../components/NewSessionModal';

const ModelChat = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [sessionCache, setSessionCache] = useState({});

  const loadSessions = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      }
      
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await fetch(`/api/v1/chat/sessions?page=${currentPage}&page_size=${pageSize}`);
      if (!response.ok) {
        throw new Error('加载会话列表失败');
      }
      const result = await response.json();
      const newSessions = result.data?.items || [];
      
      if (isLoadMore) {
        setSessions(prev => [...prev, ...newSessions]);
        setPage(currentPage);
      } else {
        setSessions(newSessions);
        if (newSessions.length > 0) {
          selectSession(newSessions[0].session_id);
        }
      }
      
      // 检查是否还有更多数据
      setHasMore(newSessions.length === pageSize);
    } catch (error) {
      console.error('加载会话列表失败:', error);
      message.error('加载会话列表失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const selectSession = async (sessionId) => {
    try {
      // 先检查缓存中是否已有该会话的详情
      if (sessionCache[sessionId]) {
        setCurrentSession(sessionCache[sessionId]);
        return;
      }
      
      setIsLoading(true);
      const response = await fetch(`/api/v1/chat/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('获取会话详情失败');
      }
      const result = await response.json();
      const sessionData = result.data || result;
      
      // 将会话详情存入缓存
      setSessionCache(prev => ({
        ...prev,
        [sessionId]: sessionData
      }));
      
      setCurrentSession(sessionData);
    } catch (error) {
      console.error('选择会话失败:', error);
      message.error('选择会话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (title, alertData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          alert_data: alertData
        })
      });
      if (!response.ok) {
        throw new Error('创建会话失败');
      }
      const result = await response.json();
      const session = result.data || result;
      
      // 将会话添加到缓存中
      setSessionCache(prev => ({
        ...prev,
        [session.session_id]: session
      }));
      
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      setIsModalVisible(false);
      message.success('会话创建成功');
    } catch (error) {
      console.error('创建会话失败:', error);
      message.error('创建会话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条对话吗？此操作不可恢复。',
      onOk: async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/v1/chat/sessions/${sessionId}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error('删除会话失败');
          }
          
          // 从缓存中移除会话
          setSessionCache(prev => {
            const newCache = { ...prev };
            delete newCache[sessionId];
            return newCache;
          });
          
          setSessions(prev => prev.filter(session => session.session_id !== sessionId));
          if (currentSession && currentSession.session_id === sessionId) {
            setCurrentSession(sessions.length > 1 ? sessions[0] : null);
          }
          message.success('会话删除成功');
        } catch (error) {
          console.error('删除会话失败:', error);
          message.error('删除会话失败，请重试');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleSendMessage = async (msg) => {
    if (!currentSession) return;

    try {
      const response = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          message: msg
        })
      });
      if (!response.ok) {
        throw new Error('发送消息失败');
      }
      const result = await response.json();
      const responseData = result.data || result;
      
      const updatedSession = {
        ...currentSession,
        messages: [
          ...(currentSession.messages || []),
          {
            message_uid: `msg_${Date.now()}`,
            role: 'user',
            content: msg,
            submit_timestamp: Date.now()
          },
          {
            message_uid: `msg_${Date.now() + 1}`,
            role: 'agent',
            content: responseData.response,
            submit_timestamp: Date.now() + 1
          }
        ]
      };
      
      // 更新缓存中的会话信息
      setSessionCache(prev => ({
        ...prev,
        [currentSession.session_id]: updatedSession
      }));
      
      setCurrentSession(updatedSession);
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', width: '100%', minHeight: '400px' }}>
      <div 
        style={{ 
          width: '260px', 
          background: 'rgba(255,255,255,0.95)', 
          borderRight: '1px solid rgba(0,0,0,0.06)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '@media (max-width: 768px)': {
            width: '240px'
          },
          '@media (max-width: 480px)': {
            width: '200px'
          }
        }}
      >
        <div className="session-header" style={{ 
          padding: '16px 16px', 
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: 16, 
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            对话
          </h3>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
            size="small"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              fontSize: 11,
              padding: '4px 8px'
            }}
          >
            新建
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SessionList 
            sessions={sessions}
            currentSessionId={currentSession?.session_id}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => loadSessions(true)}
            hasMore={hasMore}
          />
        </div>
      </div>
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatArea 
          session={currentSession}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
      <NewSessionModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onCreate={createSession}
      />
    </div>
  );
};

export default ModelChat;
