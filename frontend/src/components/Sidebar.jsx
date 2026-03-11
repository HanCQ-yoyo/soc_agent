import React from 'react';
import {
  ThunderboltOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BulbOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const Sidebar = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { key: 'analysis', icon: <ThunderboltOutlined />, label: '告警分析' },
    { key: 'taskManagement', icon: <SettingOutlined />, label: '任务管理' },
    { key: 'alertOperation', icon: <FileTextOutlined />, label: '告警运营' },
    { key: 'dashboard', icon: <BarChartOutlined />, label: '数据看板' },
    { key: 'knowledgeFeedback', icon: <BulbOutlined />, label: '知识反馈' },
    { key: 'modelChat', icon: <RobotOutlined />, label: '模型对话' },
    { key: 'systemSettings', icon: <SettingOutlined />, label: '系统设置' },
  ];

  return (
    <aside className="sidebar" style={{
      width: '220px',
      background: 'linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%)',
      borderRight: '1px solid rgba(59, 130, 246, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      height: '100vh',
      zIndex: 100,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Logo区域 */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '1px',
          textShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
        }}>
          SOC Agent
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav style={{
        flex: 1,
        padding: '1rem 0',
        overflowY: 'auto',
      }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map(item => {
            const isActive = currentPage === item.key;
            return (
              <li
                key={item.key}
                onClick={() => onPageChange(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1.25rem',
                  margin: '0.25rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '8px',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)' 
                    : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                }}
              >
                {/* 选中指示器 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '60%',
                    background: 'linear-gradient(180deg, #3b82f6 0%, #10b981 100%)',
                    borderRadius: '0 2px 2px 0',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                  }} />
                )}
                <span style={{ 
                  fontSize: '1.1rem', 
                  width: '20px', 
                  textAlign: 'center',
                  color: isActive ? '#60a5fa' : 'inherit',
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))' : 'none',
                }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 底部信息 */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'rgba(15, 20, 25, 0.8)',
      }}>
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '0.25rem' }}>Powered by AI</div>
          <div style={{ 
            fontSize: '10px', 
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              background: '#10b981',
              borderRadius: '50%',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse 2s infinite',
            }} />
            系统运行正常
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
