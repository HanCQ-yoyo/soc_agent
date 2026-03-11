// 聊天状态管理
const ChatState = {
    sessions: [],
    currentSessionId: null,
    isLoading: false,
    apiBaseUrl: 'http://localhost:8080/api/v1'
};

// DOM元素
const ChatDOM = {};

// 初始化聊天模块
function initChatModule() {
    console.log('初始化聊天模块');
    
    // 初始化DOM元素
    initChatDOM();
    
    // 加载会话列表
    loadSessions();
}

// 初始化事件监听器
function initChatEventListeners() {
    console.log('初始化事件监听器', ChatDOM);
    
    // 发送消息按钮点击事件
    if (ChatDOM.sendMessageBtn) {
        console.log('绑定发送消息按钮事件');
        ChatDOM.sendMessageBtn.addEventListener('click', function(e) {
            console.log('发送按钮被点击');
            e.preventDefault();
            sendMessage();
        });
    } else {
        console.error('发送消息按钮未找到');
    }
    
    // 消息输入框回车键发送
    if (ChatDOM.messageInput) {
        console.log('绑定消息输入框事件');
        ChatDOM.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('按下回车键');
                sendMessage();
            }
        });
    } else {
        console.error('消息输入框未找到');
    }
    
    // 新建对话按钮点击事件
    if (ChatDOM.newChatBtn) {
        console.log('绑定新建对话按钮事件');
        ChatDOM.newChatBtn.addEventListener('click', function(e) {
            console.log('新建对话按钮被点击');
            e.preventDefault();
            openNewSessionModal();
        });
    } else {
        console.error('新建对话按钮未找到');
    }
    
    // 告警引用关闭按钮点击事件
    if (ChatDOM.alertRefClose) {
        ChatDOM.alertRefClose.addEventListener('click', () => {
            if (ChatDOM.alertReference) {
                ChatDOM.alertReference.classList.remove('show');
            }
        });
    }
    
    // 模态框事件监听器
    // 直接绑定模态框相关的事件监听器，不需要检查newSessionModal是否存在
    
    // 关闭按钮点击事件
    if (ChatDOM.closeModalBtn) {
        ChatDOM.closeModalBtn.addEventListener('click', closeNewSessionModal);
    } else {
        console.error('关闭按钮未找到');
    }
    
    // 取消按钮点击事件
    if (ChatDOM.cancelModalBtn) {
        ChatDOM.cancelModalBtn.addEventListener('click', closeNewSessionModal);
    } else {
        console.error('取消按钮未找到');
    }
    
    // 创建会话按钮点击事件
    if (ChatDOM.createSessionBtn) {
        console.log('绑定创建会话按钮事件');
        ChatDOM.createSessionBtn.addEventListener('click', handleCreateSession);
    } else {
        console.error('创建会话按钮未找到');
    }
    
    // 模态框背景点击事件
    if (ChatDOM.modalOverlay) {
        ChatDOM.modalOverlay.addEventListener('click', closeNewSessionModal);
    } else {
        console.error('模态框背景未找到');
    }
    
    // 会话标题输入事件
    if (ChatDOM.sessionTitle) {
        ChatDOM.sessionTitle.addEventListener('input', validateNewSessionForm);
    } else {
        console.error('会话标题输入框未找到');
    }
    
    // 告警数据输入事件
    if (ChatDOM.alertData) {
        ChatDOM.alertData.addEventListener('input', validateNewSessionForm);
        
        ChatDOM.alertData.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleCreateSession();
            }
        });
    } else {
        console.error('告警数据输入框未找到');
    }
}

// 加载会话列表
async function loadSessions() {
    try {
        ChatState.isLoading = true;
        
        const response = await fetch(`${ChatState.apiBaseUrl}/chat/sessions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('加载会话列表失败');
        }
        
        const data = await response.json();
        ChatState.sessions = data.items || [];
        
        // 更新会话列表UI
        updateSessionList();
        
        // 如果有会话，默认选择第一个
        if (ChatState.sessions.length > 0) {
            selectSession(ChatState.sessions[0].session_uid);
        }
        
    } catch (error) {
        console.error('加载会话列表失败:', error);
        showError('加载会话列表失败，请刷新页面重试');
    } finally {
        ChatState.isLoading = false;
    }
}

// 更新会话列表UI
function updateSessionList() {
    if (!ChatDOM.sessionList) return;
    
    ChatDOM.sessionList.innerHTML = '';
    
    if (ChatState.sessions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'chat-empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">💬</div>
            <h3>暂无对话</h3>
            <p>点击右上角"新建对话"开始聊天</p>
        `;
        ChatDOM.sessionList.appendChild(emptyState);
        return;
    }
    
    ChatState.sessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = `session-item ${session.session_uid === ChatState.currentSessionId ? 'active' : ''}`;
        sessionItem.dataset.sessionId = session.session_uid;
        
        const sessionTitle = document.createElement('div');
        sessionTitle.className = 'session-title';
        sessionTitle.textContent = session.title || '未命名对话';
        
        const sessionTime = document.createElement('div');
        sessionTime.className = 'session-time';
        sessionTime.textContent = new Date(session.created_at).toLocaleString();
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'session-close-btn';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(session.session_uid);
        });
        
        sessionItem.appendChild(sessionTitle);
        sessionItem.appendChild(sessionTime);
        sessionItem.appendChild(closeBtn);
        
        sessionItem.addEventListener('click', () => {
            selectSession(session.session_uid);
        });
        
        ChatDOM.sessionList.appendChild(sessionItem);
    });
}

// 选择会话
async function selectSession(sessionId) {
    try {
        ChatState.isLoading = true;
        
        const response = await fetch(`${ChatState.apiBaseUrl}/chat/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取会话详情失败');
        }
        
        const session = await response.json();
        ChatState.currentSessionId = session.session_uid;
        
        // 更新会话标题
        if (ChatDOM.currentSessionTitle) {
            ChatDOM.currentSessionTitle.textContent = session.title || '未命名对话';
        }
        
        // 更新消息列表
        updateMessageList(session.messages || []);
        
        // 更新告警引用
        if (session.alert_data) {
            showAlertReference(session.alert_data);
        } else {
            ChatDOM.alertReference.classList.remove('show');
        }
        
        // 更新会话列表UI
        updateSessionList();
        
    } catch (error) {
        console.error('选择会话失败:', error);
        showError('选择会话失败，请重试');
    } finally {
        ChatState.isLoading = false;
    }
}

// 创建新会话
async function createNewSession(alertData = null, customTitle = null) {
    try {
        console.log('createNewSession函数被调用:', { alertData, customTitle });
        ChatState.isLoading = true;
        
        // Determine session title
        let sessionTitle;
        if (customTitle) {
            sessionTitle = customTitle;
        } else if (alertData && alertData.alert_name) {
            sessionTitle = alertData.alert_name;
        } else {
            // Prompt user for title if no alert data and no custom title
            sessionTitle = prompt('请输入对话标题:', `对话 ${new Date().toLocaleString()}`);
            // If user cancels prompt, use default title
            if (!sessionTitle) {
                sessionTitle = `对话 ${new Date().toLocaleString()}`;
            }
        }
        
        const requestData = {
            title: sessionTitle,
            alert_data: alertData
        };
        
        console.log('准备发送请求:', { url: `${ChatState.apiBaseUrl}/chat/sessions`, requestData });
        
        const response = await fetch(`${ChatState.apiBaseUrl}/chat/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('请求完成，响应状态:', response.status);
        
        if (!response.ok) {
            console.error('响应失败:', response.status, response.statusText);
            throw new Error('创建会话失败');
        }
        
        const session = await response.json();
        console.log('获取到会话数据:', session);
        
        ChatState.sessions.unshift(session);
        ChatState.currentSessionId = session.session_uid;
        
        // 更新会话标题
        if (ChatDOM.currentSessionTitle) {
            ChatDOM.currentSessionTitle.textContent = session.title;
        }
        
        // 更新消息列表
        updateMessageList(session.messages || []);
        
        // 更新告警引用
        if (session.alert_data) {
            showAlertReference(session.alert_data);
        } else {
            ChatDOM.alertReference.classList.remove('show');
        }
        
        // 更新会话列表UI
        updateSessionList();
        
    } catch (error) {
        console.error('创建会话失败:', error);
        showError('创建会话失败，请重试');
    } finally {
        ChatState.isLoading = false;
    }
}

// 删除会话
async function deleteSession(sessionId) {
    try {
        ChatState.isLoading = true;
        
        const response = await fetch(`${ChatState.apiBaseUrl}/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('删除会话失败');
        }
        
        // 从会话列表中移除
        ChatState.sessions = ChatState.sessions.filter(session => session.session_uid !== sessionId);
        
        // 如果删除的是当前会话，选择第一个会话或显示欢迎界面
        if (sessionId === ChatState.currentSessionId) {
            if (ChatState.sessions.length > 0) {
                selectSession(ChatState.sessions[0].session_uid);
            } else {
                ChatState.currentSessionId = null;
                if (ChatDOM.currentSessionTitle) {
                    ChatDOM.currentSessionTitle.textContent = '新建对话';
                }
                if (ChatDOM.chatMessages) {
                    ChatDOM.chatMessages.innerHTML = `
                        <div class="chat-welcome">
                            <div class="welcome-icon">💬</div>
                            <h3>欢迎使用SOC Agent</h3>
                            <p>您可以开始一个新的对话，或者从左侧选择一个现有对话</p>
                        </div>
                    `;
                }
                ChatDOM.alertReference.classList.remove('show');
            }
        }
        
        // 更新会话列表UI
        updateSessionList();
        
    } catch (error) {
        console.error('删除会话失败:', error);
        showError('删除会话失败，请重试');
    } finally {
        ChatState.isLoading = false;
    }
}

// 发送消息
async function sendMessage() {
    console.log('sendMessage被调用', { currentSessionId: ChatState.currentSessionId, messageInput: ChatDOM.messageInput });
    
    if (!ChatState.currentSessionId) {
        showError('请先选择一个对话');
        return;
    }

    const message = ChatDOM.messageInput.value.trim();
    console.log('消息内容:', message);
    if (!message) {
        console.log('消息为空');
        return;
    }

    // 清空输入
    ChatDOM.messageInput.value = '';

    // 立即添加用户消息到UI
    addMessageToUI({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    // 显示正在输入提示
    showTypingIndicator();

    try {
        const session = ChatState.sessions.find(s => s.session_uid === ChatState.currentSessionId);

        const response = await fetch(`${ChatState.apiBaseUrl}/chat/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: ChatState.currentSessionId,
                message: message,
                alert_data: session?.alert_data || null
            })
        });

        if (!response.ok) {
            throw new Error('发送消息失败');
        }

        const data = await response.json();

        // 移除正在输入提示
        removeTypingIndicator();

        // 添加AI响应到UI
        addMessageToUI({
            role: 'agent',
            content: data.response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        showError('发送消息失败，请重试');
    }
}

// 更新消息列表
function updateMessageList(messages) {
    if (!ChatDOM.chatMessages) return;
    
    ChatDOM.chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'chat-empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">💬</div>
            <h3>开始对话</h3>
            <p>输入消息开始与SOC Agent交流</p>
        `;
        ChatDOM.chatMessages.appendChild(emptyState);
        return;
    }
    
    messages.forEach(message => {
        addMessageToUI(message);
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 添加消息到UI
function addMessageToUI(message) {
    if (!ChatDOM.chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    switch (message.role) {
        case 'user':
            avatar.textContent = '👤';
            break;
        case 'agent':
            avatar.textContent = '🤖';
            break;
        case 'system':
            avatar.textContent = 'ℹ️';
            break;
        default:
            avatar.textContent = '💬';
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = message.content;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    content.appendChild(text);
    content.appendChild(time);
    messageElement.appendChild(avatar);
    messageElement.appendChild(content);
    
    ChatDOM.chatMessages.appendChild(messageElement);
    
    // 滚动到底部
    scrollToBottom();
}

// 显示正在输入提示
function showTypingIndicator() {
    if (!ChatDOM.chatMessages) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message agent typing';
    typingElement.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const text = document.createElement('div');
    text.className = 'message-text';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    text.appendChild(typingIndicator);
    content.appendChild(text);
    typingElement.appendChild(avatar);
    typingElement.appendChild(content);
    
    ChatDOM.chatMessages.appendChild(typingElement);
    
    // 滚动到底部
    scrollToBottom();
}

// 移除正在输入提示
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 滚动到底部
function scrollToBottom() {
    if (ChatDOM.chatMessages) {
        ChatDOM.chatMessages.scrollTop = ChatDOM.chatMessages.scrollHeight;
    }
}

// 显示告警引用
function showAlertReference(alertData) {
    if (!ChatDOM.alertReference) return;
    
    if (alertData.alert_name) {
        ChatDOM.alertRefTitle.textContent = alertData.alert_name;
    }
    
    if (alertData.alert_level) {
        ChatDOM.alertRefLevel.textContent = alertData.alert_level;
        ChatDOM.alertRefLevel.className = `alert-ref-level ${alertData.alert_level}`;
    }
    
    if (alertData.alert_id) {
        ChatDOM.alertRefId.textContent = `告警ID: ${alertData.alert_id}`;
    }
    
    ChatDOM.alertReference.classList.add('show');
}

// 显示错误提示
function showError(message) {
    // 创建错误提示元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-tooltip';
    errorElement.style.position = 'fixed';
    errorElement.style.top = '20px';
    errorElement.style.right = '20px';
    errorElement.style.background = '#f44336';
    errorElement.style.color = 'white';
    errorElement.style.padding = '12px 20px';
    errorElement.style.borderRadius = '4px';
    errorElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    errorElement.style.zIndex = '1000';
    errorElement.style.animation = 'slideIn 0.3s ease';
    errorElement.textContent = message;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 添加到页面
    document.body.appendChild(errorElement);
    
    // 3秒后移除
    setTimeout(() => {
        errorElement.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            errorElement.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// 从告警运营列表携带数据到聊天框
window.loadAlertToChat = function(alertData, analysisId) {
    // 切换到聊天页面
    if (typeof switchPage !== 'undefined') {
        switchPage('chat');
    } else {
        console.error('switchPage函数未定义');
        // 直接显示聊天页面
        const pages = document.querySelectorAll('.page');
        if (pages) {
            pages.forEach(page => {
                page.classList.remove('active');
            });
        }
        const chatPage = document.getElementById('chatPage');
        if (chatPage) {
            chatPage.classList.add('active');
        }
    }
    
    // 等待DOM更新后调用聊天模块
    setTimeout(() => {
        // 重新初始化DOM元素
        initChatDOM();
        
        // 调用聊天模块创建带告警数据的新会话
        if (typeof createNewSession !== 'undefined') {
            // Use alert name as session title if available
            let customTitle = null;
            if (alertData && alertData.alert_name) {
                customTitle = alertData.alert_name;
            }
            createNewSession(alertData, customTitle);
        } else {
            console.error('createNewSession函数未定义');
        }
    }, 300); // 增加延迟时间，确保DOM元素已经渲染
};

// 初始化ChatDOM对象
function initChatDOM() {
    console.log('Initializing ChatDOM');
    
    ChatDOM.sessionList = document.getElementById('sessionList');
    ChatDOM.currentSessionTitle = document.getElementById('currentSessionTitle');
    ChatDOM.chatMessages = document.getElementById('chatMessages');
    ChatDOM.messageInput = document.getElementById('messageInput');
    ChatDOM.sendMessageBtn = document.getElementById('sendMessageBtn');
    ChatDOM.newChatBtn = document.getElementById('newChatBtn');
    ChatDOM.alertReference = document.getElementById('alertReference');
    ChatDOM.alertRefTitle = document.getElementById('alertRefTitle');
    ChatDOM.alertRefLevel = document.getElementById('alertRefLevel');
    ChatDOM.alertRefId = document.getElementById('alertRefId');
    ChatDOM.alertRefClose = document.getElementById('alertRefClose');
    
    // 模态框元素
    ChatDOM.newSessionModal = document.getElementById('newSessionModal');
    ChatDOM.modalOverlay = document.querySelector('.chat-modal-overlay');
    ChatDOM.closeModalBtn = document.getElementById('closeModalBtn');
    ChatDOM.cancelModalBtn = document.getElementById('cancelModalBtn');
    ChatDOM.createSessionBtn = document.getElementById('createSessionBtn');
    ChatDOM.sessionTitle = document.getElementById('sessionTitle');
    // 确保获取的是模态框中的告警数据输入框
    ChatDOM.alertData = document.querySelector('#newSessionModal #alertData');
    
    // 重新初始化事件监听器
    initChatEventListeners();
}

// 导出函数到全局作用域
window.createNewSession = createNewSession;

// 打开新建会话模态框
function openNewSessionModal() {
    console.log('Opening new session modal');
    
    if (!ChatDOM.newSessionModal) {
        console.error('Modal element not found');
        return;
    }
    
    // 重置表单
    if (ChatDOM.sessionTitle) ChatDOM.sessionTitle.value = '';
    if (ChatDOM.alertData) ChatDOM.alertData.value = '';
    
    // 显示模态框
    ChatDOM.newSessionModal.style.display = 'flex';
    
    // 聚焦到会话标题输入框
    setTimeout(() => {
        if (ChatDOM.sessionTitle) {
            ChatDOM.sessionTitle.focus();
        }
    }, 100);
}

// 关闭新建会话模态框
function closeNewSessionModal() {
    if (ChatDOM.newSessionModal) {
        ChatDOM.newSessionModal.style.display = 'none';
    }
}

// 验证新建会话表单
function validateNewSessionForm() {
    console.log('Validating form...');
    let isValid = true;
    
    // 验证会话标题
    if (ChatDOM.sessionTitle) {
        const titleValue = ChatDOM.sessionTitle.value.trim();
        console.log('Title value:', titleValue);
        if (!titleValue) {
            isValid = false;
        }
    }
    
    // 验证告警数据
    if (ChatDOM.alertData) {
        const alertDataValue = ChatDOM.alertData.value.trim();
        console.log('Alert data value:', alertDataValue);
        if (!alertDataValue) {
            isValid = false;
        }
    }
    
    console.log('Form is valid:', isValid);
    
    return isValid;
}

// 处理创建会话
async function handleCreateSession() {
    console.log('处理创建会话被调用');
    // 直接从DOM中获取表单数据，确保获取的是模态框中的输入框
    const sessionTitle = document.querySelector('#newSessionModal #sessionTitle');
    const alertData = document.querySelector('#newSessionModal #alertData');
    
    const title = sessionTitle ? sessionTitle.value.trim() : '';
    const alertDataText = alertData ? alertData.value.trim() : '';
    
    console.log('表单数据:', { title, alertDataText });
    
    if (!title || !alertDataText) {
        console.log('表单数据无效');
        showError('请输入会话标题和告警数据');
        return;
    }
    
    try {
        console.log('尝试创建会话');
        // 尝试解析告警数据为JSON
        let alertDataObj = null;
        try {
            alertDataObj = JSON.parse(alertDataText);
            console.log('告警数据解析为JSON成功:', alertDataObj);
        } catch (e) {
            // 如果不是有效的JSON，将其作为普通文本处理
            alertDataObj = { alert_name: title, alert_description: alertDataText };
            console.log('告警数据解析为JSON失败，作为普通文本处理:', alertDataObj);
        }
        
        // 创建新会话
        console.log('调用createNewSession函数');
        await createNewSession(alertDataObj, title);
        console.log('createNewSession函数执行完成');
        
        // 关闭模态框
        console.log('关闭模态框');
        closeNewSessionModal();
    } catch (error) {
        console.error('创建会话失败:', error);
        showError('创建会话失败，请重试');
    }
}

// 页面加载完成后初始化聊天模块
document.addEventListener('DOMContentLoaded', initChatModule);
