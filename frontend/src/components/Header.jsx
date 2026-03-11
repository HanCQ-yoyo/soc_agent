import React from 'react';
import { GithubOutlined, FileTextOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';

const Header = () => {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      padding: 0,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      
      <div style={{
        width: '100%',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 左侧 - 页面标题区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#e2e8f0',
            letterSpacing: '0.5px',
          }}>
            智能安全运营中心
          </div>
          <div style={{
            width: '1px',
            height: '20px',
            background: 'linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
          }} />
          <div style={{
            fontSize: '12px',
            color: '#64748b',
          }}>
            AI驱动的告警研判平台
          </div>
        </div>
        
        {/* 右侧 - 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}>
          {/* 通知图标 */}
          <button style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '13px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <BellOutlined />
            <span style={{
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '50%',
              boxShadow: '0 0 8px #ef4444',
            }} />
          </button>
          
          {/* 技术设计链接 */}
          <a 
            href="https://github.com/HanCQ-yoyo/soc_agent/blob/main/docs/%E6%8A%80%E6%9C%AF%E6%9E%B6%E6%9E%84%E6%96%87%E6%A1%A3.md" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FileTextOutlined />
            技术设计
          </a>
          
          {/* Github链接 */}
          <a 
            href="https://github.com/HanCQ-yoyo/soc_agent/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <GithubOutlined />
            Github
          </a>
          
          {/* 用户头像 */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          >
            <UserOutlined style={{ color: '#fff', fontSize: '18px' }} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
