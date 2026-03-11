import React, { useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AlertAnalysis from './pages/AlertAnalysis';
import TaskManagement from './pages/TaskManagement';
import AlertOperation from './pages/AlertOperation';
import Dashboard from './pages/Dashboard';
import KnowledgeFeedback from './pages/KnowledgeFeedback';
import SystemSettings from './pages/SystemSettings';
import ModelChat from './pages/ModelChat';
import './App.css';

function App() {
  // 从localStorage读取当前页面，默认是analysis
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'analysis';
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 存储到localStorage
    localStorage.setItem('currentPage', page);
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgLayout: '#ffffff',
          borderRadius: 6,
          fontSize: 12,
        },
      }}
    >
      <div className="app-container">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
        <div className="main-container">
          <Header />
          <div className="main-content-wrapper">
            <div className="page-header">
              <div className="breadcrumb">
                <span>首页 / {getPageTitle(currentPage)}</span>
              </div>
            </div>
            {currentPage === 'analysis' && <AlertAnalysis />}
            {currentPage === 'taskManagement' && <TaskManagement />}
            {currentPage === 'alertOperation' && <AlertOperation />}
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'knowledgeFeedback' && <KnowledgeFeedback />}
            {currentPage === 'systemSettings' && <SystemSettings />}
            {currentPage === 'modelChat' && <ModelChat />}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

function getPageTitle(page) {
  const titles = {
    analysis: '告警分析',
    taskManagement: '任务管理',
    alertOperation: '告警运营',
    dashboard: '数据看板',
    knowledgeFeedback: '知识反馈',
    systemSettings: '系统设置',
    modelChat: '模型对话',
  };
  return titles[page] || page;
}

export default App;
