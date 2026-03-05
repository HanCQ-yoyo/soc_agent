// 应用状态管理
const AppState = {
    currentAnalysisId: null,
    currentResult: null,
    originalAlertData: null, // 存储原始告警数据
    isLoading: false,
    analysisStartTime: null, // 开始分析时间
    // 告警运营页面状态
    historyState: {
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalItems: 0,
        currentFilter: {},
        historyList: [],
        isLoading: false
    },
    // 任务管理页面状态
    taskState: {
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalItems: 0,
        currentFilter: {},
        taskList: [],
        isLoading: false
    },
    // 数据看板状态
    dashboardState: {
        echartsLoaded: false,
        isLoading: false
    },
    // 知识反馈页面状态
    knowledgeFeedbackState: {
        // 反馈管理状态
        feedbackManagement: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 0,
            totalItems: 0,
            currentFilter: {},
            feedbackList: [],
            isLoading: false
        },
        // 知识检索状态
        knowledgeRetrieval: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 0,
            totalItems: 0,
            retrievalResult: [],
            isLoading: false,
            currentFilter: {
                retrievalType: 'keyword',
                queryExpr: '',
                similarKeyword: '',
                analysisUID: '',
                topK: 10,
                scoreThreshold: 0.5,
                metricType: 'COSINE'
            }
        }
    },
    // 系统设置页面状态
    systemSettingsState: {
        // 提示词管理状态
        promptManagement: {
            promptList: [],
            isLoading: false
        }
    }
};

// API配置
const API_CONFIG = {
    BASE_URL: '/api/v1',
    TIMEOUT: 60000 // 60秒超时
};

// DOM元素
let DOM = {};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM元素
    initDOM();
    
    // 初始化其他功能
    initEventListeners();
    initMarked();
    initRouter();
    initSourceOptions();
});

// 初始化DOM元素
function initDOM() {
    DOM = {
        // 告警分析页面
        form: document.getElementById('alertForm'),
        source: document.getElementById('source'),
        alertData: document.getElementById('alertData'),
        submitBtn: document.getElementById('submitBtn'),
        submitTaskBtn: document.getElementById('submitTaskBtn'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        taskLoadingSpinner: document.getElementById('taskLoadingSpinner'),
        resultContainer: document.getElementById('resultContainer'),
        // 告警运营页面
        alertOperationPage: document.getElementById('alertOperationPage'),
        analysisPage: document.getElementById('analysisPage'),
        filterForm: document.getElementById('filterForm'),
        filterSource: document.getElementById('filterSource'),
        filterResultType: document.getElementById('filterResultType'),
        filterStartTime: document.getElementById('filterStartTime'),
        filterEndTime: document.getElementById('filterEndTime'),
        historyContainer: document.getElementById('historyContainer'),
        pagination: document.getElementById('pagination'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        pageInfo: document.getElementById('pageInfo'),
        // 任务管理页面
        taskManagementPage: document.getElementById('taskManagementPage'),
        taskFilterForm: document.getElementById('taskFilterForm'),
        taskFilterAnalysisId: document.getElementById('taskFilterAnalysisId'),
        taskFilterSource: document.getElementById('taskFilterSource'),
        taskFilterRawAlert: document.getElementById('taskFilterRawAlert'),
        taskContainer: document.getElementById('taskContainer'),
        taskPagination: document.getElementById('taskPagination'),
        taskPrevPage: document.getElementById('taskPrevPage'),
        taskNextPage: document.getElementById('taskNextPage'),
        taskPageInfo: document.getElementById('taskPageInfo'),
        // 侧边栏
        navItems: document.querySelectorAll('.nav-item'),
        // 抽屉
        drawerOverlay: document.getElementById('drawerOverlay'),
        drawer: document.getElementById('drawer'),
        drawerTitle: document.getElementById('drawerTitle'),
        drawerContent: document.getElementById('drawerContent'),
        drawerClose: document.getElementById('drawerClose'),
        drawerRefresh: document.getElementById('drawerRefresh'),
        // 弹框
        modalOverlay: document.getElementById('feedbackModalOverlay'),
        modal: document.getElementById('feedbackModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalContent: document.getElementById('modalContent'),
        modalClose: document.getElementById('modalClose'),
        // 看板页面
        dashboardPage: document.getElementById('dashboardPage'),
        dashboardTimeRange: document.getElementById('dashboardTimeRange'),
        dashboardStartTime: document.getElementById('dashboardStartTime'),
        dashboardEndTime: document.getElementById('dashboardEndTime'),
        dashboardRefreshBtn: document.getElementById('dashboardRefreshBtn'),
        customTimeRange: document.getElementById('customTimeRange'),
        customTimeRangeEnd: document.getElementById('customTimeRangeEnd'),
        totalAlerts: document.getElementById('totalAlerts'),
        averageAnalysisTime: document.getElementById('averageAnalysisTime'),
        truePositiveCount: document.getElementById('truePositiveCount'),
        falsePositiveCount: document.getElementById('falsePositiveCount'),
        suspiciousCount: document.getElementById('suspiciousCount'),
        invalidCount: document.getElementById('invalidCount'),
        resultTypeChart: document.getElementById('resultTypeChart'),
        alertSourceChart: document.getElementById('alertSourceChart'),
        alertSeverityChart: document.getElementById('alertSeverityChart'),
        timeTrendChart: document.getElementById('timeTrendChart'),
        efficiencyChart: document.getElementById('efficiencyChart'),
        // 知识反馈页面
        knowledgeFeedbackPage: document.getElementById('knowledgeFeedbackPage'),
        feedbackFilterForm: document.getElementById('feedbackFilterForm'),
        filterFeedbackType: document.getElementById('filterFeedbackType'),
        filterCorrectResult: document.getElementById('filterCorrectResult'),
        filterStatus: document.getElementById('filterStatus'),
        feedbackContainer: document.getElementById('feedbackContainer'),
        feedbackPagination: document.getElementById('feedbackPagination'),
        feedbackPrevPage: document.getElementById('feedbackPrevPage'),
        feedbackNextPage: document.getElementById('feedbackNextPage'),
        feedbackPageInfo: document.getElementById('feedbackPageInfo'),
        // 标签页
        tabItems: document.querySelectorAll('.tab-item'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        // 系统设置页面
        systemSettingsPage: document.getElementById('systemSettingsPage'),
        promptContainer: document.getElementById('promptContainer'),
        createPromptBtn: document.getElementById('createPromptBtn'),
        // 知识检索页面
        knowledgeRetrievalForm: document.getElementById('knowledgeRetrievalForm'),
        queryExpr: document.getElementById('queryExpr'),
        retrievalType: document.getElementById('retrievalType'),
        keywordGroup: document.getElementById('keywordGroup'),
        similarKeyword: document.getElementById('similarKeyword'),
        analysisUIDGroup: document.getElementById('analysisUIDGroup'),
        analysisUID: document.getElementById('analysisUID'),
        topK: document.getElementById('topK'),
        scoreThreshold: document.getElementById('scoreThreshold'),
        metricType: document.getElementById('metricType'),
        retrievalResult: document.getElementById('retrievalResult'),
        retrievalPagination: document.getElementById('retrievalPagination'),
        retrievalPrevPage: document.getElementById('retrievalPrevPage'),
        retrievalNextPage: document.getElementById('retrievalNextPage'),
        retrievalPageInfo: document.getElementById('retrievalPageInfo'),
        // 元数据抽屉
        metadataDrawer: document.getElementById('metadataDrawer'),
        metadataOverlay: document.getElementById('metadataOverlay'),
        metadataClose: document.getElementById('metadataClose'),
        metadataContent: document.getElementById('metadataContent')

    };
    
    // 填充示例数据
    if (DOM.alertData) {
        DOM.alertData.value = EXAMPLE_DATA;
    }
}

// 初始化告警来源选项
function initSourceOptions() {
    // 从localStorage中读取保存的告警来源
    const savedSources = getSavedSources();
    // 更新datalist元素
    updateSourceDatalist(savedSources);
}

// 从localStorage中获取保存的告警来源
function getSavedSources() {
    try {
        const saved = localStorage.getItem('alertSources');
        return saved ? JSON.parse(saved) : ['WAF', 'IDS', 'SIEM', 'EDR', '其他'];
    } catch (error) {
        console.error('Error getting saved sources:', error);
        return ['WAF', 'IDS', 'SIEM', 'EDR', '其他'];
    }
}

// 保存告警来源到localStorage
function saveSource(source) {
    if (!source || source.trim() === '') return;
    
    const sources = getSavedSources();
    if (!sources.includes(source)) {
        sources.push(source);
        try {
            localStorage.setItem('alertSources', JSON.stringify(sources));
            updateSourceDatalist(sources);
        } catch (error) {
            console.error('Error saving source:', error);
        }
    }
}

// 更新datalist元素
function updateSourceDatalist(sources) {
    // 更新告警分析页面的datalist
    const sourceList = document.getElementById('sourceList');
    if (sourceList) {
        sourceList.innerHTML = '';
        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            sourceList.appendChild(option);
        });
    }
    
    // 更新告警运营页面的datalist
    const filterSourceList = document.getElementById('filterSourceList');
    if (filterSourceList) {
        filterSourceList.innerHTML = '';
        // 添加空选项作为"全部"
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        filterSourceList.appendChild(emptyOption);
        // 添加其他选项
        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            filterSourceList.appendChild(option);
        });
    }
}

// 初始化路由
function initRouter() {
    // 检查当前URL路径
    const path = window.location.pathname;
    if (path === '/alert-operation') {
        switchPage('alertOperation');
    } else {
        // 默认显示分析页面
        switchPage('analysis');
    }
}

// 初始化事件监听器
function initEventListeners() {
    // 表单提交
    if (DOM.form) {
        DOM.form.addEventListener('submit', handleFormSubmit);
    }
    
    // 提交任务按钮点击事件
    if (DOM.submitTaskBtn) {
        DOM.submitTaskBtn.addEventListener('click', handleSubmitTask);
    }
    
    // 抽屉关闭
    if (DOM.drawerClose) {
        DOM.drawerClose.addEventListener('click', closeDrawer);
    }
    if (DOM.drawerOverlay) {
        DOM.drawerOverlay.addEventListener('click', closeDrawer);
    }
    
    // 抽屉刷新
    if (DOM.drawerRefresh) {
        DOM.drawerRefresh.addEventListener('click', function() {
            // 检查当前是否是研判流程页面
            if (DOM.drawerTitle.textContent === '研判流程') {
                // 获取当前的analysisId（需要在打开抽屉时存储）
                const currentAnalysisId = DOM.drawer.dataset.analysisId;
                if (currentAnalysisId) {
                    // 重新加载研判流程
                    viewTaskWorkflow(currentAnalysisId);
                }
            }
        });
    }
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
            closeModal();
        }
    });
    
    // 弹框关闭
    if (DOM.modalClose) {
        DOM.modalClose.addEventListener('click', closeModal);
    }
    // 移除遮罩层点击关闭事件，确保只能通过关闭按钮关闭
    if (DOM.modalOverlay) {
        // 移除可能存在的点击事件
        DOM.modalOverlay.removeEventListener('click', closeModal);
    }
    
    // 告警来源输入框事件
    if (DOM.source) {
        DOM.source.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveSource(e.target.value);
            }
        });
        
        DOM.source.addEventListener('blur', (e) => {
            saveSource(e.target.value);
        });
    }
    
    // 知识反馈页面筛选表单提交
    if (DOM.feedbackFilterForm) {
        DOM.feedbackFilterForm.addEventListener('submit', handleFeedbackFilterSubmit);
    }
    
    // 告警运营页面的告警来源输入框事件
    const filterSource = document.getElementById('filterSource');
    if (filterSource) {
        filterSource.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveSource(e.target.value);
            }
        });
        
        filterSource.addEventListener('blur', (e) => {
            saveSource(e.target.value);
        });
    }
    
    // 侧边栏导航
    if (DOM.navItems && DOM.navItems.length > 0) {
        DOM.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                switchPage(page);
            });
        });
    }
    
    // 告警运营页面事件
    if (DOM.filterForm) {
        DOM.filterForm.addEventListener('submit', handleFilterSubmit);
    }
    if (DOM.prevPage) {
        DOM.prevPage.addEventListener('click', () => {
            if (AppState.historyState.currentPage > 1) {
                AppState.historyState.currentPage--;
                fetchHistoryList();
            }
        });
    }
    if (DOM.nextPage) {
        DOM.nextPage.addEventListener('click', () => {
            if (AppState.historyState.currentPage < AppState.historyState.totalPages) {
                AppState.historyState.currentPage++;
                fetchHistoryList();
            }
        });
    }
    
    // 任务管理页面事件
    if (DOM.taskFilterForm) {
        DOM.taskFilterForm.addEventListener('submit', handleTaskFilterSubmit);
    }
    if (DOM.taskPrevPage) {
        DOM.taskPrevPage.addEventListener('click', () => {
            if (AppState.taskState.currentPage > 1) {
                AppState.taskState.currentPage--;
                fetchTaskList();
            }
        });
    }
    if (DOM.taskNextPage) {
        DOM.taskNextPage.addEventListener('click', () => {
            if (AppState.taskState.currentPage < AppState.taskState.totalPages) {
                AppState.taskState.currentPage++;
                fetchTaskList();
            }
        });
    }
    
    // 全局点击事件，关闭错误提示框
    document.addEventListener('click', function() {
        document.querySelectorAll('.error-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
    });
    
    // 看板页面事件
    if (DOM.dashboardTimeRange) {
        DOM.dashboardTimeRange.addEventListener('change', handleDashboardTimeRangeChange);
    }
    if (DOM.dashboardRefreshBtn) {
        DOM.dashboardRefreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // 知识反馈页面事件
    // 标签页切换
    if (DOM.tabItems) {
        DOM.tabItems.forEach(item => {
            item.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchTab(tabId);
            });
        });
    }
    // 反馈管理筛选表单提交
    if (DOM.feedbackFilterForm) {
        DOM.feedbackFilterForm.addEventListener('submit', handleFeedbackFilterSubmit);
    }
    // 反馈管理分页按钮
    if (DOM.feedbackPrevPage) {
        DOM.feedbackPrevPage.addEventListener('click', () => {
            if (AppState.knowledgeFeedbackState.feedbackManagement.currentPage > 1) {
                AppState.knowledgeFeedbackState.feedbackManagement.currentPage--;
                fetchFeedbackList();
            }
        });
    }
    if (DOM.feedbackNextPage) {
        DOM.feedbackNextPage.addEventListener('click', () => {
            if (AppState.knowledgeFeedbackState.feedbackManagement.currentPage < AppState.knowledgeFeedbackState.feedbackManagement.totalPages) {
                AppState.knowledgeFeedbackState.feedbackManagement.currentPage++;
                fetchFeedbackList();
            }
        });
    }
    
    // 系统设置页面事件
    // 创建提示词按钮点击事件
    if (DOM.createPromptBtn) {
        DOM.createPromptBtn.addEventListener('click', openCreatePromptModal);
    }
    
    // 知识检索页面事件
    // 检索类型切换事件
    if (DOM.retrievalType) {
        DOM.retrievalType.addEventListener('change', handleRetrievalTypeChange);
    }
    // 知识检索表单提交
    if (DOM.knowledgeRetrievalForm) {
        DOM.knowledgeRetrievalForm.addEventListener('submit', handleKnowledgeRetrievalSubmit);
    }
    // 知识检索分页按钮
    if (DOM.retrievalPrevPage) {
        DOM.retrievalPrevPage.addEventListener('click', () => {
            if (AppState.knowledgeFeedbackState.knowledgeRetrieval.currentPage > 1) {
                AppState.knowledgeFeedbackState.knowledgeRetrieval.currentPage--;
                fetchRetrievalResult();
            }
        });
    }
    if (DOM.retrievalNextPage) {
        DOM.retrievalNextPage.addEventListener('click', () => {
            if (AppState.knowledgeFeedbackState.knowledgeRetrieval.currentPage < AppState.knowledgeFeedbackState.knowledgeRetrieval.totalPages) {
                AppState.knowledgeFeedbackState.knowledgeRetrieval.currentPage++;
                fetchRetrievalResult();
            }
        });
    }
    // 元数据抽屉关闭事件
    if (DOM.metadataClose) {
        DOM.metadataClose.addEventListener('click', closeMetadataDrawer);
    }
    if (DOM.metadataOverlay) {
        DOM.metadataOverlay.addEventListener('click', closeMetadataDrawer);
    }
} 

// 初始化marked配置
function initMarked() {
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        breaks: true,
        gfm: true
    });
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (AppState.isLoading) return;
    
    try {
        // 记录开始分析时间
        AppState.analysisStartTime = Date.now();
        
        // 设置加载状态
        setLoading(true);
        
        // 验证表单
        const formData = validateAndGetFormData();
        
        // 保存原始告警数据
        AppState.originalAlertData = formData.alert_data;
        
        // 调用API
        const result = await callAnalyzeAPI(formData);
        
        // 计算分析耗时（秒）
        const analysisEndTime = Date.now();
        const analysisTime = ((analysisEndTime - AppState.analysisStartTime) / 1000).toFixed(1);
        
        // 保存结果和耗时
        AppState.currentResult = result;
        AppState.currentAnalysisId = result.AnalysisID;
        result.analysis_time = analysisTime;
        
        // 渲染结果
        renderResult(result);
        
    } catch (error) {
        handleError(error);
    } finally {
        setLoading(false);
    }
}

// 验证表单并获取数据
function validateAndGetFormData() {
    // 检查DOM元素是否存在
    if (!DOM.source) {
        throw new Error('告警来源输入框不存在');
    }
    if (!DOM.alertData) {
        throw new Error('告警数据输入框不存在');
    }
    
    // 安全获取值
    const source = (DOM.source.value || '').trim();
    const alertDataText = (DOM.alertData.value || '').trim();
    
    if (!source) {
        throw new Error('请选择告警来源');
    }
    
    if (!alertDataText) {
        throw new Error('请输入告警数据');
    }
    
    return {
        alert_data: alertDataText,
        source: source,
        timestamp: Date.now().toString()
    };
}

// 调用告警分析API
async function callAnalyzeAPI(data) {
    const url = `${API_CONFIG.BASE_URL}/alert/analyze`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        timeout: API_CONFIG.TIMEOUT,
        mode: 'cors'  // 允许跨域请求
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 调用异步告警分析API
async function callAsyncAnalyzeAPI(data) {
    const url = `${API_CONFIG.BASE_URL}/alert/analyze/async`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        timeout: API_CONFIG.TIMEOUT,
        mode: 'cors'  // 允许跨域请求
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 处理提交任务按钮点击
async function handleSubmitTask(e) {
    e.preventDefault();
    
    if (AppState.isLoading) return;
    
    try {
        // 设置加载状态
        setTaskLoading(true);
        
        // 验证表单
        const formData = validateAndGetFormData();
        
        // 保存原始告警数据
        AppState.originalAlertData = formData.alert_data;
        
        // 调用异步API
        const result = await callAsyncAnalyzeAPI(formData);
        
        // 渲染任务提交结果
        renderTaskResult(result);
        
    } catch (error) {
        handleError(error);
    } finally {
        setTaskLoading(false);
    }
}

// 设置任务加载状态
function setTaskLoading(isLoading) {
    AppState.isLoading = isLoading;
    
    if (isLoading) {
        if (DOM.submitTaskBtn) {
            DOM.submitTaskBtn.disabled = true;
            if (DOM.taskLoadingSpinner) {
                DOM.taskLoadingSpinner.style.display = 'block';
            }
            const span = DOM.submitTaskBtn.querySelector('span');
            if (span) {
                span.textContent = '提交中...';
            }
        }
    } else {
        if (DOM.submitTaskBtn) {
            DOM.submitTaskBtn.disabled = false;
            if (DOM.taskLoadingSpinner) {
                DOM.taskLoadingSpinner.style.display = 'none';
            }
            const span = DOM.submitTaskBtn.querySelector('span');
            if (span) {
                span.textContent = '提交任务';
            }
        }
    }
}

// 渲染任务提交结果
function renderTaskResult(result) {
    // 清空容器
    DOM.resultContainer.innerHTML = '';
    
    // 确保result是一个对象
    if (!result || typeof result !== 'object') {
        DOM.resultContainer.innerHTML = '<div class="error-state">结果数据格式错误</div>';
        return;
    }
    
    // 创建任务提交结果卡片
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    resultCard.style.borderColor = '#3b82f6';
    
    // 结果头部
    const resultHeader = document.createElement('div');
    resultHeader.className = 'result-header';
    resultHeader.style.display = 'flex';
    resultHeader.style.alignItems = 'center';
    resultHeader.style.justifyContent = 'space-between';
    
    // 左侧：任务状态
    const leftSection = document.createElement('div');
    leftSection.style.display = 'flex';
    leftSection.style.alignItems = 'center';
    leftSection.style.gap = '1rem';
    
    // 任务状态
    const taskStatus = document.createElement('div');
    taskStatus.className = 'result-type';
    taskStatus.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    taskStatus.style.color = '#3b82f6';
    taskStatus.style.border = '1px solid #3b82f6';
    
    let statusHTML = `
        <span class="result-type-icon">
            ⏳
        </span>
        <span>${result.status || 'Pending'}</span>
    `;
    
    taskStatus.innerHTML = statusHTML;
    leftSection.appendChild(taskStatus);
    
    // 右侧：分析ID
    const rightSection = document.createElement('div');
    rightSection.style.display = 'flex';
    rightSection.style.alignItems = 'center';
    rightSection.style.gap = '1rem';
    
    // 分析ID标签
    if (result.analysis_id) {
        const analysisIdLabel = document.createElement('span');
        analysisIdLabel.style.fontSize = '0.9rem';
        analysisIdLabel.style.fontWeight = 'normal';
        analysisIdLabel.style.color = '#fff';
        analysisIdLabel.style.backgroundColor = '#666';
        analysisIdLabel.style.padding = '0.2rem 0.6rem';
        analysisIdLabel.style.borderRadius = '4px';
        analysisIdLabel.textContent = `分析ID: ${result.analysis_id}`;
        rightSection.appendChild(analysisIdLabel);
    }
    
    resultHeader.appendChild(leftSection);
    resultHeader.appendChild(rightSection);
    
    // 任务提交结果描述
    const resultDesc = document.createElement('div');
    resultDesc.className = 'result-desc';
    resultDesc.textContent = result.message || '任务提交成功，正在分析中...';
    resultDesc.style.marginBottom = '1rem';
    
    // 任务提交提示
    const taskHint = document.createElement('div');
    taskHint.className = 'result-details';
    taskHint.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">提示</span>
            <span class="detail-value">任务已提交，系统正在后台分析。分析完成后，可在告警运营页面查看结果。</span>
        </div>
    `;
    
    // 组装结果卡片
    resultCard.appendChild(resultHeader);
    resultCard.appendChild(resultDesc);
    resultCard.appendChild(taskHint);
    
    // 添加到容器
    DOM.resultContainer.appendChild(resultCard);
    
    // 滚动到结果
    DOM.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 调用反馈API
async function callFeedbackAPI(feedbackData) {
    const url = `${API_CONFIG.BASE_URL}/alert/feedback`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData),
        timeout: API_CONFIG.TIMEOUT,
        mode: 'cors'  // 允许跨域请求
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `反馈提交失败 (${response.status})`);
    }
    
    return await response.json();
}

// 调用提示词API
async function callPromptAPI(endpoint, method = 'GET', data = null) {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT
    };
    
    if (data) {
        if (method === 'GET') {
            // 对于 GET 请求，将数据作为查询参数添加到 URL 中
            const params = new URLSearchParams();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });
            const queryString = params.toString();
            if (queryString) {
                url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
            }
        } else {
            // 对于其他请求，将数据作为请求体发送
            options.body = JSON.stringify(data);
        }
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `提示词API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 获取提示词列表
async function fetchPromptList() {
    try {
        AppState.systemSettingsState.promptManagement.isLoading = true;
        
        // 清空容器
        if (DOM.promptContainer) {
            DOM.promptContainer.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
                    <div>加载中...</div>
                </div>
            `;
        }
        
        // 调用API获取提示词列表
        const response = await callPromptAPI('/prompt/template/list');
        
        if (response.code === 200 && Array.isArray(response.data)) {
            // 处理提示词数据，按prompt_template_key分组
            const promptMap = {};
            response.data.forEach(prompt => {
                if (!promptMap[prompt.prompt_template_key]) {
                    promptMap[prompt.prompt_template_key] = [];
                }
                promptMap[prompt.prompt_template_key].push(prompt);
            });
            
            // 转换为列表格式
            const promptListPromises = Object.values(promptMap).map(async (prompts) => {
                // 按版本号排序，取最新版本作为当前版本
                const sortedPrompts = prompts.sort((a, b) => b.version - a.version);
                const prompt_key = sortedPrompts[0].prompt_template_key;
                
                // 调用API获取版本数量
                try {
                    const countResponse = await callPromptAPI('/prompt/template/version/count', 'GET', { prompt_template_key: prompt_key });
                    const version_count = countResponse.data || 0;
                    
                    return {
                        prompt_key: prompt_key,
                        prompt_name: sortedPrompts[0].prompt_template_name,
                        current_version: sortedPrompts[0].version,
                        status: sortedPrompts[0].publish_status,
                        latest_prompt: sortedPrompts[0],
                        versions: sortedPrompts,
                        version_count: version_count
                    };
                } catch (error) {
                    console.error(`获取提示词模板 ${prompt_key} 版本数量失败:`, error);
                    // 失败时使用本地计算的数量
                    return {
                        prompt_key: prompt_key,
                        prompt_name: sortedPrompts[0].prompt_template_name,
                        current_version: sortedPrompts[0].version,
                        status: sortedPrompts[0].publish_status,
                        latest_prompt: sortedPrompts[0],
                        versions: sortedPrompts,
                        version_count: sortedPrompts.length
                    };
                }
            });
            
            // 并行获取所有版本数量
            const promptList = await Promise.all(promptListPromises);
            
            AppState.systemSettingsState.promptManagement.promptList = promptList;
            renderPromptList(promptList);
        } else {
            renderPromptList([]);
        }
    } catch (error) {
        console.error('获取提示词列表失败:', error);
        if (DOM.promptContainer) {
            DOM.promptContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <p>获取提示词列表失败: ${error.message}</p>
                </div>
            `;
        }
    } finally {
        AppState.systemSettingsState.promptManagement.isLoading = false;
    }
}

// 渲染提示词列表
function renderPromptList(promptList) {
    if (!DOM.promptContainer) return;
    
    // 清空容器
    DOM.promptContainer.innerHTML = '';
    
    if (promptList.length === 0) {
        DOM.promptContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>暂无提示词模板数据</p>
            </div>
        `;
        return;
    }
    
    // 创建提示词列表表格
    const table = document.createElement('table');
    table.className = 'history-list';
    
    // 表格头部
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th style="width: 40px;">展开</th>
            <th>模板Key</th>
            <th>模板名称</th>
            <th>版本数量</th>
            <th>当前版本</th>
            <th>发布状态</th>
            <th>创建时间</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 表格主体
    const tbody = document.createElement('tbody');
    
    promptList.forEach(item => {
        const tr = document.createElement('tr');
        
        // 展开按钮
        const expandTd = document.createElement('td');
        const expandBtn = document.createElement('button');
        expandBtn.className = 'btn btn-secondary';
        expandBtn.style.fontSize = '0.8rem';
        expandBtn.style.padding = '0.25rem 0.5rem';
        expandBtn.textContent = '▼';
        expandBtn.addEventListener('click', () => togglePromptHistory(item.prompt_key, expandBtn));
        expandTd.appendChild(expandBtn);
        tr.appendChild(expandTd);
        
        // 提示词Key
        const keyTd = document.createElement('td');
        keyTd.textContent = item.prompt_key;
        tr.appendChild(keyTd);
        
        // 提示词名称
        const nameTd = document.createElement('td');
        nameTd.textContent = item.prompt_name;
        tr.appendChild(nameTd);
        
        // 版本数量
        const versionCountTd = document.createElement('td');
        versionCountTd.textContent = item.version_count || 0;
        tr.appendChild(versionCountTd);
        
        // 当前版本
        const versionTd = document.createElement('td');
        versionTd.textContent = item.current_version;
        tr.appendChild(versionTd);
        
        // 状态
        const statusTd = document.createElement('td');
        const statusBadge = document.createElement('div');
        statusBadge.className = 'result-type';
        statusBadge.style.padding = '0.25rem 0.75rem';
        
        if (item.status === 'active') {
            statusBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            statusBadge.style.color = 'var(--success-color)';
            statusBadge.textContent = '已发布';
        } else {
            statusBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            statusBadge.style.color = 'var(--warning-color)';
            statusBadge.textContent = '草稿';
        }
        
        statusTd.appendChild(statusBadge);
        tr.appendChild(statusTd);
        
        // 创建时间
        const createTimeTd = document.createElement('td');
        if (item.latest_prompt && item.latest_prompt.created_timestamp) {
            createTimeTd.textContent = new Date(item.latest_prompt.created_timestamp).toLocaleString();
        } else {
            createTimeTd.textContent = '-';
        }
        tr.appendChild(createTimeTd);
        
        // 操作按钮
        const actionTd = document.createElement('td');
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        // 新建版本按钮
        const newVersionBtn = document.createElement('button');
        newVersionBtn.className = 'btn btn-secondary';
        newVersionBtn.style.fontSize = '0.8rem';
        newVersionBtn.style.padding = '0.25rem 0.5rem';
        newVersionBtn.style.marginRight = '0.5rem';
        newVersionBtn.textContent = '新建版本';
        newVersionBtn.addEventListener('click', () => editPrompt(item.latest_prompt));
        actionButtons.appendChild(newVersionBtn);
        
        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.style.fontSize = '0.8rem';
        deleteBtn.style.padding = '0.25rem 0.5rem';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => deletePrompt(item.prompt_key));
        actionButtons.appendChild(deleteBtn);
        
        actionTd.appendChild(actionButtons);
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
        
        // 添加历史版本行（默认隐藏）
        const historyTr = document.createElement('tr');
        historyTr.id = `history-${item.prompt_key}`;
        historyTr.style.display = 'none';
        historyTr.style.backgroundColor = 'var(--surface-color)';
        
        const historyTd = document.createElement('td');
        historyTd.colSpan = 8;
        historyTd.style.padding = '1rem';
        
        const historyContainer = document.createElement('div');
        historyContainer.id = `history-container-${item.prompt_key}`;
        historyContainer.innerHTML = '加载中...';
        
        historyTd.appendChild(historyContainer);
        historyTr.appendChild(historyTd);
        
        tbody.appendChild(historyTr);
    });
    
    table.appendChild(tbody);
    
    // 添加表格到容器
    DOM.promptContainer.appendChild(table);
}

// 切换提示词历史版本
function togglePromptHistory(promptKey, button) {
    const historyTr = document.getElementById(`history-${promptKey}`);
    if (!historyTr) return;
    
    if (historyTr.style.display === 'none') {
        // 显示历史版本
        historyTr.style.display = 'table-row';
        button.textContent = '▲';
        
        // 加载历史版本数据
        loadPromptHistory(promptKey);
    } else {
        // 隐藏历史版本
        historyTr.style.display = 'none';
        button.textContent = '▼';
    }
}

// 加载提示词历史版本
async function loadPromptHistory(promptKey) {
    const historyContainer = document.getElementById(`history-container-${promptKey}`);
    if (!historyContainer) return;
    
    try {
        // 调用API获取提示词历史版本
        const response = await callPromptAPI('/prompt/template/list');
        
        if (response.code === 200 && Array.isArray(response.data)) {
            // 筛选当前提示词的版本
            const promptVersions = response.data
                .filter(prompt => prompt.prompt_template_key === promptKey)
                .sort((a, b) => b.version - a.version);
            
            // 渲染历史版本
            let historyHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
                    <thead>
                        <tr style="background-color: var(--primary-color); color: white;">
                            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">版本</th>
                            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">创建时间</th>
                            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">创建人</th>
                            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">状态</th>
                            <th style="padding: 0.5rem; text-align: left; border: 1px solid #ddd;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            promptVersions.forEach(version => {
                historyHTML += `
                    <tr>
                        <td style="padding: 0.5rem; border: 1px solid #ddd;">${version.version}</td>
                        <td style="padding: 0.5rem; border: 1px solid #ddd;">${new Date(version.created_at).toLocaleString()}</td>
                        <td style="padding: 0.5rem; border: 1px solid #ddd;">${version.created_by || 'admin'}</td>
                        <td style="padding: 0.5rem; border: 1px solid #ddd;">
                            <span style="
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                font-size: 0.8rem;
                                ${version.publish_status === 'active' ? 
                                    'background-color: rgba(16, 185, 129, 0.1); color: var(--success-color);' : 
                                    'background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color);'}
                            ">
                                ${version.publish_status === 'active' ? '已发布' : '草稿'}
                            </span>
                        </td>
                        <td style="padding: 0.5rem; border: 1px solid #ddd;">
                            <button class="btn btn-secondary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; margin-right: 0.25rem;" onclick="viewPromptDetail('${version.id}')">查看详情</button>
                            ${version.publish_status !== 'active' ? 
                                `<button class="btn btn-primary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="publishPrompt('${version.id}')">发布</button>` : 
                                ''}
                        </td>
                    </tr>
                `;
            });
            
            historyHTML += `
                    </tbody>
                </table>
            `;
            
            historyContainer.innerHTML = historyHTML;
        } else {
            historyContainer.innerHTML = '<p>暂无历史版本数据</p>';
        }
    } catch (error) {
        console.error('加载提示词历史版本失败:', error);
        historyContainer.innerHTML = `<p>加载失败: ${error.message}</p>`;
    }
}

// 查看提示词版本
function viewPromptVersions(promptKey) {
    // 实现查看提示词版本逻辑
}

// 打开创建提示词模态框
function openCreatePromptModal() {
    createPrompt();
}

// 创建提示词
function createPrompt() {
    openModal('创建提示词模板', `
        <form id="createPromptForm" class="feedback-form">
            <div class="form-section">
                <label for="createPromptKey">模板Key</label>
                <input type="text" id="createPromptKey" class="form-input" required style="background-color: var(--surface-color);">
            </div>
            <div class="form-section">
                <label for="createPromptName">模板名称</label>
                <input type="text" id="createPromptName" class="form-input" required style="background-color: var(--surface-color);">
            </div>
            <div class="form-section">
                <label for="createPromptDescription">功能描述</label>
                <textarea id="createPromptDescription" class="form-textarea" rows="3" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptSystemMessage">系统角色提示词</label>
                <textarea id="createPromptSystemMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptUserMessage">用户角色提示词</label>
                <textarea id="createPromptUserMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptAssistantMessage">助手角色提示词</label>
                <textarea id="createPromptAssistantMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="button-group" style="margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">确认</button>
            </div>
        </form>
    `);
    
    // 添加表单提交事件
    setTimeout(() => {
        const form = document.getElementById('createPromptForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const prompt_template_key = document.getElementById('createPromptKey').value;
                    const prompt_template_name = document.getElementById('createPromptName').value;
                    const description = document.getElementById('createPromptDescription').value;
                    const system_message = document.getElementById('createPromptSystemMessage').value;
                    const user_message = document.getElementById('createPromptUserMessage').value;
                    const assistant_message = document.getElementById('createPromptAssistantMessage').value;
                    
                    // 验证必填参数
                    if (!prompt_template_key) {
                        alert('请输入模板Key');
                        return;
                    }
                    if (!prompt_template_name) {
                        alert('请输入模板名称');
                        return;
                    }
                    if (!system_message) {
                        alert('请输入系统角色提示词');
                        return;
                    }
                    if (!user_message) {
                        alert('请输入用户角色提示词');
                        return;
                    }
                    
                    // 调用API创建提示词
                    const response = await callPromptAPI('/prompt/template', 'POST', {
                        prompt_template_key: prompt_template_key,
                        prompt_template_name: prompt_template_name,
                        description: description,
                        system_message: system_message,
                        user_message: user_message,
                        assistant_message: assistant_message,
                        publish_status: 'draft', // 创建时默认为草稿状态
                        created_by: 'admin'
                    });
                    
                    if (response.code === 200) {
                        alert('提示词创建成功！');
                        closeModal();
                        fetchPromptList();
                    } else {
                        throw new Error(response.message || '创建失败');
                    }
                } catch (error) {
                    console.error('创建提示词模板失败:', error);
                    alert('创建提示词模板失败: ' + error.message);
                }
            });
        }
    }, 100);
}

// 编辑提示词
function editPrompt(prompt) {
    openModal('编辑提示词模板', `
        <form id="editPromptForm" class="feedback-form">
            <input type="hidden" id="editPromptId" value="${prompt.id}">
            <input type="hidden" id="editPromptKey" value="${prompt.prompt_template_key}">
            <input type="hidden" id="editPromptVersion" value="${prompt.version}">
            <div class="form-section">
                <label for="editPromptName">模板名称</label>
                <input type="text" id="editPromptName" class="form-input" value="${prompt.prompt_template_name}" required style="background-color: var(--surface-color);">
            </div>
            <div class="form-section">
                <label for="editPromptDescription">功能描述</label>
                <textarea id="editPromptDescription" class="form-textarea" rows="3" style="background-color: var(--surface-color);">${prompt.description || ''}</textarea>
            </div>
            <div class="form-section">
                <label for="editPromptSystemMessage">系统角色提示词</label>
                <textarea id="editPromptSystemMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);">${prompt.system_message}</textarea>
            </div>
            <div class="form-section">
                <label for="editPromptUserMessage">用户角色提示词</label>
                <textarea id="editPromptUserMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);">${prompt.user_message}</textarea>
            </div>
            <div class="form-section">
                <label for="editPromptAssistantMessage">助手角色提示词</label>
                <textarea id="editPromptAssistantMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);">${prompt.assistant_message || ''}</textarea>
            </div>
            <div class="button-group" style="margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存新版本</button>
            </div>
        </form>
    `);
    
    // 添加表单提交事件
    setTimeout(() => {
        const form = document.getElementById('editPromptForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const id = document.getElementById('editPromptId').value;
                    const prompt_template_key = document.getElementById('editPromptKey').value;
                    const version = parseInt(document.getElementById('editPromptVersion').value);
                    const prompt_template_name = document.getElementById('editPromptName').value;
                    const description = document.getElementById('editPromptDescription').value;
                    const system_message = document.getElementById('editPromptSystemMessage').value;
                    const user_message = document.getElementById('editPromptUserMessage').value;
                    const assistant_message = document.getElementById('editPromptAssistantMessage').value;
                    
                    // 验证必填参数
                    if (!prompt_template_name) {
                        alert('请输入模板名称');
                        return;
                    }
                    if (!system_message) {
                        alert('请输入系统角色提示词');
                        return;
                    }
                    if (!user_message) {
                        alert('请输入用户角色提示词');
                        return;
                    }
                    
                    // 调用API更新提示词
                    const response = await callPromptAPI('/prompt/template', 'PUT', {
                        id: id,
                        prompt_template_key: prompt_template_key,
                        prompt_template_name: prompt_template_name,
                        description: description,
                        system_message: system_message,
                        user_message: user_message,
                        assistant_message: assistant_message,
                        version: version + 1, // 版本号+1
                        publish_status: 'draft', // 默认为草稿状态
                        created_by: 'admin'
                    });
                    
                    if (response.code === 200) {
                        alert('提示词更新成功！');
                        closeModal();
                        fetchPromptList();
                    } else {
                        throw new Error(response.message || '更新失败');
                    }
                } catch (error) {
                    console.error('更新提示词模板失败:', error);
                    alert('更新提示词模板失败: ' + error.message);
                }
            });
        }
    }, 100);
}

// 查看提示词详情
function viewPromptDetail(promptId) {
    // 实现查看提示词详情逻辑
    alert('查看提示词详情功能待实现');
}

// 发布提示词
function publishPrompt(promptId) {
    // 实现发布提示词逻辑
    alert('发布提示词功能待实现');
}

// 切换提示词状态
async function togglePromptStatus(prompt) {
    const newStatus = prompt.publish_status === 'published' ? 'draft' : 'published';
    
    if (newStatus === 'published') {
        // 开启时需要输入发版备注
        openModal('开启提示词', `
            <form id="publishPromptForm" class="feedback-form">
                <input type="hidden" id="publishPromptId" value="${prompt.id}">
                <div class="form-section">
                    <label for="publishRemark">发版备注</label>
                    <textarea id="publishRemark" class="form-textarea" rows="3" required></textarea>
                </div>
                <div class="button-group">
                    <button type="submit" class="btn btn-primary">确认开启</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </form>
        `);
        
        // 添加表单提交事件
        setTimeout(() => {
            const form = document.getElementById('publishPromptForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    try {
                        const id = document.getElementById('publishPromptId').value;
                        const remark = document.getElementById('publishRemark').value;
                        
                        // 调用API更新状态
                        const response = await callPromptAPI('/prompt/template/status', 'PUT', {
                            id: id,
                            publish_status: 'active',
                            remark: remark
                        });
                        
                        if (response.code === 200) {
                            alert('提示词发布成功！');
                            closeModal();
                            fetchPromptList();
                        } else {
                            throw new Error(response.message || '发布失败');
                        }
                    } catch (error) {
                        console.error('发布提示词失败:', error);
                        alert('发布提示词失败: ' + error.message);
                    }
                });
            }
        }, 100);
    } else {
        // 直接关闭
        if (confirm('确定要将此提示词设置为草稿状态吗？')) {
            try {
                // 调用API更新状态
                const response = await callPromptAPI('/prompt/template/status', 'PUT', {
                    id: prompt.id,
                    publish_status: 'draft'
                });
                
                if (response.code === 200) {
                    alert('提示词已设置为草稿状态！');
                    fetchPromptList();
                } else {
                    throw new Error(response.message || '操作失败');
                }
            } catch (error) {
                console.error('更新提示词状态失败:', error);
                alert('更新提示词状态失败: ' + error.message);
            }
        }
    }
}

// 回滚提示词
async function rollbackPrompt(promptKey, version) {
    if (confirm(`确定要将提示词 ${promptKey} 回滚到版本 ${version} 吗？`)) {
        try {
            // 调用API回滚提示词
            const response = await callPromptAPI('/prompt/template/rollback', 'PUT', {
                prompt_template_key: promptKey,
                version: version
            });
            
            if (response.code === 200) {
                alert('提示词回滚成功！');
                fetchPromptList();
            } else {
                throw new Error(response.message || '回滚失败');
            }
        } catch (error) {
            console.error('回滚提示词失败:', error);
            alert('回滚提示词失败: ' + error.message);
        }
    }
}

// 查看提示词
function viewPrompt(prompt) {
    openModal('提示词详情', `
        <div class="form-section">
            <label>模板Key</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">${prompt.prompt_template_key}</div>
        </div>
        <div class="form-section">
            <label>模板名称</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">${prompt.prompt_template_name}</div>
        </div>
        <div class="form-section">
            <label>版本</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">${prompt.version}</div>
        </div>
        <div class="form-section">
            <label>状态</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">
                <span style="
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    ${prompt.publish_status === 'active' ? 
                        'background-color: rgba(16, 185, 129, 0.1); color: var(--success-color);' : 
                        'background-color: rgba(245, 158, 11, 0.1); color: var(--warning-color);'}
                ">
                    ${prompt.publish_status === 'active' ? '已发布' : '草稿'}
                </span>
            </div>
        </div>
        <div class="form-section">
            <label>创建时间</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">${new Date(prompt.created_at).toLocaleString()}</div>
        </div>
        <div class="form-section">
            <label>创建人</label>
            <div class="form-input" style="background-color: var(--surface-color); padding: 0.5rem;">${prompt.created_by || 'admin'}</div>
        </div>
        <div class="form-section">
            <label>功能描述</label>
            <div class="form-textarea" style="background-color: var(--surface-color); padding: 0.5rem; min-height: 80px;">${prompt.description || '无'}</div>
        </div>
        <div class="form-section">
            <label>系统角色提示词</label>
            <div class="form-textarea" style="background-color: var(--surface-color); padding: 0.5rem; min-height: 120px;">${prompt.system_message}</div>
        </div>
        <div class="form-section">
            <label>用户角色提示词</label>
            <div class="form-textarea" style="background-color: var(--surface-color); padding: 0.5rem; min-height: 120px;">${prompt.user_message}</div>
        </div>
        <div class="form-section">
            <label>助手角色提示词</label>
            <div class="form-textarea" style="background-color: var(--surface-color); padding: 0.5rem; min-height: 120px;">${prompt.assistant_message || '无'}</div>
        </div>
        <div class="button-group" style="margin-top: 2rem;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">关闭</button>
        </div>
    `);
}

// 查看提示词历史
function viewPromptHistory() {
    // 实现查看提示词历史逻辑
    alert('查看提示词历史功能待实现');
}

// 删除提示词模板
async function deletePrompt(promptKey) {
    if (!confirm(`确定要删除提示词模板 ${promptKey} 吗？`)) {
        return;
    }
    
    try {
        // 调用API删除提示词模板
        const response = await fetch(`${API_CONFIG.BASE_URL}/prompt/template`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt_key: promptKey })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `删除失败 (${response.status})`);
        }
        
        const result = await response.json();
        if (result.code === 200) {
            alert('删除提示词模板成功！');
            // 重新加载提示词列表
            fetchPromptList();
        } else {
            throw new Error(result.message || '删除失败');
        }
    } catch (error) {
        console.error('删除提示词模板失败:', error);
        alert('删除提示词模板失败: ' + error.message);
    }
}

// 知识检索相关函数

// 处理检索类型切换
function handleRetrievalTypeChange() {
    const retrievalType = DOM.retrievalType.value;
    if (retrievalType === 'keyword') {
        DOM.keywordGroup.style.display = 'block';
        DOM.analysisUIDGroup.style.display = 'none';
    } else {
        DOM.keywordGroup.style.display = 'none';
        DOM.analysisUIDGroup.style.display = 'block';
    }
}

// 处理知识检索表单提交
async function handleKnowledgeRetrievalSubmit(e) {
    e.preventDefault();
    
    try {
        // 获取表单数据
        const queryExpr = (DOM.queryExpr.value || '').trim();
        const retrievalType = DOM.retrievalType.value;
        const similarKeyword = (DOM.similarKeyword.value || '').trim();
        const analysisUID = (DOM.analysisUID.value || '').trim();
        const topK = parseInt(DOM.topK.value) || 10;
        const scoreThreshold = parseFloat(DOM.scoreThreshold.value) || 0.5;
        const metricType = DOM.metricType.value || 'COSINE';
        const page = 1; // 默认页码
        const pageSize = 10; // 默认每页大小
        
        // 验证表单数据
        if (retrievalType === 'analysisUID' && !analysisUID) {
            alert('请输入Analysis UID');
            return;
        }
        
        // 更新状态
        AppState.knowledgeFeedbackState.knowledgeRetrieval.currentPage = page;
        AppState.knowledgeFeedbackState.knowledgeRetrieval.pageSize = pageSize;
        AppState.knowledgeFeedbackState.knowledgeRetrieval.currentFilter = {
            retrievalType,
            queryExpr,
            similarKeyword,
            analysisUID,
            topK,
            scoreThreshold,
            metricType
        };
        
        // 执行检索
        await fetchRetrievalResult();
    } catch (error) {
        console.error('知识检索失败:', error);
        alert('知识检索失败: ' + error.message);
    }
}

// 获取检索结果
async function fetchRetrievalResult() {
    const state = AppState.knowledgeFeedbackState.knowledgeRetrieval;
    const filter = state.currentFilter;
    
    // 设置加载状态
    state.isLoading = true;
    renderRetrievalResult();
    
    try {
        let url, data;
        
        if (filter.retrievalType === 'keyword') {
            // 使用关键词检索
            url = `${API_CONFIG.BASE_URL}/vector/search`;
            data = {
                page: state.currentPage,
                page_size: state.pageSize,
                query_expr: filter.queryExpr,
                similar_keyword: filter.similarKeyword,
                top_k: filter.topK,
                score_threshold: filter.scoreThreshold,
                metric_type: filter.metricType
            };
        } else {
            // 使用AnalysisUID检索
            url = `${API_CONFIG.BASE_URL}/vector/search/analysis`;
            data = {
                page: state.currentPage,
                page_size: state.pageSize,
                analysis_uid: filter.analysisUID,
                top_k: filter.topK,
                score_threshold: filter.scoreThreshold,
                metric_type: filter.metricType
            };
        }
        
        // 调用API
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            timeout: API_CONFIG.TIMEOUT
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API调用失败 (${response.status})`);
        }
        
        const result = await response.json();
        
        if (result.code === 200) {
            state.retrievalResult = result.data || [];
            state.totalItems = result.total || 0;
            state.totalPages = Math.ceil(state.totalItems / state.pageSize);
        } else {
            throw new Error(result.message || '检索失败');
        }
    } catch (error) {
        console.error('获取检索结果失败:', error);
        state.retrievalResult = [];
        state.totalItems = 0;
        state.totalPages = 0;
        alert('获取检索结果失败: ' + error.message);
    } finally {
        state.isLoading = false;
        renderRetrievalResult();
    }
}

// 渲染检索结果
function renderRetrievalResult() {
    const state = AppState.knowledgeFeedbackState.knowledgeRetrieval;
    const container = DOM.retrievalResult;
    const pagination = DOM.retrievalPagination;
    
    // 清空容器
    container.innerHTML = '';
    
    if (state.isLoading) {
        // 显示加载状态
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在检索中...</p>
            </div>
        `;
        pagination.style.display = 'none';
        return;
    }
    
    if (state.retrievalResult.length === 0) {
        // 显示空状态
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>未找到匹配的结果</p>
            </div>
        `;
        pagination.style.display = 'none';
        return;
    }
    
    // 创建结果表格
    const table = document.createElement('table');
    table.className = 'retrieval-result-list';
    
    // 表格头部
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>创建时间</th>
            <th>analysis_id</th>
            <th>milvus_vector_id</th>
            <th>content</th>
            <th>score</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 表格主体
    const tbody = document.createElement('tbody');
    
    state.retrievalResult.forEach(item => {
        const tr = document.createElement('tr');
        
        // 创建时间
        const timeTd = document.createElement('td');
        timeTd.textContent = formatDateTime(item.created_at);
        tr.appendChild(timeTd);
        
        // analysis_id
        const analysisTd = document.createElement('td');
        analysisTd.textContent = item.analysis_id || '-';
        tr.appendChild(analysisTd);
        
        // milvus_vector_id
        const vectorTd = document.createElement('td');
        vectorTd.textContent = item.milvus_vector_id || '-';
        tr.appendChild(vectorTd);
        
        // content
        const contentTd = document.createElement('td');
        const contentPreview = document.createElement('div');
        contentPreview.className = 'content-preview';
        contentPreview.textContent = item.content || '-';
        contentTd.appendChild(contentPreview);
        tr.appendChild(contentTd);
        
        // score
        const scoreTd = document.createElement('td');
        const scoreTag = document.createElement('div');
        scoreTag.className = `score-tag ${getScoreTagClass(item.score)}`;
        scoreTag.textContent = item.score.toFixed(2);
        scoreTd.appendChild(scoreTag);
        tr.appendChild(scoreTd);
        
        // 操作
        const actionTd = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.textContent = '查看元数据';
        viewBtn.addEventListener('click', () => viewMetadata(item));
        actionTd.appendChild(viewBtn);
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // 更新分页控件
    updateRetrievalPagination();
    pagination.style.display = 'flex';
}

// 根据分数获取标签类名
function getScoreTagClass(score) {
    if (score >= 0.8) {
        return 'high';
    } else if (score >= 0.5) {
        return 'medium';
    } else {
        return 'low';
    }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        return '-';
    }
}

// 查看元数据
function viewMetadata(item) {
    openMetadataDrawer(item);
}

// 打开元数据抽屉
function openMetadataDrawer(item) {
    // 创建元数据抽屉元素（如果不存在）
    if (!DOM.metadataDrawer) {
        const drawer = document.createElement('div');
        drawer.id = 'metadataDrawer';
        drawer.className = 'drawer';
        
        const overlay = document.createElement('div');
        overlay.id = 'metadataOverlay';
        overlay.className = 'drawer-overlay';
        
        drawer.innerHTML = `
            <div class="drawer-header">
                <h3>元数据详情</h3>
                <div class="drawer-header-actions">
                    <button id="metadataClose" class="drawer-close">×</button>
                </div>
            </div>
            <div id="metadataContent" class="drawer-content metadata-content">
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
        
        // 重新初始化DOM元素
        DOM.metadataDrawer = drawer;
        DOM.metadataOverlay = overlay;
        DOM.metadataClose = drawer.querySelector('#metadataClose');
        DOM.metadataContent = drawer.querySelector('#metadataContent');
        
        // 添加事件监听器
        DOM.metadataClose.addEventListener('click', closeMetadataDrawer);
        DOM.metadataOverlay.addEventListener('click', closeMetadataDrawer);
    }
    
    // 填充元数据内容
    if (DOM.metadataContent) {
        let content = '';
        
        // 添加基本信息
        content += `
            <div class="metadata-item">
                <div class="metadata-label">创建时间</div>
                <div class="metadata-value">${formatDateTime(item.created_at)}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">analysis_id</div>
                <div class="metadata-value">${item.analysis_id || '-'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">milvus_vector_id</div>
                <div class="metadata-value">${item.milvus_vector_id || '-'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">score</div>
                <div class="metadata-value">${item.score ? item.score.toFixed(2) : '-'}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">content</div>
                <div class="metadata-value"><pre>${item.content || '-'}</pre></div>
            </div>
        `;
        
        // 添加metadata字段（如果存在）
        if (item.metadata) {
            content += `
                <div class="metadata-item">
                    <div class="metadata-label">metadata</div>
                    <div class="metadata-value"><pre>${JSON.stringify(item.metadata, null, 2)}</pre></div>
                </div>
            `;
        }
        
        DOM.metadataContent.innerHTML = content;
    }
    
    // 显示抽屉
    if (DOM.metadataOverlay) {
        DOM.metadataOverlay.classList.add('active');
    }
    if (DOM.metadataDrawer) {
        DOM.metadataDrawer.classList.add('active');
    }
}

// 关闭元数据抽屉
function closeMetadataDrawer() {
    if (DOM.metadataOverlay) {
        DOM.metadataOverlay.classList.remove('active');
    }
    if (DOM.metadataDrawer) {
        DOM.metadataDrawer.classList.remove('active');
    }
}

// 更新知识检索分页控件
function updateRetrievalPagination() {
    const state = AppState.knowledgeFeedbackState.knowledgeRetrieval;
    
    if (DOM.retrievalPrevPage) {
        DOM.retrievalPrevPage.disabled = state.currentPage === 1;
    }
    if (DOM.retrievalNextPage) {
        DOM.retrievalNextPage.disabled = state.currentPage >= state.totalPages;
    }
    if (DOM.retrievalPageInfo) {
        DOM.retrievalPageInfo.textContent = `第 ${state.currentPage} 页，共 ${state.totalPages} 页`;
    }
}

// 切换提示词状态
function togglePromptStatus(prompt) {
    const newStatus = prompt.publish_status === 'published' ? 'draft' : 'published';
    
    if (newStatus === 'published') {
        // 开启时需要输入发版备注
        openModal('开启提示词', `
            <form id="publishPromptForm" class="feedback-form">
                <input type="hidden" id="publishPromptId" value="${prompt.id}">
                <div class="form-section">
                    <label for="publishRemark">发版备注</label>
                    <textarea id="publishRemark" class="form-textarea" rows="3" required></textarea>
                </div>
                <div class="button-group">
                    <button type="submit" class="btn btn-primary">确认开启</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                </div>
            </form>
        `);
        
        // 添加表单提交事件
        setTimeout(() => {
            const form = document.getElementById('publishPromptForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    try {
                        const id = document.getElementById('publishPromptId').value;
                        const remark = document.getElementById('publishRemark').value;
                        
                        // 调用API更新状态
                        const response = await callPromptAPI('/prompt/template/status', 'PUT', {
                            id: id,
                            publish_status: newStatus,
                            updated_by: 'admin'
                        });
                        
                        if (response.code === 200) {
                            alert('提示词开启成功！');
                            closeModal();
                            fetchPromptList();
                        } else {
                            throw new Error(response.message || '开启失败');
                        }
                    } catch (error) {
                        console.error('开启提示词失败:', error);
                        alert('开启提示词失败: ' + error.message);
                    }
                });
            }
        }, 100);
    } else {
        // 直接禁用
        if (confirm('确定要禁用这个提示词吗？')) {
            callPromptAPI('/prompt/template/status', 'PUT', {
                id: prompt.id,
                publish_status: newStatus,
                updated_by: 'admin'
            }).then(response => {
                if (response.code === 200) {
                    alert('提示词禁用成功！');
                    fetchPromptList();
                } else {
                    throw new Error(response.message || '禁用失败');
                }
            }).catch(error => {
                console.error('禁用提示词失败:', error);
                alert('禁用提示词失败: ' + error.message);
            });
        }
    }
}

// 切换提示词历史版本显示
function togglePromptHistory(promptKey, expandBtn) {
    const historyTr = document.getElementById(`history-${promptKey}`);
    const historyContainer = document.getElementById(`history-container-${promptKey}`);
    
    if (historyTr.style.display === 'none') {
        // 显示历史版本
        historyTr.style.display = '';
        expandBtn.textContent = '▲';
        
        // 加载历史版本数据
        callPromptAPI(`/prompt/template`, 'GET', { prompt_template_key: promptKey }).then(response => {
            if (response.code === 200 && Array.isArray(response.data)) {
                // 按版本号排序
                const sortedVersions = response.data.sort((a, b) => b.version - a.version);
                
                // 创建历史版本列表
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                
                // 表格头部
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                headerRow.style.borderBottom = '1px solid var(--border-color)';
                
                const headers = ['版本号', '模板名称', '描述', '发布状态', '创建时间', '操作'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.style.textAlign = 'left';
                    th.textContent = headerText;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // 表格主体
                const tbody = document.createElement('tbody');
                
                sortedVersions.forEach(version => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid var(--border-color)';
                    
                    // 版本号
                    const versionTd = document.createElement('td');
                    versionTd.style.padding = '0.5rem';
                    versionTd.textContent = version.version;
                    tr.appendChild(versionTd);
                    
                    // 模板名称
                    const nameTd = document.createElement('td');
                    nameTd.style.padding = '0.5rem';
                    nameTd.textContent = version.prompt_template_name;
                    tr.appendChild(nameTd);
                    
                    // 描述
                    const descTd = document.createElement('td');
                    descTd.style.padding = '0.5rem';
                    descTd.textContent = version.description || '无';
                    tr.appendChild(descTd);
                    
                    // 发布状态
                    const statusTd = document.createElement('td');
                    statusTd.style.padding = '0.5rem';
                    const statusBadge = document.createElement('div');
                    statusBadge.className = 'result-type';
                    statusBadge.style.padding = '0.25rem 0.75rem';
                    statusBadge.style.fontSize = '0.8rem';
                    statusBadge.style.borderRadius = '4px';
                    
                    if (version.publish_status === 'active') {
                        statusBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        statusBadge.style.color = 'var(--success-color)';
                        statusBadge.textContent = '已发布';
                    } else {
                        statusBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                        statusBadge.style.color = 'var(--warning-color)';
                        statusBadge.textContent = '草稿';
                    }
                    
                    statusTd.appendChild(statusBadge);
                    tr.appendChild(statusTd);
                    
                    // 创建时间
                    const createTd = document.createElement('td');
                    createTd.style.padding = '0.5rem';
                    createTd.textContent = new Date(version.created_timestamp).toLocaleString();
                    tr.appendChild(createTd);
                    
                    // 操作
                    const actionTd = document.createElement('td');
                    actionTd.style.padding = '0.5rem';
                    
                    const actionDiv = document.createElement('div');
                    actionDiv.style.display = 'flex';
                    actionDiv.style.alignItems = 'center';
                    
                    // 查看按钮
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'btn btn-secondary';
                    viewBtn.style.fontSize = '0.8rem';
                    viewBtn.style.padding = '0.25rem 0.5rem';
                    viewBtn.style.marginRight = '0.5rem';
                    viewBtn.textContent = '查看';
                    viewBtn.addEventListener('click', () => viewPrompt(version));
                    actionDiv.appendChild(viewBtn);
                    
                    // 回滚按钮
                    const rollbackBtn = document.createElement('button');
                    rollbackBtn.className = 'btn btn-secondary';
                    rollbackBtn.style.fontSize = '0.8rem';
                    rollbackBtn.style.padding = '0.25rem 0.5rem';
                    rollbackBtn.textContent = '回滚';
                    rollbackBtn.addEventListener('click', () => rollbackPrompt(version.prompt_template_key, version.version));
                    actionDiv.appendChild(rollbackBtn);
                    
                    actionTd.appendChild(actionDiv);
                    tr.appendChild(actionTd);
                    
                    tbody.appendChild(tr);
                });
                
                table.appendChild(tbody);
                historyContainer.innerHTML = '';
                historyContainer.appendChild(table);
            } else {
                historyContainer.innerHTML = '加载历史版本失败';
            }
        }).catch(error => {
            console.error('加载历史版本失败:', error);
            historyContainer.innerHTML = '加载历史版本失败: ' + error.message;
        });
    } else {
        // 隐藏历史版本
        historyTr.style.display = 'none';
        expandBtn.textContent = '▼';
    }
}

// 回滚提示词到指定版本
function rollbackPrompt(promptKey, version) {
    if (confirm(`确定要回滚提示词 ${promptKey} 到版本 ${version} 吗？`)) {
        callPromptAPI('/prompt/template/rollback', 'PUT', {
            prompt_key: promptKey,
            version: version,
            updated_by: 'admin'
        }).then(response => {
            if (response.code === 200) {
                alert('提示词回滚成功！');
                fetchPromptList();
            } else {
                throw new Error(response.message || '回滚失败');
            }
        }).catch(error => {
            console.error('回滚提示词失败:', error);
            alert('回滚提示词失败: ' + error.message);
        });
    }
}

// 查看提示词详情
function viewPrompt(prompt) {
    // 如果 prompt 是字符串，尝试解析为对象
    if (typeof prompt === 'string') {
        try {
            prompt = JSON.parse(prompt);
        } catch (e) {
            console.error('解析提示词数据失败:', e);
            return;
        }
    }
    
    // 调整抽屉宽度
    DOM.drawer.style.width = '800px';
    
    // 构建HTML内容
    const htmlContent = `
        <div class="prompt-editor-container">
            <input type="hidden" id="editPromptId" value="${prompt.id}">
            <input type="hidden" id="editPromptKey" value="${prompt.prompt_template_key}">
            
            <!-- 版本信息 -->
            <div style="margin-top: 0rem; padding: 1rem; background-color: var(--surface-color); border-radius: var(--border-radius);">
                <h4 style="margin-top: 0; margin-bottom: 0.5rem;">版本信息</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted);">模板Key</label>
                        <div style="margin-top: 0.25rem;">${prompt.prompt_template_key}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted);">版本号</label>
                        <div style="margin-top: 0.25rem;">${prompt.version}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted);">状态</label>
                        <div style="margin-top: 0.25rem;">${prompt.publish_status === 'active' ? '已发布' : '草稿'}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted);">创建时间</label>
                        <div style="margin-top: 0.25rem;">${new Date(prompt.created_timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--text-muted);">更新时间</label>
                        <div style="margin-top: 0.25rem;">${new Date(prompt.updated_timestamp).toLocaleString()}</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 1rem;">
                <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                        <label for="editPromptName" style="font-size: 14px; font-weight: 600; white-space: nowrap;">模板名称</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="font-size: 14px; flex: 1; min-width: 0; box-sizing: border-box; padding: 0.5rem; background-color: var(--surface-color); border-radius: var(--border-radius);">${prompt.prompt_template_name}</div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <label for="editPromptDescription" style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 0.5rem;">版本描述</label>
                    <div style="padding: 0.5rem; background-color: var(--surface-color); border-radius: var(--border-radius);">${prompt.description || '无'}</div>
                </div>
            </div>
            
            <!-- 标签页导航 -->
            <div class="tab-navigation">
                <button class="tab-btn active" data-tab="system-tab">系统角色提示词</button>
                <button class="tab-btn" data-tab="user-tab">用户角色提示词</button>
                <button class="tab-btn" data-tab="assistant-tab">助手角色提示词</button>
            </div>
            
            <!-- 标签页内容 -->
            <div class="tab-content">
                <!-- 系统角色提示词标签页 -->
                <div id="system-tab" class="tab-pane active">
                    <div class="form-textarea prompt-textarea" style="background-color: var(--surface-color); white-space: pre-wrap; font-family: monospace; padding: 1rem;"></div>
                </div>
                
                <!-- 用户角色提示词标签页 -->
                <div id="user-tab" class="tab-pane">
                    <div class="form-textarea prompt-textarea" style="background-color: var(--surface-color); white-space: pre-wrap; font-family: monospace; padding: 1rem;"></div>
                </div>
                
                <!-- 助手角色提示词标签页 -->
                <div id="assistant-tab" class="tab-pane">
                    <div class="form-textarea prompt-textarea" style="background-color: var(--surface-color); white-space: pre-wrap; font-family: monospace; padding: 1rem;"></div>
                </div>
            </div>
        </div>
        
        <style>
            /* 调整抽屉样式 */
            .drawer {
                width: 800px !important;
            }
            
            .prompt-editor-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 1rem;
            }
            
            .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .editor-title {
                display: flex;
                align-items: center;
            }
            
            .header-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            /* 标签页样式 */
            .tab-navigation {
                display: flex;
                gap: 0.5rem;
                border-bottom: 1px solid var(--border-color);
                margin-bottom: 1rem;
            }
            
            .tab-btn {
                padding: 0.75rem 1.5rem;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .tab-btn:hover {
                background-color: var(--surface-color);
            }
            
            .tab-btn.active {
                border-bottom-color: var(--primary-color);
                color: var(--primary-color);
                font-weight: 600;
            }
            
            .tab-content {
                flex: 1;
                min-height: 400px;
            }
            
            .tab-pane {
                display: none;
                height: 100%;
            }
            
            .tab-pane.active {
                display: block;
            }
            
            /* 提示词文本域样式 */
            .prompt-textarea {
                width: 100%;
                height: 400px;
                padding: 1rem;
                font-size: 14px;
                line-height: 1.5;
                resize: none;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                box-sizing: border-box;
                font-family: Menlo, Consolas, monospace;
                background-color: #f8f8f8;
                color: #333;
                tab-size: 4;
                overflow-y: auto;
            }
        </style>
    `;
    
    openDrawer('提示词详情', htmlContent, false);
    
    // 为标签页按钮添加点击事件监听器
    setTimeout(() => {
        const tabButtons = DOM.drawerContent.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                if (tabId) {
                    // 隐藏所有标签页内容
                    document.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('active');
                    });
                    
                    // 移除所有标签按钮的活动状态
                    document.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // 显示选中的标签页内容
                    const targetTab = document.getElementById(tabId);
                    if (targetTab) {
                        targetTab.classList.add('active');
                    }
                    
                    // 激活选中的标签按钮
                    this.classList.add('active');
                }
            });
        });
        
        // 设置提示词内容，使用textContent确保不解析任何语法和语言
        const systemTab = document.getElementById('system-tab');
        if (systemTab) {
            const systemContent = systemTab.querySelector('.prompt-textarea');
            if (systemContent) {
                systemContent.textContent = prompt.system_message || '无';
            }
        }
        
        const userTab = document.getElementById('user-tab');
        if (userTab) {
            const userContent = userTab.querySelector('.prompt-textarea');
            if (userContent) {
                userContent.textContent = prompt.user_message || '无';
            }
        }
        
        const assistantTab = document.getElementById('assistant-tab');
        if (assistantTab) {
            const assistantContent = assistantTab.querySelector('.prompt-textarea');
            if (assistantContent) {
                assistantContent.textContent = prompt.assistant_message || '无';
            }
        }
    }, 100);
}

// 编辑提示词
function editPrompt(prompt) {
    // 存储prompt数据到全局变量，供保存和发布函数使用
    window.currentPrompt = prompt;
    
    // 调整抽屉宽度
    DOM.drawer.style.width = '800px';
    
    // 构建HTML内容
    const htmlContent = `
        <div class="prompt-editor-container">
            <input type="hidden" id="editPromptId" value="${prompt.id}">
            <input type="hidden" id="editPromptKey" value="${prompt.prompt_template_key}">
            
            <div style="margin-top: 0rem;">
                <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                        <label for="editPromptName" style="font-size: 14px; font-weight: 600; white-space: nowrap;">模板名称</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="text" id="editPromptName" class="form-input" value="${prompt.prompt_template_name}" required style="font-size: 14px; flex: 1; min-width: 0; box-sizing: border-box;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0; margin-top: 1.7rem;">
                        <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="window.savePromptDraft()">保存</button>
                        <button class="btn btn-primary" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="window.saveAndPublishPrompt()">保存并发布</button>
                    </div>
                </div>
                
                <div class="form-section">
                    <label for="editPromptDescription" style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 0.5rem;">版本描述</label>
                    <textarea id="editPromptDescription" class="form-input" rows="3" style="background-color: var(--surface-color); width: 100%;">${prompt.description || ''}</textarea>
                </div>
            </div>
            
            <!-- 标签页导航 -->
            <div class="tab-navigation">
                <button class="tab-btn active" data-tab="system-tab">系统角色提示词</button>
                <button class="tab-btn" data-tab="user-tab">用户角色提示词</button>
                <button class="tab-btn" data-tab="assistant-tab">助手角色提示词</button>
            </div>
            
            <!-- 标签页内容 -->
            <div class="tab-content">
                <!-- 系统角色提示词标签页 -->
                <div id="system-tab" class="tab-pane active">
                    <textarea id="editPromptSystemMessage" class="form-textarea prompt-textarea" style="background-color: var(--surface-color);"></textarea>
                </div>
                
                <!-- 用户角色提示词标签页 -->
                <div id="user-tab" class="tab-pane">
                    <textarea id="editPromptUserMessage" class="form-textarea prompt-textarea" style="background-color: var(--surface-color);"></textarea>
                </div>
                
                <!-- 助手角色提示词标签页 -->
                <div id="assistant-tab" class="tab-pane">
                    <textarea id="editPromptAssistantMessage" class="form-textarea prompt-textarea" style="background-color: var(--surface-color);"></textarea>
                </div>
            </div>
        </div>
        
        <style>
            /* 调整抽屉样式 */
            .drawer {
                width: 800px !important;
            }
            
            .prompt-editor-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 1rem;
            }
            
            .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .editor-title {
                display: flex;
                align-items: center;
            }
            
            .header-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            /* 标签页样式 */
            .tab-navigation {
                display: flex;
                gap: 0.5rem;
                border-bottom: 1px solid var(--border-color);
                margin-bottom: 1rem;
            }
            
            .tab-btn {
                padding: 0.75rem 1.5rem;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .tab-btn:hover {
                background-color: var(--surface-color);
            }
            
            .tab-btn.active {
                border-bottom-color: var(--primary-color);
                color: var(--primary-color);
                font-weight: 600;
            }
            
            .tab-content {
                flex: 1;
                min-height: 400px;
            }
            
            .tab-pane {
                display: none;
                height: 100%;
            }
            
            .tab-pane.active {
                display: block;
            }
            
            /* 提示词文本域样式 */
            .prompt-textarea {
                width: 100%;
                height: 400px;
                padding: 1rem;
                font-size: 14px;
                line-height: 1.5;
                resize: none;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                box-sizing: border-box;
                font-family: Menlo, Consolas, monospace;
                background-color: #f8f8f8;
                color: #333;
                tab-size: 4;
            }
            
            /* Markdown 语法高亮模拟 */
            .prompt-textarea::placeholder {
                color: #999;
            }
            
            /* 为了支持Markdown语法高亮，我们需要使用contenteditable div而不是textarea */
            .markdown-editor {
                width: 100%;
                height: 400px;
                padding: 1rem;
                font-size: 14px;
                line-height: 1.5;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                box-sizing: border-box;
                font-family: Menlo, Consolas, monospace;
                background-color: #f8f8f8;
                color: #333;
                tab-size: 4;
                overflow-y: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            
            /* 基本的Markdown语法高亮样式 */
            .markdown-editor strong {
                font-weight: bold;
                color: #333;
            }
            
            .markdown-editor em {
                font-style: italic;
                color: #666;
            }
            
            .markdown-editor code {
                background-color: #f1f1f1;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: Menlo, Consolas, monospace;
                font-size: 0.9em;
                color: #d73a49;
            }
            
            .markdown-editor pre {
                background-color: #f1f1f1;
                padding: 1rem;
                border-radius: var(--border-radius);
                overflow-x: auto;
                margin: 1rem 0;
            }
            
            .markdown-editor blockquote {
                border-left: 4px solid var(--primary-color);
                padding-left: 1rem;
                margin: 1rem 0;
                color: #666;
                font-style: italic;
            }
            
            .markdown-editor h1,
            .markdown-editor h2,
            .markdown-editor h3,
            .markdown-editor h4,
            .markdown-editor h5,
            .markdown-editor h6 {
                margin: 1rem 0;
                font-weight: bold;
                color: #24292e;
            }
            
            .markdown-editor h1 {
                font-size: 1.5em;
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            
            .markdown-editor h2 {
                font-size: 1.25em;
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            
            .markdown-editor h3 {
                font-size: 1.1em;
            }
            
            .markdown-editor ul,
            .markdown-editor ol {
                margin: 1rem 0;
                padding-left: 2rem;
            }
            
            .markdown-editor li {
                margin: 0.5rem 0;
            }
            
            .markdown-editor a {
                color: #0366d6;
                text-decoration: none;
            }
            
            .markdown-editor a:hover {
                text-decoration: underline;
            }
        </style>
        
        <script>
            // 简单的Markdown语法高亮模拟
            function highlightMarkdown(element) {
                if (!element) return;
                
                let text = element.value;
                
                // 这里只是一个简单的示例，实际的Markdown语法高亮需要更复杂的实现
                // 由于我们使用的是textarea，无法直接实现语法高亮
                // 真正的语法高亮需要使用contenteditable div或专门的编辑器库
            }
            
            // 为所有文本域添加输入事件监听
            document.addEventListener('DOMContentLoaded', function() {
                const textareas = document.querySelectorAll('.prompt-textarea');
                textareas.forEach(textarea => {
                    textarea.addEventListener('input', function() {
                        highlightMarkdown(this);
                    });
                });
            });
        </script>
    `;
    
    // 直接设置抽屉内容，不使用Markdown解析
    DOM.drawerContent.innerHTML = htmlContent;
    
    // 控制重新加载按钮的显示/隐藏
    if (DOM.drawerRefresh) {
        DOM.drawerRefresh.style.display = 'none';
    }
    
    // 移除drawer-header中的按钮（如果存在）
    if (DOM.drawer) {
        const drawerHeader = DOM.drawer.querySelector('.drawer-header');
        if (drawerHeader) {
            // 移除之前添加的按钮容器
            const existingButtonContainer = drawerHeader.querySelector('div[style*="display: flex"]');
            if (existingButtonContainer) {
                existingButtonContainer.remove();
            }
            
            // 恢复drawer-header的默认样式
            drawerHeader.style.display = '';
            drawerHeader.style.justifyContent = '';
            drawerHeader.style.alignItems = '';
        }
    }
    

    
    // 保存为草稿
    window.savePromptDraft = async function() {
        try {
            const prompt_template_key = document.getElementById('editPromptKey').value;
            const prompt_template_name = document.getElementById('editPromptName').value;
            const description = document.getElementById('editPromptDescription').value;
            const system_message = document.getElementById('editPromptSystemMessage').value;
            const assistant_message = document.getElementById('editPromptAssistantMessage').value;
            const user_message = document.getElementById('editPromptUserMessage').value;
            
            // 验证必填参数
            if (!prompt_template_key) {
                alert('请输入模板Key');
                return;
            }
            if (!prompt_template_name) {
                alert('请输入模板名称');
                return;
            }
            if (!system_message) {
                alert('请输入系统角色提示词');
                return;
            }
            if (!user_message) {
                alert('请输入用户角色提示词');
                return;
            }
            
            // 打印调试信息
            console.log('Saving prompt draft:', {
                prompt_template_key: prompt_template_key,
                prompt_template_name: prompt_template_name,
                description: description,
                system_message: system_message,
                assistant_message: assistant_message,
                user_message: user_message,
                publish_status: 'draft'
            });
            
            // 调用API更新提示词
            const response = await callPromptAPI('/prompt/template', 'PUT', {
                prompt_key: prompt_template_key,
                prompt_name: prompt_template_name,
                prompt_template_key: prompt_template_key,
                prompt_template_name: prompt_template_name,
                description: description,
                system_message: system_message,
                assistant_message: assistant_message,
                user_message: user_message,
                publish_status: 'draft',
                updated_by: 'admin'
            });
            
            if (response.code === 200) {
                // 关闭抽屉
                closeDrawer();
                
                // 重新加载提示词列表
                fetchPromptList();
                
                // 显示成功提示
                alert('提示词保存成功！');
            } else {
                throw new Error(response.message || '保存失败');
            }
        } catch (error) {
            console.error('保存提示词失败:', error);
            alert('保存失败: ' + error.message);
        }
    };
    
    // 保存并发布
    window.saveAndPublishPrompt = async function() {
        try {
            const prompt_template_key = document.getElementById('editPromptKey').value;
            const prompt_template_name = document.getElementById('editPromptName').value;
            const description = document.getElementById('editPromptDescription').value;
            const system_message = document.getElementById('editPromptSystemMessage').value;
            const assistant_message = document.getElementById('editPromptAssistantMessage').value;
            const user_message = document.getElementById('editPromptUserMessage').value;
            
            // 验证必填参数
            if (!prompt_template_key) {
                alert('请输入模板Key');
                return;
            }
            if (!prompt_template_name) {
                alert('请输入模板名称');
                return;
            }
            if (!system_message) {
                alert('请输入系统角色提示词');
                return;
            }
            if (!user_message) {
                alert('请输入用户角色提示词');
                return;
            }
            
            // 打印调试信息
            console.log('Saving and publishing prompt:', {
                prompt_template_key: prompt_template_key,
                prompt_template_name: prompt_template_name,
                description: description,
                system_message: system_message,
                assistant_message: assistant_message,
                user_message: user_message,
                publish_status: 'active'
            });
            
            // 调用API更新提示词
            const updateResponse = await callPromptAPI('/prompt/template', 'PUT', {
                prompt_key: prompt_template_key,
                prompt_name: prompt_template_name,
                prompt_template_key: prompt_template_key,
                prompt_template_name: prompt_template_name,
                description: description,
                system_message: system_message,
                assistant_message: assistant_message,
                user_message: user_message,
                publish_status: 'active',
                updated_by: 'admin'
            });
            
            if (updateResponse.code === 200) {
                // 关闭抽屉
                closeDrawer();
                
                // 重新加载提示词列表
                fetchPromptList();
                
                // 显示成功提示
                alert('提示词发布成功！');
            } else {
                throw new Error(updateResponse.message || '保存失败');
            }
        } catch (error) {
            console.error('保存并发布提示词失败:', error);
            alert('发布失败: ' + error.message);
        }
    };
    
    // 为标签页按钮添加点击事件监听器
    setTimeout(() => {
        const tabButtons = DOM.drawerContent.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                if (tabId) {
                    // 隐藏所有标签页内容
                    document.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('active');
                    });
                    
                    // 移除所有标签按钮的活动状态
                    document.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // 显示选中的标签页内容
                    const targetTab = document.getElementById(tabId);
                    if (targetTab) {
                        targetTab.classList.add('active');
                    }
                    
                    // 激活选中的标签按钮
                    this.classList.add('active');
                }
            });
        });
        
        // 设置提示词内容，使用textContent确保不解析任何语法和语言
        const systemMessageTextarea = document.getElementById('editPromptSystemMessage');
        if (systemMessageTextarea) {
            systemMessageTextarea.textContent = prompt.system_message || '';
        }
        
        const userMessageTextarea = document.getElementById('editPromptUserMessage');
        if (userMessageTextarea) {
            userMessageTextarea.textContent = prompt.user_message || '';
        }
        
        const assistantMessageTextarea = document.getElementById('editPromptAssistantMessage');
        if (assistantMessageTextarea) {
            assistantMessageTextarea.textContent = prompt.assistant_message || '';
        }
    }, 100);
    
    // 显示抽屉
    DOM.drawerOverlay.classList.add('active');
    DOM.drawer.classList.add('active');
    
    // 聚焦到抽屉内容
    DOM.drawerContent.focus();
}

// 查看提示词历史版本
function viewPromptHistory() {
    openDrawer('提示词历史版本', `
        <div style="padding: 1rem;">
            <h3>所有提示词历史版本</h3>
            <div id="historyContainer" style="margin-top: 1rem;">
                加载中...
            </div>
        </div>
    `, false);
    
    // 加载历史版本数据
    setTimeout(async () => {
        try {
            const response = await callPromptAPI(`/prompt/template/list`);
            
            if (response.code === 200 && Array.isArray(response.data)) {
                const historyContainer = document.getElementById('historyContainer');
                if (historyContainer) {
                    // 展示所有条目，按版本号排序
                    const sortedVersions = response.data.sort((a, b) => b.version - a.version);
                    
                    // 创建历史版本列表
                    const table = document.createElement('table');
                    table.className = 'history-list';
                    
                    // 表格头部
                    const thead = document.createElement('thead');
                    thead.innerHTML = `
                        <tr>
                            <th>版本号</th>
                            <th>模板名称</th>
                            <th>描述</th>
                            <th>发布状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    `;
                    table.appendChild(thead);
                    
                    // 表格主体
                    const tbody = document.createElement('tbody');
                    
                    sortedVersions.forEach(version => {
                        const tr = document.createElement('tr');
                        
                        // 版本号
                        const versionTd = document.createElement('td');
                        versionTd.textContent = version.version;
                        tr.appendChild(versionTd);
                        
                        // 模板名称
                        const nameTd = document.createElement('td');
                        nameTd.textContent = version.prompt_template_name;
                        tr.appendChild(nameTd);
                        
                        // 描述
                        const descTd = document.createElement('td');
                        descTd.textContent = version.description || '无';
                        tr.appendChild(descTd);
                        
                        // 状态
                        const statusTd = document.createElement('td');
                        const statusBadge = document.createElement('div');
                        statusBadge.className = 'result-type';
                        statusBadge.style.padding = '0.25rem 0.5rem';
                        statusBadge.style.fontSize = '0.8rem';
                        
                        if (version.publish_status === 'active') {
                            statusBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                            statusBadge.style.color = 'var(--success-color)';
                            statusBadge.textContent = '已发布';
                        } else {
                            statusBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                            statusBadge.style.color = 'var(--warning-color)';
                            statusBadge.textContent = '草稿';
                        }
                        
                        statusTd.appendChild(statusBadge);
                        tr.appendChild(statusTd);
                        
                        // 创建时间
                        const createTd = document.createElement('td');
                        createTd.textContent = new Date(version.created_timestamp).toLocaleString();
                        tr.appendChild(createTd);
                        

                        
                        // 操作按钮
                        const actionTd = document.createElement('td');
                        const actionButtons = document.createElement('div');
                        actionButtons.className = 'action-buttons';
                        
                        // 查看按钮
                        const viewBtn = document.createElement('button');
                        viewBtn.className = 'btn btn-secondary';
                        viewBtn.style.fontSize = '0.7rem';
                        viewBtn.style.padding = '0.25rem 0.5rem';
                        viewBtn.textContent = '查看';
                        viewBtn.addEventListener('click', () => viewPrompt(version));
                        actionButtons.appendChild(viewBtn);
                        
                        // 回滚按钮
                        const rollbackBtn = document.createElement('button');
                        rollbackBtn.className = 'btn btn-secondary';
                        rollbackBtn.style.fontSize = '0.7rem';
                        rollbackBtn.style.padding = '0.25rem 0.5rem';
                        rollbackBtn.textContent = '回滚';
                        rollbackBtn.addEventListener('click', async () => {
                            if (confirm('确定要回滚到这个版本吗？')) {
                                try {
                                    const response = await callPromptAPI('/prompt/template/rollback', 'PUT', {
                                        prompt_key: version.prompt_template_key,
                                        version: version.version,
                                        updated_by: 'admin'
                                    });
                                    
                                    if (response.code === 200) {
                                        alert('回滚成功！');
                                        closeDrawer();
                                        fetchPromptList();
                                    } else {
                                        throw new Error(response.message || '回滚失败');
                                    }
                                } catch (error) {
                                    alert('回滚失败: ' + error.message);
                                }
                            }
                        });
                        actionButtons.appendChild(rollbackBtn);
                        
                        actionTd.appendChild(actionButtons);
                        tr.appendChild(actionTd);
                        
                        tbody.appendChild(tr);
                    });
                    
                    table.appendChild(tbody);
                    historyContainer.innerHTML = '';
                    historyContainer.appendChild(table);
                }
            }
        } catch (error) {
            const historyContainer = document.getElementById('historyContainer');
            if (historyContainer) {
                historyContainer.innerHTML = '<div style="color: var(--danger-color);">加载失败: ' + error.message + '</div>';
            }
        }
    }, 100);
}

// 打开创建提示词弹框
function openCreatePromptModal() {
    openDrawer('新建提示词模板', `
        <form id="createPromptForm" class="feedback-form">
            <div class="form-section">
                <label for="createPromptKey">模板Key</label>
                <input type="text" id="createPromptKey" class="form-input" required style="background-color: var(--surface-color);">
            </div>
            <div class="form-section">
                <label for="createPromptName">模板名称</label>
                <input type="text" id="createPromptName" class="form-input" required style="background-color: var(--surface-color);">
            </div>
            <div class="form-section">
                <label for="createPromptDescription">功能描述</label>
                <textarea id="createPromptDescription" class="form-textarea" rows="3" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptSystemMessage">系统角色提示词</label>
                <textarea id="createPromptSystemMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptUserMessage">用户角色提示词</label>
                <textarea id="createPromptUserMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="form-section">
                <label for="createPromptAssistantMessage">助手角色提示词</label>
                <textarea id="createPromptAssistantMessage" class="form-textarea" rows="8" style="background-color: var(--surface-color);"></textarea>
            </div>
            <div class="button-group" style="margin-top: 2rem;">
                <button type="button" class="btn btn-secondary" onclick="closeDrawer()">取消</button>
                <button type="submit" class="btn btn-primary">确认</button>
            </div>
        </form>
    `, false);
    
    // 添加表单提交事件
    setTimeout(() => {
        const form = document.getElementById('createPromptForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const prompt_key = document.getElementById('createPromptKey').value;
                    const prompt_name = document.getElementById('createPromptName').value;
                    const description = document.getElementById('createPromptDescription').value;
                    const system_message = document.getElementById('createPromptSystemMessage').value;
                    const user_message = document.getElementById('createPromptUserMessage').value;
                    const assistant_message = document.getElementById('createPromptAssistantMessage').value;
                    
                    // 调用API创建提示词
                    const response = await callPromptAPI('/prompt/template', 'POST', {
                        prompt_key: prompt_key,
                        prompt_name: prompt_name,
                        description: description,
                        system_message: system_message,
                        user_message: user_message,
                        assistant_message: assistant_message,
                        created_by: 'admin'
                    });
                    
                    if (response.code === 200) {
                        // 关闭弹框
                        closeModal();
                        
                        // 重新加载提示词列表
                        fetchPromptList();
                        
                        // 显示成功提示
                        alert('提示词创建成功！');
                    } else {
                        throw new Error(response.message || '创建失败');
                    }
                } catch (error) {
                    alert('创建失败: ' + error.message);
                }
            });
        }
    }, 100);
}

// 调用告警运营记录API
async function callHistoryAPI(filter) {
    const url = `${API_CONFIG.BASE_URL}/alert/analysis/result/list`;
    
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', filter.page || AppState.historyState.currentPage);
    params.append('page_size', filter.page_size || AppState.historyState.pageSize);
    
    if (filter.source) {
        params.append('source', filter.source);
    }
    if (filter.result_type) {
        params.append('result_type', filter.result_type);
    }
    if (filter.start_time) {
        params.append('start_time', filter.start_time);
    }
    if (filter.end_time) {
        params.append('end_time', filter.end_time);
    }
    
    const fullUrl = `${url}?${params.toString()}`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT
        // 使用默认的mode: 'same-origin'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 调用告警运营记录详情API
async function callHistoryDetailAPI(analysisId) {
    const url = `${API_CONFIG.BASE_URL}/alert/analysis/result/${analysisId}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT,
        mode: 'cors'  // 允许跨域请求
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 设置加载状态
function setLoading(isLoading) {
    AppState.isLoading = isLoading;
    
    if (isLoading) {
        if (DOM.submitBtn) {
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.textContent = '分析中...';
        }
        if (DOM.loadingSpinner) {
            DOM.loadingSpinner.style.display = 'block';
        }
    } else {
        if (DOM.submitBtn) {
            DOM.submitBtn.disabled = false;
            DOM.submitBtn.textContent = '开始分析';
        }
        if (DOM.loadingSpinner) {
            DOM.loadingSpinner.style.display = 'none';
        }
    }
}

// 渲染结果
function renderResult(result) {
    // 清空容器
    DOM.resultContainer.innerHTML = '';
    
    // 确保result是一个对象
    if (!result || typeof result !== 'object') {
        DOM.resultContainer.innerHTML = '<div class="error-state">结果数据格式错误</div>';
        return;
    }
    
    // 映射结果数据，确保使用正确的字段名
    const mappedResult = {
        // 基本信息
        alert_uuid: result.alert_uuid || result.AlertUUID,
        alert_name: result.alert_name || result.AlertName,
        alert_description: result.alert_description || result.AlertDescription,
        alert_category: result.alert_category || result.AlertCategory,
        alert_source: result.alert_source || result.AlertSource,
        alert_severity: result.alert_severity || result.AlertSeverity,
        alert_event_timestamp: result.alert_event_timestamp || result.AlertEventTimestamp,
        
        // 分析结果
        analysis_id: result.analysis_id || result.AnalysisID,
        analysis_start_time: result.analysis_start_time || result.AnalysisStartTime,
        analysis_end_time: result.analysis_end_time || result.AnalysisEndTime,
        analysis_result_type: result.analysis_result_type || result.AnalysisResultType,
        analysis_result_desc: result.analysis_result_desc || result.AnalysisResultDesc,
        analysis_disposal_suggestion: result.analysis_disposal_suggestion || result.AnalysisDisposalSuggestion,
        analysis_deep_detail: result.analysis_deep_detail || result.AnalysisDeepDetail,
        analysis_related_iocs: result.analysis_related_iocs || result.AnalysisRelatedIOCs,
        analysis_confidence: result.analysis_confidence || result.AnalysisConfidence,
        analysis_evidence_chain: result.analysis_evidence_chain || result.AnalysisEvidenceChain,
        
        // 其他数据
        raw_data_alert: result.raw_data_alert || result.RawDataAlert,
        raw_data_general_alert_model: result.raw_data_general_alert_model || result.RawDataGeneralAlertModel,
        tools_result: result.tools_result || result.ToolsResult,
        tools_required_list: result.tools_required_list || result.ToolsRequiredList,
        knowledge_base_results: result.knowledge_base_results || result.KnowledgeBaseResults,
        
        // 前端添加的数据
        analysis_time: result.analysis_time
    };
    
    // 创建结果卡片
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    // 结果头部
    const resultHeader = document.createElement('div');
    resultHeader.className = 'result-header';
    resultHeader.style.display = 'flex';
    resultHeader.style.alignItems = 'center';
    resultHeader.style.justifyContent = 'space-between';
    
    // 左侧：结果类型和置信度
    const leftSection = document.createElement('div');
    leftSection.style.display = 'flex';
    leftSection.style.alignItems = 'center';
    leftSection.style.gap = '1rem';
    
    // 结果类型
    const resultType = document.createElement('div');
    resultType.className = `result-type ${mappedResult.analysis_result_type ? mappedResult.analysis_result_type.replace('_', '-') : ''}`;
    
    let resultTypeHTML = `
        <span class="result-type-icon">
            ${getResultTypeIcon(mappedResult.analysis_result_type)}
        </span>
        <span>${getResultTypeLabel(mappedResult.analysis_result_type)}</span>
    `;
    
    resultType.innerHTML = resultTypeHTML;
    leftSection.appendChild(resultType);
    
    // 置信度
    const confidence = document.createElement('div');
    confidence.className = 'result-confidence';
    confidence.textContent = `置信度: ${Math.round((mappedResult.analysis_confidence || 0) * 100)}%`;
    leftSection.appendChild(confidence);
    
    // 右侧：耗时、反馈按钮和导出按钮
    const rightSection = document.createElement('div');
    rightSection.style.display = 'flex';
    rightSection.style.alignItems = 'center';
    rightSection.style.gap = '1rem';
    

    
    // 评估反馈按钮
    const feedbackBtn = document.createElement('button');
    feedbackBtn.className = 'btn btn-secondary';
    feedbackBtn.style.fontSize = '0.9rem';
    feedbackBtn.style.padding = '0.3rem 0.8rem';
    feedbackBtn.innerHTML = '评估反馈';
    feedbackBtn.title = '对本次分析结果提供评估反馈';
    feedbackBtn.addEventListener('click', () => {
        openFeedbackDrawer(mappedResult);
    });
    rightSection.appendChild(feedbackBtn);
    
    // 导出报告按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-primary';
    exportBtn.style.fontSize = '0.9rem';
    exportBtn.style.padding = '0.3rem 0.8rem';
    exportBtn.innerHTML = '导出报告';
    exportBtn.title = '导出为Markdown格式，需要使用Markdown渲染工具查看完整格式';
    exportBtn.addEventListener('click', () => {
        exportReport(mappedResult);
    });
    rightSection.appendChild(exportBtn);
    
    resultHeader.appendChild(leftSection);
    resultHeader.appendChild(rightSection);
    
    // 结果描述
    const resultDesc = document.createElement('div');
    resultDesc.className = 'result-desc';
    resultDesc.textContent = mappedResult.analysis_result_desc || '无描述';
    resultDesc.style.marginBottom = '1rem';
    
    // 结果详情
    const resultDetails = document.createElement('div');
    resultDetails.className = 'result-details';
    
    // 创建按钮容器
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '1rem';
    buttonsContainer.style.marginBottom = '1.5rem';
    
    // 查看完整分析按钮
    if (mappedResult.analysis_deep_detail) {
        const viewDetailsBtn = document.createElement('button');
        viewDetailsBtn.className = 'btn btn-secondary';
        viewDetailsBtn.textContent = '查看完整分析';
        viewDetailsBtn.addEventListener('click', () => {
            openDrawer('详细分析', mappedResult.analysis_deep_detail);
        });
        buttonsContainer.appendChild(viewDetailsBtn);
    }
    
    // 添加查看通用告警模型结果按钮
    if (mappedResult.raw_data_general_alert_model) {
        const alertModelBtn = document.createElement('button');
        alertModelBtn.className = 'btn btn-secondary';
        alertModelBtn.textContent = '查看通用告警模型结果';
        alertModelBtn.addEventListener('click', () => {
            openDrawer('通用告警模型结果', formatAlertModelResult(mappedResult.raw_data_general_alert_model));
        });
        buttonsContainer.appendChild(alertModelBtn);
    }
    
    // 添加查看工具结果按钮
    if (mappedResult.tools_result) {
        const toolResultBtn = document.createElement('button');
        toolResultBtn.className = 'btn btn-secondary';
        toolResultBtn.textContent = '查看工具结果';
        toolResultBtn.addEventListener('click', () => {
            openDrawer('工具执行结果', formatToolResult(mappedResult.tools_result));
        });
        buttonsContainer.appendChild(toolResultBtn);
    }
    
    // 事件发生时间
    if (mappedResult.alert_event_timestamp) {
        resultDetails.appendChild(createDetailItem('事件时间', mappedResult.alert_event_timestamp));
    }
    
    // 攻击类型
    if (mappedResult.alert_category) {
        resultDetails.appendChild(createDetailItem('攻击类型', mappedResult.alert_category));
    }
    
    // 严重程度
    if (mappedResult.alert_severity) {
        resultDetails.appendChild(createDetailItem('严重程度', mappedResult.alert_severity));
    }
    
    // 建议措施 - 支持Markdown格式
    if (mappedResult.analysis_disposal_suggestion) {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'detail-item';
        
        const actionLabel = document.createElement('span');
        actionLabel.className = 'detail-label';
        actionLabel.textContent = '建议措施';
        
        const actionValue = document.createElement('div');
        actionValue.className = 'detail-value markdown-content';
        try {
            actionValue.innerHTML = marked.parse(mappedResult.analysis_disposal_suggestion);
        } catch (error) {
            actionValue.textContent = mappedResult.analysis_disposal_suggestion;
        }
        
        actionContainer.appendChild(actionLabel);
        actionContainer.appendChild(actionValue);
        resultDetails.appendChild(actionContainer);
    }
    
    // 相关IOCs
    if (mappedResult.analysis_related_iocs && Array.isArray(mappedResult.analysis_related_iocs) && mappedResult.analysis_related_iocs.length > 0) {
        const iocsElement = createDetailItem('相关IOCs', '');
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags';
        
        mappedResult.analysis_related_iocs.forEach(ioc => {
            if (ioc) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = ioc;
                tagsContainer.appendChild(tag);
            }
        });
        
        iocsElement.appendChild(tagsContainer);
        resultDetails.appendChild(iocsElement);
    }
    
    // 反馈表单
    const feedbackForm = createFeedbackForm(mappedResult);
    
    // 组装结果卡片
    resultCard.appendChild(resultHeader);
    resultCard.appendChild(resultDesc);
    resultCard.appendChild(resultDetails);
    resultCard.appendChild(buttonsContainer);
    resultCard.appendChild(feedbackForm);
    
    // 添加到容器
    DOM.resultContainer.appendChild(resultCard);
    
    // 滚动到结果
    DOM.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 创建详情项
function createDetailItem(label, value) {
    const detailItem = document.createElement('div');
    detailItem.className = 'detail-item';
    
    const detailLabel = document.createElement('span');
    detailLabel.className = 'detail-label';
    detailLabel.textContent = label;
    
    const detailValue = document.createElement('span');
    detailValue.className = 'detail-value';
    detailValue.textContent = value;
    
    detailItem.appendChild(detailLabel);
    detailItem.appendChild(detailValue);
    
    return detailItem;
}

// 创建反馈表单
function createFeedbackForm(result) {
    const form = document.createElement('div');
    form.className = 'feedback-form';
    
    const title = document.createElement('div');
    title.className = 'feedback-title';
    title.textContent = '反馈与评价';
    
    const options = document.createElement('div');
    options.className = 'feedback-options';
    
    const feedbackOptions = [
        { type: 'correct', emoji: '👍', label: '完全正确', rating: 5 },
        { type: 'partial', emoji: '😐', label: '部分正确', rating: 3 },
        { type: 'incorrect', emoji: '👎', label: '完全错误', rating: 1 }
    ];
    
    feedbackOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'feedback-option';
        optionElement.innerHTML = `
            <div class="emoji">${option.emoji}</div>
            <div class="label">${option.label}</div>
        `;
        optionElement.dataset.type = option.type;
        optionElement.dataset.rating = option.rating;
        
        optionElement.addEventListener('click', () => {
            // 移除其他选项的选中状态
            options.querySelectorAll('.feedback-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // 添加当前选项的选中状态
            optionElement.classList.add('selected');
        });
        
        options.appendChild(optionElement);
    });
    
    const textarea = document.createElement('textarea');
    textarea.className = 'feedback-textarea';
    textarea.placeholder = '请输入您的详细反馈...';
    
    const error = document.createElement('div');
    error.className = 'feedback-error';
    error.style.display = 'none';
    
    const success = document.createElement('div');
    success.className = 'feedback-success';
    success.innerHTML = '<span>✅</span> 感谢您的反馈，我们会不断改进服务！';
    success.style.display = 'none';
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = '提交反馈';
    
    submitBtn.addEventListener('click', async () => {
        try {
            const selectedOption = options.querySelector('.feedback-option.selected');
            if (!selectedOption) {
                error.textContent = '请选择反馈类型';
                error.style.display = 'block';
                return;
            }
            
            const feedbackDescription = textarea.value.trim();
            if (!feedbackDescription) {
                error.textContent = '请输入详细反馈';
                error.style.display = 'block';
                return;
            }
            
            error.style.display = 'none';
            success.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            const feedbackData = {
                analysis_id: result.AnalysisID || result.analysis_id || '',
                feedback_type: selectedOption.dataset.type,
                feedback_description: feedbackDescription,
                rating: parseInt(selectedOption.dataset.rating),
                original_alert_data: AppState.originalAlertData,
                original_analysis_result: {
                    result_type: result.AnalysisResultType || result.analysis_result_type || '',
                    result_desc: result.AnalysisResultDesc || result.analysis_result_desc || '',
                    confidence: result.AnalysisConfidence || result.analysis_confidence || 0,
                    details: {
                        detailed_analysis: result.AnalysisDeepDetail || result.analysis_deep_detail || '',
                        attack_type: result.AlertCategory || result.alert_category || '',
                        recommended_action: result.AnalysisDisposalSuggestion || result.analysis_disposal_suggestion || ''
                    },
                    general_alert_model_result: result.RawDataGeneralAlertModel || result.raw_data_general_alert_model || null
                },
                user_id: 'anonymous'
            };
            
            await callFeedbackAPI(feedbackData);
            
            success.style.display = 'block';
            
            // 重置表单
            options.querySelectorAll('.feedback-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            textarea.value = '';
            
        } catch (err) {
            error.textContent = err.message;
            error.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '提交反馈';
        }
    });
    
    form.appendChild(title);
    form.appendChild(options);
    form.appendChild(textarea);
    form.appendChild(error);
    form.appendChild(success);
    form.appendChild(submitBtn);
    
    return form;
}

// 打开抽屉
function openDrawer(title, content, parseMarkdown = true) {
    DOM.drawerTitle.textContent = title;
    
    // 渲染内容
    if (content) {
        let html;
        if (parseMarkdown) {
            // 渲染Markdown内容
            html = marked.parse(content);
        } else {
            // 直接使用HTML内容
            html = content;
        }
        DOM.drawerContent.innerHTML = html;
    } else {
        DOM.drawerContent.innerHTML = '<p>暂无内容</p>';
    }
    
    // 控制重新加载按钮的显示/隐藏
    if (DOM.drawerRefresh) {
        if (title === '研判流程') {
            DOM.drawerRefresh.style.display = 'block';
        } else {
            DOM.drawerRefresh.style.display = 'none';
        }
    }
    
    // 显示抽屉
    DOM.drawerOverlay.classList.add('active');
    DOM.drawer.classList.add('active');
    
    // 聚焦到抽屉内容
    DOM.drawerContent.focus();
}

// 关闭抽屉
function closeDrawer() {
    DOM.drawerOverlay.classList.remove('active');
    DOM.drawer.classList.remove('active');
}

// 打开弹框
function openModal(title, content) {
    console.log('Opening modal...');
    console.log('Modal overlay:', DOM.modalOverlay);
    console.log('Modal:', DOM.modal);
    console.log('Modal title:', DOM.modalTitle);
    console.log('Modal content:', DOM.modalContent);
    
    if (DOM.modalTitle) {
        DOM.modalTitle.textContent = title;
    }
    
    if (DOM.modalContent) {
        DOM.modalContent.innerHTML = content;
    }
    
    if (DOM.modalOverlay && DOM.modal) {
        // 先显示遮罩层
        DOM.modalOverlay.classList.add('active');
        // 确保弹框显示
        DOM.modal.style.display = 'flex';
        // 强制重排
        void DOM.modal.offsetWidth;
        // 添加active类触发过渡效果
        DOM.modal.classList.add('active');
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
        console.log('Modal opened successfully');
    } else {
        console.error('Modal elements not found');
    }
}

// 关闭弹框
function closeModal() {
    console.log('Closing modal...');
    
    if (DOM.modalOverlay && DOM.modal) {
        // 移除active类触发过渡效果
        DOM.modal.classList.remove('active');
        // 等待过渡效果完成后再隐藏遮罩层
        setTimeout(() => {
            DOM.modalOverlay.classList.remove('active');
            // 隐藏弹框
            DOM.modal.style.display = 'none';
            // 恢复背景滚动
            document.body.style.overflow = '';
            console.log('Modal closed successfully');
        }, 300);
    } else {
        console.error('Modal elements not found');
    }
}

// 打开反馈表单弹框
function openFeedbackDrawer(mergedData) {
    // 创建反馈表单HTML
    const feedbackFormHTML = `
        <div class="feedback-form">
            <!-- 评估研判结果 -->
            <div class="form-section">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label>评估研判结果<span class="required">*</span></label>
                    <button type="button" class="tooltip-btn" data-tooltip="评估研判结果含义：\n1. 研判正确: 结果完全符合实际情况\n2. 误判: 结果与实际情况不符\n3. 漏判: 未检测到实际存在的问题\n4. 研判不精准: 结果部分正确但不够准确">
                        <span>ℹ</span>
                    </button>
                </div>
                <div class="button-group">
                    <button type="button" data-type="accurate"><span>✅</span> 研判正确</button>
                    <button type="button" data-type="misjudgment"><span>❌</span> 误判</button>
                    <button type="button" data-type="omission"><span>⚠️</span> 漏判</button>
                    <button type="button" data-type="imprecision"><span>🔍</span> 研判不精准</button>
                </div>
            </div>
            
            <!-- 修正后研判结果 -->
            <div class="form-section">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label>修正后研判结果<span class="required">*</span></label>
                    <button type="button" class="tooltip-btn" data-tooltip="修正后研判结果含义：\n1. 真实攻击: 确认存在实际攻击行为\n2. 误报: 确认不存在攻击行为\n3. 可疑告警: 需要进一步验证的告警\n4. 无效告警: 无意义或重复的告警">
                        <span>ℹ</span>
                    </button>
                </div>
                <div class="button-group">
                    <button type="button" data-result="true_positive"><span>🔴</span> 真实攻击</button>
                    <button type="button" data-result="false_positive"><span>🟢</span> 误报</button>
                    <button type="button" data-result="suspicious"><span>🟡</span> 可疑告警</button>
                    <button type="button" data-result="invalid"><span>⚪</span> 无效告警</button>
                </div>
            </div>
            
            <!-- 反馈原因 -->
            <div class="form-section">
                <label>反馈原因（可选）</label>
                <textarea class="form-textarea" placeholder="请输入您的反馈原因..." id="feedbackReason"></textarea>
            </div>
            
            <!-- 核心特征标注 -->
            <div class="form-section">
                <label>核心特征标注（可选）</label>
                <input type="text" class="form-input" placeholder="输入后按Enter确认，再次输入下一个" id="coreFeatureInput">
                <div class="tags-container" id="coreFeatureTags"></div>
            </div>
            
            <!-- 错误提示 -->
            <div class="feedback-error" id="feedbackError" style="display: none;"></div>
            
            <!-- 成功提示 -->
            <div class="feedback-success" id="feedbackSuccess" style="display: none;">
                <span>✅</span> 感谢您的反馈，我们会不断改进服务！
            </div>
            
            <!-- 提交按钮 -->
            <button class="btn btn-primary" id="submitFeedback">评估反馈</button>
        </div>
    `;
    
    // 打开弹框
    openModal('反馈与评价', feedbackFormHTML);
    
    // 添加事件监听器
    setTimeout(() => {
        // 反馈类型按钮点击事件
        const feedbackButtons = document.querySelectorAll('[data-type]');
        feedbackButtons.forEach(button => {
            button.addEventListener('click', () => {
                feedbackButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
        });
        
        // 修正结果按钮点击事件
        const resultButtons = document.querySelectorAll('[data-result]');
        resultButtons.forEach(button => {
            button.addEventListener('click', () => {
                resultButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
        });
        
        // 核心特征输入事件
        const coreFeatureInput = document.getElementById('coreFeatureInput');
        const coreFeatureTags = document.getElementById('coreFeatureTags');
        const tags = [];
        
        if (coreFeatureInput) {
            coreFeatureInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && coreFeatureInput.value.trim()) {
                    const tagText = coreFeatureInput.value.trim();
                    if (!tags.includes(tagText)) {
                        tags.push(tagText);
                        updateCoreFeatureTags();
                        coreFeatureInput.value = '';
                    }
                    e.preventDefault();
                }
            });
        }
        
        function updateCoreFeatureTags() {
            if (coreFeatureTags) {
                coreFeatureTags.innerHTML = '';
                tags.forEach((tag, index) => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.innerHTML = `${tag} <button type="button" class="remove-tag" data-index="${index}">×</button>`;
                    coreFeatureTags.appendChild(tagElement);
                });
                
                // 添加删除标签事件
                document.querySelectorAll('.remove-tag').forEach(button => {
                    button.addEventListener('click', () => {
                        const index = parseInt(button.dataset.index);
                        tags.splice(index, 1);
                        updateCoreFeatureTags();
                    });
                });
            }
        }
        
        // 提交按钮点击事件
        const submitFeedback = document.getElementById('submitFeedback');
        if (submitFeedback) {
            submitFeedback.addEventListener('click', async () => {
                const feedbackError = document.getElementById('feedbackError');
                const feedbackSuccess = document.getElementById('feedbackSuccess');
                
                try {
                    // 获取选中的反馈类型
                    const selectedType = document.querySelector('[data-type].selected');
                    if (!selectedType) {
                        if (feedbackError) {
                            feedbackError.textContent = '请选择反馈类型';
                            feedbackError.style.display = 'block';
                        }
                        return;
                    }
                    
                    // 获取选中的修正结果
                    const selectedResult = document.querySelector('[data-result].selected');
                    if (!selectedResult) {
                        if (feedbackError) {
                            feedbackError.textContent = '请选择修正后研判结果';
                            feedbackError.style.display = 'block';
                        }
                        return;
                    }
                    
                    // 获取反馈原因
                    const feedbackReason = document.getElementById('feedbackReason');
                    const feedbackDescription = feedbackReason ? feedbackReason.value.trim() : '';
                    
                    // 构建反馈数据
                    const feedbackData = {
                        analysis_id: mergedData.analysis_id || mergedData.AnalysisID || '',
                        feedback_type: selectedType.dataset.type,
                        correct_result: selectedResult.dataset.result,
                        feedback_reason: feedbackDescription,
                        core_feature_tags: tags,
                        user_id: 'anonymous'
                    };
                    
                    if (feedbackError) {
                        feedbackError.style.display = 'none';
                    }
                    if (feedbackSuccess) {
                        feedbackSuccess.style.display = 'none';
                    }
                    
                    submitFeedback.disabled = true;
                    submitFeedback.textContent = '提交中...';
                    
                    // 调用反馈API
                    await callFeedbackAPI(feedbackData);
                    
                    if (feedbackSuccess) {
                        feedbackSuccess.style.display = 'block';
                    }
                    
                    // 3秒后关闭弹框
                    setTimeout(() => {
                        closeModal();
                    }, 3000);
                    
                } catch (err) {
                    if (feedbackError) {
                        feedbackError.textContent = err.message;
                        feedbackError.style.display = 'block';
                    }
                } finally {
                    submitFeedback.disabled = false;
                    submitFeedback.textContent = '提交反馈';
                }
            });
        }
    }, 100);
}



// 处理错误
function handleError(error) {
    // 显示错误信息
    const errorElement = document.createElement('div');
    errorElement.className = 'result-card';
    errorElement.style.borderColor = '#ef4444';
    errorElement.style.color = '#ef4444';
    errorElement.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <span style="font-size: 1.5rem;">❌</span>
            <h3 style="margin: 0;">分析失败</h3>
        </div>
        <p>${error.message}</p>
    `;
    
    DOM.resultContainer.innerHTML = '';
    DOM.resultContainer.appendChild(errorElement);
    
    // 滚动到结果
    DOM.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 格式化工具执行结果
function formatToolResult(toolResult) {
    if (!toolResult) {
        return '暂无工具执行结果';
    }
    
    // 确保 toolResult 是数组
    const toolResults = Array.isArray(toolResult) ? toolResult : [toolResult];
    
    let markdown = `# 工具执行结果

`;
    
    toolResults.forEach((result, index) => {
        markdown += `## 工具 ${index + 1}: ${result.tool_name || '未知工具'}

`;
        markdown += `### 工具调用 ID
${result.tool_call_id || '无'}

`;
        
        if (result.content) {
            markdown += `### 执行结果
`;
            
            try {
                // 尝试解析 content 字段
                let content = result.content;
                if (typeof content === 'string') {
                    content = JSON.parse(content);
                }
                
                // 格式化 content
                if (content.content && Array.isArray(content.content)) {
                    content.content.forEach(item => {
                        if (item.type === 'text' && item.text) {
                            try {
                                // 尝试解析文本内容
                                const parsedText = JSON.parse(item.text);
                                markdown += `\`\`\`json
${JSON.stringify(parsedText, null, 2)}
\`\`\`

`;
                            } catch (e) {
                                // 如果解析失败，直接显示文本
                                markdown += `${item.text}\n\n`;
                            }
                        }
                    });
                } else if (content.structuredContent) {
                    markdown += `\`\`\`json
${JSON.stringify(content.structuredContent, null, 2)}
\`\`\`

`;
                } else {
                    // 直接显示 content
                    markdown += `\`\`\`json
${JSON.stringify(content, null, 2)}
\`\`\`

`;
                }
            } catch (e) {
                // 如果解析失败，直接显示 content
                markdown += `\`\`\`
${result.content}
\`\`\`

`;
            }
        } else {
            markdown += `### 执行结果
无

`;
        }
        
        markdown += `---

`;
    });
    
    return markdown;
}

// 格式化通用告警模型结果
function formatAlertModelResult(alertModelResult) {
    if (!alertModelResult) {
        return '暂无通用告警模型结果';
    }
    
    let markdown = `# 通用告警模型结果

`;
    
    try {
        // 尝试解析结果
        let result = alertModelResult;
        if (typeof result === 'string') {
            result = JSON.parse(result);
        }
        
        // 格式化结果
        if (result.content && Array.isArray(result.content)) {
            result.content.forEach((item, index) => {
                markdown += `## 结果 ${index + 1}

`;
                if (item.type === 'text' && item.text) {
                    try {
                        // 尝试解析文本内容
                        const parsedText = JSON.parse(item.text);
                        markdown += `### 执行结果
\`\`\`json
${JSON.stringify(parsedText, null, 2)}
\`\`\`

`;
                    } catch (e) {
                        // 如果解析失败，直接显示文本
                        markdown += `### 执行结果
${item.text}\n\n`;
                    }
                }
                markdown += `---

`;
            });
        } else if (result.structuredContent) {
            markdown += `### 执行结果
\`\`\`json
${JSON.stringify(result.structuredContent, null, 2)}
\`\`\`

`;
        } else {
            // 直接显示结果
            markdown += `### 执行结果
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

`;
        }
    } catch (e) {
        // 如果解析失败，直接显示结果
        markdown += `### 执行结果
\`\`\`
${alertModelResult}
\`\`\`

`;
    }
    
    return markdown;
}

// 示例数据
const EXAMPLE_DATA = `ALERT-20260114-001: SQL Injection Detected
Source IP: 198.51.100.78
Target IP: 172.16.0.89
Target Port: 8080
Time: 2026-01-14T14:30:22Z
HTTP Method: POST
Request URI: /api/user/login
Request Body: username=admin' OR 1=1 --&password=123456
WAF Rule ID: WAF-SQL-003
Severity: high
Raw Log: 198.51.100.78 - - [14/Jan/2026:14:30:22 +0000] "POST /api/user/login HTTP/1.1" 403 289`;

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === '无') {
        return '未知';
    }
    
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) {
            return '未知';
        }
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        return '未知';
    }
}



// 生成报告Markdown内容
function generateReportMarkdown(result) {
    // 确保result不是null或undefined
    if (!result) {
        return `# 告警分析报告

## 1. 报告信息

- **分析ID**: 无
- **分析时间**: ${new Date().toISOString()}
- **置信度**: 0%

## 2. 告警基本信息

- **告警类型**: 无
- **告警描述**: 无

## 3. 详细分析

暂无详细分析

## 4. 攻击信息

## 5. 建议措施

暂无建议措施
`;
    }
    
    let markdown = `# 告警分析报告

`;
    
    // 报告头部
    markdown += `## 1. 报告信息

`;
    markdown += `- **分析ID**: ${result.AnalysisID || result.analysis_id || '无'}
`;
    markdown += `- **分析时间**: ${new Date().toISOString()}
`;
    if (result.analysis_time) {
        markdown += `- **分析耗时**: ${result.analysis_time}秒
`;
    }
    markdown += `- **置信度**: ${Math.round(((result.AnalysisConfidence || result.confidence) || 0) * 100)}%

`;
    
    // 告警基本信息
    markdown += `## 2. 告警基本信息

`;
    markdown += `- **告警类型**: ${getResultTypeLabel(result.AnalysisResultType || result.result_type)}
`;
    markdown += `- **告警描述**: ${result && (result.AnalysisResultDesc || result.result_desc) || '无'}
`;
    if (result.AlertEventTimestamp) {
        markdown += `- **事件时间**: ${result.AlertEventTimestamp}
`;
    }
    markdown += `
`;
    
    // 详细分析
    markdown += `## 3. 详细分析

`;
    if (result.AnalysisDeepDetail || (result.details && result.details.detailed_analysis)) {
        markdown += `${result.AnalysisDeepDetail || result.details.detailed_analysis}

`;
    } else {
        markdown += `暂无详细分析

`;
    }
    
    // 攻击信息
    markdown += `## 4. 攻击信息

`;
    if (result.AlertCategory || (result.details && result.details.attack_type)) {
        markdown += `- **攻击类型**: ${result.AlertCategory || result.details.attack_type}
`;
    }

    if (result.AnalysisRelatedIOCs && result.AnalysisRelatedIOCs.length > 0) {
        markdown += `- **相关IOCs**:
`;
        result.AnalysisRelatedIOCs.forEach(ioc => {
            markdown += `  - ${ioc}
`;
        });
    }
    markdown += `
`;
    
    // 建议措施
    markdown += `## 5. 建议措施

`;
    if (result.AnalysisDisposalSuggestion || (result.details && result.details.recommended_action)) {
        markdown += `${result.AnalysisDisposalSuggestion || result.details.recommended_action}

`;
    } else {
        markdown += `暂无建议措施

`;
    }
    
    // 通用告警模型结果
    if (result.RawDataGeneralAlertModel || result.general_alert_model_result) {
        markdown += `## 6. 通用告警模型结果

`;
        markdown += formatAlertModelResult(result.RawDataGeneralAlertModel || result.general_alert_model_result);
        markdown += `
`;
    }
    
    // 工具执行结果
    if (result.ToolsResult || result.use_tool_result) {
        markdown += `## 7. 工具执行结果

`;
        markdown += formatToolResult(result.ToolsResult || result.use_tool_result);
        markdown += `
`;
    }
    
    return markdown;
}

// 导出报告函数
function exportReport(result) {
    // 生成Markdown报告
    const reportMarkdown = generateReportMarkdown(result);
    
    // 生成文件名
    const markdownFileName = `告警分析报告_${(result && (result.analysis_id || result.AnalysisID)) || '未知'}_${new Date().toISOString().split('T')[0]}.md`;
    
    // 导出Markdown版本
    downloadFile(markdownFileName, reportMarkdown, 'text/markdown');
    
    // 提示用户导出成功
    console.log('报告已成功导出为Markdown格式，请使用Markdown渲染工具查看完整格式');
    
    // 可以考虑添加一个简单的页面提示
    const successMessage = document.createElement('div');
    successMessage.style.position = 'fixed';
    successMessage.style.top = '20px';
    successMessage.style.right = '20px';
    successMessage.style.backgroundColor = '#4CAF50';
    successMessage.style.color = 'white';
    successMessage.style.padding = '10px 15px';
    successMessage.style.borderRadius = '4px';
    successMessage.style.zIndex = '1000';
    successMessage.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    successMessage.textContent = '报告已导出为Markdown格式，请使用渲染工具查看';
    document.body.appendChild(successMessage);
    
    // 3秒后自动移除提示
    setTimeout(() => {
        successMessage.style.opacity = '0';
        successMessage.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 500);
    }, 3000);
}

// 下载文件辅助函数
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 标签页切换功能
function switchTab(tabId) {
    // 移除所有标签页的active类
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 添加当前标签页的active类
    const activeTab = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 移除所有标签内容的active类
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 添加当前标签内容的active类
    const activePanel = document.getElementById(tabId);
    if (activePanel) {
        activePanel.classList.add('active');
    }
}

// 处理反馈管理页面的筛选表单提交
function handleFeedbackFilterSubmit(e) {
    e.preventDefault();
    
    // 获取筛选条件
    const feedbackType = DOM.filterFeedbackType.value.trim();
    const correctResult = DOM.filterCorrectResult.value.trim();
    const status = DOM.filterStatus.value.trim();
    
    // 更新筛选条件
    AppState.knowledgeFeedbackState.feedbackManagement.currentFilter = {
        feedback_type: feedbackType,
        correct_result: correctResult,
        status: status
    };
    
    // 重置页码
    AppState.knowledgeFeedbackState.feedbackManagement.currentPage = 1;
    
    // 获取反馈数据列表
    fetchFeedbackList();
}

// 获取反馈数据列表
async function fetchFeedbackList() {
    try {
        // 设置加载状态
        AppState.knowledgeFeedbackState.feedbackManagement.isLoading = true;
        
        // 构建请求参数
        const params = new URLSearchParams();
        params.append('page', AppState.knowledgeFeedbackState.feedbackManagement.currentPage);
        params.append('page_size', AppState.knowledgeFeedbackState.feedbackManagement.pageSize);
        
        // 添加筛选条件
        const filter = AppState.knowledgeFeedbackState.feedbackManagement.currentFilter;
        if (filter.feedback_type) {
            params.append('feedback_type', filter.feedback_type);
        }
        if (filter.correct_result) {
            params.append('correct_result', filter.correct_result);
        }
        if (filter.status) {
            params.append('status', filter.status);
        }
        
        // 调用API
        const url = `${API_CONFIG.BASE_URL}/alert/feedback/list?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: API_CONFIG.TIMEOUT
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API调用失败 (${response.status})`);
        }
        
        const result = await response.json();
        
        // 更新状态
        AppState.knowledgeFeedbackState.feedbackManagement.feedbackList = result.items || [];
        AppState.knowledgeFeedbackState.feedbackManagement.totalItems = result.total || 0;
        AppState.knowledgeFeedbackState.feedbackManagement.totalPages = result.total_pages || 0;
        
        // 渲染反馈数据列表
        renderFeedbackList();
        
    } catch (error) {
        console.error('获取反馈数据列表失败:', error);
        // 显示错误信息
        const errorElement = document.createElement('div');
        errorElement.className = 'error-state';
        errorElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">❌</span>
                <h3 style="margin: 0;">获取数据失败</h3>
            </div>
            <p>${error.message}</p>
        `;
        if (DOM.feedbackContainer) {
            DOM.feedbackContainer.innerHTML = '';
            DOM.feedbackContainer.appendChild(errorElement);
        }
    } finally {
        // 重置加载状态
        AppState.knowledgeFeedbackState.feedbackManagement.isLoading = false;
    }
}

// 渲染反馈数据列表
function renderFeedbackList() {
    const feedbackList = AppState.knowledgeFeedbackState.feedbackManagement.feedbackList;
    const totalItems = AppState.knowledgeFeedbackState.feedbackManagement.totalItems;
    const currentPage = AppState.knowledgeFeedbackState.feedbackManagement.currentPage;
    const totalPages = AppState.knowledgeFeedbackState.feedbackManagement.totalPages;
    
    // 更新分页信息
    if (DOM.feedbackPageInfo) {
        DOM.feedbackPageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    }
    
    // 更新分页按钮状态
    if (DOM.feedbackPrevPage) {
        DOM.feedbackPrevPage.disabled = currentPage === 1;
    }
    if (DOM.feedbackNextPage) {
        DOM.feedbackNextPage.disabled = currentPage === totalPages;
    }
    
    // 渲染反馈数据列表
    if (DOM.feedbackContainer) {
        if (feedbackList.length === 0) {
            DOM.feedbackContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>暂无反馈数据</p>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <table class="feedback-table">
                <thead>
                    <tr>
                        <th>反馈时间</th>
                        <th>告警ID</th>
                        <th>研判评估</th>
                        <th>修正后结果</th>
                        <th>核心特征tags</th>
                        <th>反馈原因</th>
                        <th>反馈状态</th>
                        <th>反馈人</th>
                    </tr>
                </thead>
                <tbody>
                    ${feedbackList.map(feedback => {
                        const feedbackType = feedback.feedback_type || feedback.FeedbackType;
                        const correctResult = feedback.correct_result || feedback.CorrectResult;
                        const status = feedback.status || feedback.Status;
                        
                        // 获取反馈类型图标
                        let feedbackTypeIcon = '';
                        switch(feedbackType) {
                            case 'accurate':
                                feedbackTypeIcon = '✅';
                                break;
                            case 'misjudgment':
                                feedbackTypeIcon = '❌';
                                break;
                            case 'omission':
                                feedbackTypeIcon = '⚠️';
                                break;
                            case 'imprecision':
                                feedbackTypeIcon = '🔍';
                                break;
                            case 'correct': // 旧枚举值兼容
                                feedbackTypeIcon = '✅';
                                break;
                            case 'incorrect': // 旧枚举值兼容
                                feedbackTypeIcon = '❌';
                                break;
                            case 'partial': // 旧枚举值兼容
                                feedbackTypeIcon = '🔍';
                                break;
                            default:
                                feedbackTypeIcon = '📝';
                        }
                        
                        // 获取修正后结果图标和样式
                        let correctResultIcon = '';
                        let correctResultClass = '';
                        switch(correctResult) {
                            case 'true_positive':
                                correctResultIcon = '⚠️';
                                correctResultClass = 'true-positive';
                                break;
                            case 'false_positive':
                                correctResultIcon = '✅';
                                correctResultClass = 'false-positive';
                                break;
                            case 'invalid':
                                correctResultIcon = '❌';
                                correctResultClass = 'invalid';
                                break;
                            case 'suspicious':
                                correctResultIcon = '🔔';
                                correctResultClass = 'suspicious';
                                break;
                            default:
                                correctResultIcon = '';
                                correctResultClass = '';
                        }
                        
                        // 获取状态图标
                        let statusIcon = '';
                        switch(status) {
                            case 'pending':
                                statusIcon = '⏳';
                                break;
                            case 'processed':
                                statusIcon = '🔄';
                                break;
                            case 'resolved':
                                statusIcon = '✅';
                                break;
                            default:
                                statusIcon = '';
                        }
                        
                        return `
                            <tr>
                                <td>${formatDateTime(feedback.feedback_time || feedback.FeedbackTime)}</td>
                                <td>${feedback.analysis_uid || feedback.AnalysisUID}</td>
                                <td>
                                    <div class="label-with-icon">
                                        <span class="icon">${feedbackTypeIcon}</span>
                                        <span>${getFeedbackTypeLabel(feedbackType)}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="result-type ${correctResultClass}">
                                        <span class="result-type-icon">${correctResultIcon}</span>
                                        <span>${getCorrectResultLabel(correctResult)}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="tags">
                                        ${(feedback.core_feature_tags || feedback.CoreFeatureTags || []).map(tag => `
                                            <span class="tag">${tag}</span>
                                        `).join('')}
                                        ${((feedback.core_feature_tags || feedback.CoreFeatureTags || []).length === 0) ? '-' : ''}
                                    </div>
                                </td>
                                <td>${feedback.feedback_reason || feedback.FeedbackReason || '-'}</td>
                                <td>
                                    <div class="label-with-icon">
                                        <span class="icon">${statusIcon}</span>
                                        <span>${getStatusLabel(status)}</span>
                                    </div>
                                </td>
                                <td>${feedback.feedback_user || feedback.FeedbackUser || '匿名'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        DOM.feedbackContainer.innerHTML = tableHTML;
    }
}

// 获取反馈类型标签
function getFeedbackTypeLabel(feedbackType) {
    const typeMap = {
        'accurate': '研判正确',
        'misjudgment': '误判',
        'omission': '漏判',
        'imprecision': '研判不精准',
        'correct': '研判正确', // 旧枚举值兼容
        'partial': '研判不精准', // 旧枚举值兼容
        'incorrect': '误判' // 旧枚举值兼容
    };
    return typeMap[feedbackType] || feedbackType || '-';
}

// 获取修正后结果标签
function getCorrectResultLabel(correctResult) {
    const resultMap = {
        'true_positive': '真实攻击',
        'false_positive': '误报',
        'invalid': '无效告警',
        'suspicious': '可疑告警'
    };
    return resultMap[correctResult] || correctResult || '-';
}

// 获取状态标签
function getStatusLabel(status) {
    const statusMap = {
        'pending': '待审核',
        'finished': '已完成',
        'processed': '已完成', // 兼容旧状态
        'resolved': '已完成' // 兼容旧状态
    };
    return statusMap[status] || status || '-';
}

// 格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return '-';
    
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 页面切换功能
// 异步加载ECharts库
function loadECharts() {
    return new Promise((resolve, reject) => {
        // 检查ECharts是否已加载
        if (window.echarts) {
            AppState.dashboardState.echartsLoaded = true;
            resolve();
            return;
        }
        
        // 创建script标签
        const script = document.createElement('script');
        script.src = 'https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js';
        script.async = true;
        
        // 加载成功
        script.onload = () => {
            AppState.dashboardState.echartsLoaded = true;
            resolve();
        };
        
        // 加载失败
        script.onerror = () => {
            console.error('加载ECharts失败');
            reject(new Error('加载ECharts失败'));
        };
        
        // 添加到DOM
        document.head.appendChild(script);
    });
}

function switchPage(page) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // 激活选中的页面
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新侧边栏选中状态
    DOM.navItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 处理标签页切换，确保显示第一个标签页
    if (page === 'knowledgeFeedback' || page === 'systemSettings') {
        const pageElement = document.getElementById(`${page}Page`);
        if (pageElement) {
            const tabContainer = pageElement.querySelector('.tab-container');
            if (tabContainer) {
                // 移除所有标签页的active类
                const tabItems = tabContainer.querySelectorAll('.tab-item');
                tabItems.forEach(item => {
                    item.classList.remove('active');
                });
                
                const tabPanels = tabContainer.querySelectorAll('.tab-panel');
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                });
                
                // 添加第一个标签页的active类
                if (tabItems.length > 0) {
                    tabItems[0].classList.add('active');
                    const firstTabId = tabItems[0].dataset.tab;
                    const firstPanel = document.getElementById(firstTabId);
                    if (firstPanel) {
                        firstPanel.classList.add('active');
                    }
                }
            }
        }
    }
    
    // 更新URL地址
    if (page === 'analysis') {
        window.history.pushState({}, '', '/');
    } else if (page === 'alertOperation') {
        window.history.pushState({}, '', '/alert-operation');
        // 切换到告警运营页面时，自动加载数据
        AppState.historyState.currentPage = 1;
        fetchHistoryList();
    } else if (page === 'dashboard') {
        window.history.pushState({}, '', '/dashboard');
        // 切换到看板页面时，先加载ECharts库，然后加载数据
        if (!AppState.dashboardState.echartsLoaded) {
            // 显示加载状态
            const dashboardPage = document.getElementById('dashboardPage');
            if (dashboardPage) {
                const content = dashboardPage.querySelector('.main-content');
                if (content) {
                    content.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                            <p style="font-size: 1.25rem; color: var(--text-secondary); text-align: center;">正在加载数据看板...</p>
                            <p style="font-size: 1rem; color: var(--text-secondary); text-align: center; margin-top: 0.5rem;">正在加载图表库，请稍候...</p>
                        </div>
                    `;
                }
            }
            
            // 加载ECharts库
            loadECharts()
                .then(() => {
                    // ECharts加载成功，加载看板数据
                    loadDashboardData();
                })
                .catch(error => {
                    // ECharts加载失败，显示错误信息
                    console.error('加载ECharts失败:', error);
                    const dashboardPage = document.getElementById('dashboardPage');
                    if (dashboardPage) {
                        const content = dashboardPage.querySelector('.main-content');
                        if (content) {
                            content.innerHTML = `
                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px;">
                                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                                    <p style="font-size: 1.25rem; color: var(--danger-color); text-align: center;">加载失败</p>
                                    <p style="font-size: 1rem; color: var(--text-secondary); text-align: center; margin-top: 0.5rem;">图表库加载失败，请刷新页面重试</p>
                                </div>
                            `;
                        }
                    }
                });
        } else {
            // ECharts已加载，直接加载看板数据
            loadDashboardData();
        }
    } else if (page === 'taskManagement') {
        window.history.pushState({}, '', '/task-management');
        // 切换到任务管理页面时，自动加载数据
        AppState.taskState.currentPage = 1;
        fetchTaskList();
    } else if (page === 'knowledgeFeedback') {
        window.history.pushState({}, '', '/knowledge-feedback');
        // 切换到知识反馈页面时，自动加载反馈数据
        AppState.knowledgeFeedbackState.feedbackManagement.currentPage = 1;
        fetchFeedbackList();
    } else if (page === 'systemSettings') {
        window.history.pushState({}, '', '/system-settings');
        // 切换到系统设置页面时，自动加载提示词列表数据
        fetchPromptList();
    }
}

// 处理筛选条件提交
function handleFilterSubmit(e) {
    e.preventDefault();
    
    // 获取筛选条件
    const filter = {
        source: DOM.filterSource ? (DOM.filterSource.value || '') : '',
        result_type: DOM.filterResultType ? (DOM.filterResultType.value || '') : '',
        start_time: DOM.filterStartTime ? (DOM.filterStartTime.value || '') : '',
        end_time: DOM.filterEndTime ? (DOM.filterEndTime.value || '') : '',
        page: 1,
        page_size: AppState.historyState.pageSize
    };
    
    // 保存当前筛选条件
    AppState.historyState.currentFilter = filter;
    AppState.historyState.currentPage = 1;
    
    // 加载历史记录
    fetchHistoryList();
}

// 获取历史记录列表
async function fetchHistoryList() {
    if (AppState.historyState.isLoading) return;
    
    try {
        AppState.historyState.isLoading = true;
        
        // 显示加载状态
        DOM.historyContainer.innerHTML = `
            <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
                <div class="loading-spinner" style="width: 2rem; height: 2rem; border: 3px solid rgba(59, 130, 246, 0.3); border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">加载中...</p>
            </div>
        `;
        
        // 构建筛选条件
        const filter = {
            ...AppState.historyState.currentFilter,
            page: AppState.historyState.currentPage,
            page_size: AppState.historyState.pageSize
        };
        
        // 调用API
        const response = await callHistoryAPI(filter);
        
        // 更新状态
        AppState.historyState.totalItems = response.total || 0;
        AppState.historyState.totalPages = response.total_pages || 0;
        // 确保 historyList 是一个数组，并且过滤掉 null 或 undefined 元素
        AppState.historyState.historyList = Array.isArray(response.data) ? response.data.filter(item => item != null) : [];
        
        // 渲染历史记录列表
        renderHistoryList();
        
        // 更新分页信息
        updatePagination();
        
    } catch (error) {
        console.error('获取告警运营记录失败:', error);
        
        // 显示错误信息
        DOM.historyContainer.innerHTML = `
            <div class="error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <p style="color: var(--danger-color); margin-bottom: 1rem;">获取告警运营记录失败</p>
                <p style="color: var(--text-secondary); text-align: center;">${error.message}</p>
            </div>
        `;
    } finally {
        AppState.historyState.isLoading = false;
    }
}

// 渲染告警运营记录列表
function renderHistoryList() {
    const historyList = AppState.historyState.historyList;
    
    if (!Array.isArray(historyList) || historyList.length === 0) {
        DOM.historyContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>暂无告警运营记录</p>
            </div>
        `;
        return;
    }
    
    // 创建表格元素
    const table = document.createElement('table');
    table.className = 'history-list';
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>告警名称</th>
            <th>告警来源</th>
            <th>告警资产ID</th>
            <th>网络信息</th>
            <th>研判结果</th>
            <th>告警发生时间</th>
            <th>研判时间</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    historyList.forEach(item => {
        // 跳过null或undefined的项
        if (!item) return;
        
        // 获取detail字段，确保它是一个对象
        let detail = {};
        try {
            // 尝试解析detail字段，如果它是字符串
            if (item.detail && typeof item.detail === 'string') {
                try {
                    detail = JSON.parse(item.detail);
                } catch (e) {
                    // 如果解析失败，使用空对象
                    detail = {};
                }
            } else if (item.detail && typeof item.detail === 'object') {
                detail = item.detail;
            }
        } catch (e) {
            // 任何错误都使用空对象
            detail = {};
        }
        
        // 合并item和detail的数据，优先使用detail中的数据
        const mergedData = {
            ...item,
            ...detail
        };
        
        const row = document.createElement('tr');
        
        // 获取告警名称
        const alertName = mergedData.alert_name || '无描述';
        
        // 获取告警来源
        const alertSource = mergedData.alert_source || '未知';
        
        // 获取告警资产ID和资产类型
        const alertAssetId = mergedData.alert_asset_id || '未知';
        const alertAssetType = mergedData.alert_asset_type || '未知';
        
        // 获取网络信息
        const sourceIp = mergedData.alert_source_ip || '未知';
        const sourcePort = mergedData.alert_source_port || '';
        const destinationIp = mergedData.alert_destination_ip || '未知';
        const destinationPort = mergedData.alert_destination_port || '';
        const alertDirection = mergedData.alert_direction || '未知';
        
        // 构建网络信息字符串
        const networkInfo = `${sourceIp}${sourcePort ? ':' + sourcePort : ''} - ${destinationIp}${destinationPort ? ':' + destinationPort : ''}`;
        
        // 获取分析结果类型
        const resultType = mergedData.analysis_result_type || '未知';
        
        // 获取置信度
        const confidence = mergedData.analysis_confidence || 0;
        
        // 获取告警发生时间
        const alertEventTimestamp = mergedData.alert_event_timestamp || '无';
        
        // 获取研判时间和耗时
        const analysisStartTime = mergedData.analysis_start_time || 0;
        const analysisEndTime = mergedData.analysis_end_time || 0;
        const analysisTime = analysisEndTime > analysisStartTime ? ((analysisEndTime - analysisStartTime) / 1000).toFixed(1) + '秒' : '未知';
        
        // 获取分析ID
        const analysisID = mergedData.analysis_id || '';
        
        // 构建表格行内容
        row.innerHTML = `
            <td>${alertName}</td>
            <td>${alertSource}</td>
            <td>
                ${alertAssetId}
                <span class="asset-type-tag">${alertAssetType}</span>
            </td>
            <td>
                ${networkInfo}
                <span class="direction-tag">${alertDirection}</span>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="result-type ${resultType ? resultType.replace('_', '-') : ''}">
                        <span class="result-type-icon">${getResultTypeIcon(resultType)}</span>
                        <span>${getResultTypeLabel(resultType)}</span>
                    </div>
                    <span class="confidence-tag">${Math.round(confidence * 100)}%</span>
                </div>
            </td>
            <td>${formatDateTime(alertEventTimestamp)}</td>
            <td>
                ${formatDateTime(analysisStartTime ? new Date(analysisStartTime).toISOString() : '无')}
                <span class="time-tag">${analysisTime}</span>
            </td>
            <td>
                <button class="btn btn-secondary view-detail-btn" data-id="${analysisID}">
                    详情
                </button>
            </td>
        `;
        
        // 添加查看详情事件
        const viewDetailBtn = row.querySelector('.view-detail-btn');
        if (viewDetailBtn && analysisID) {
            viewDetailBtn.addEventListener('click', () => {
                viewHistoryDetail(analysisID);
            });
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    DOM.historyContainer.innerHTML = '';
    DOM.historyContainer.appendChild(table);
}

// 获取结果类型图标
function getResultTypeIcon(resultType) {
    const icons = {
        'true_positive': '⚠️',
        'false_positive': '✅',
        'suspicious': '🔔',
        'invalid': '❌'
    };
    return icons[resultType] || '📊';
}

// 获取结果类型标签
function getResultTypeLabel(resultType) {
    const labels = {
        'true_positive': '真实攻击',
        'false_positive': '误报',
        'suspicious': '可疑告警',
        'invalid': '无效告警'
    };
    return labels[resultType] || resultType;
}

// 查看告警运营记录详情
async function viewHistoryDetail(analysisId) {
    if (!analysisId) return;
    
    try {
        // 显示加载状态
        openDrawer('告警运营记录详情', '<div style="display: flex; justify-content: center; align-items: center; min-height: 200px;"><div class="loading-spinner" style="width: 2rem; height: 2rem; border: 3px solid rgba(59, 130, 246, 0.3); border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div></div>', false);
        
        // 调用API获取详情
        const detail = await callHistoryDetailAPI(analysisId);
        
        // 检查detail是否存在且是一个对象
        if (!detail || typeof detail !== 'object') {
            throw new Error('获取的详情数据格式错误');
        }
        
        // 获取detail字段，确保它是一个对象
        let detailObj = {};
        try {
            // 尝试解析detail字段，如果它是字符串
            if (detail.detail && typeof detail.detail === 'string') {
                try {
                    detailObj = JSON.parse(detail.detail);
                } catch (e) {
                    // 如果解析失败，使用空对象
                    detailObj = {};
                }
            } else if (detail.detail && typeof detail.detail === 'object') {
                detailObj = detail.detail;
            }
        } catch (e) {
            // 任何错误都使用空对象
            detailObj = {};
        }
        
        // 合并detail和detailObj的数据，优先使用detailObj中的数据
        const mergedData = {
            ...detail,
            ...detailObj
        };
        
        // 清空抽屉内容
        if (DOM.drawerContent) {
            DOM.drawerContent.innerHTML = '';
        } else {
            throw new Error('抽屉内容容器不存在');
        }
        
        // 创建结果卡片
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // 结果头部
        const resultHeader = document.createElement('div');
        resultHeader.className = 'result-header';
        resultHeader.style.display = 'flex';
        resultHeader.style.alignItems = 'center';
        resultHeader.style.justifyContent = 'space-between';
        
        // 左侧：结果类型和置信度
        const leftSection = document.createElement('div');
        leftSection.style.display = 'flex';
        leftSection.style.alignItems = 'center';
        leftSection.style.gap = '1rem';
        
        // 结果类型
        const resultType = document.createElement('div');
        const analysisResultType = mergedData.analysis_result_type;
        resultType.className = `result-type ${analysisResultType ? analysisResultType.replace('_', '-') : ''}`;
        
        let resultTypeHTML = `
            <span class="result-type-icon">
                ${getResultTypeIcon(analysisResultType)}
            </span>
            <span>${getResultTypeLabel(analysisResultType)}</span>
        `;
        
        resultType.innerHTML = resultTypeHTML;
        leftSection.appendChild(resultType);
        
        // 置信度
        const confidence = document.createElement('div');
        confidence.className = 'result-confidence';
        const analysisConfidence = mergedData.analysis_confidence || 0;
        confidence.textContent = `置信度: ${Math.round(analysisConfidence * 100)}%`;
        leftSection.appendChild(confidence);
        
        // 右侧：操作按钮
        const rightSection = document.createElement('div');
        rightSection.style.display = 'flex';
        rightSection.style.alignItems = 'center';
        rightSection.style.gap = '1rem';
        
        // 评估反馈按钮
        const feedbackBtn = document.createElement('button');
        feedbackBtn.className = 'btn btn-secondary';
        feedbackBtn.style.fontSize = '0.75rem';
        feedbackBtn.style.padding = '0.375rem 0.75rem';
        feedbackBtn.style.minWidth = '80px';
        feedbackBtn.innerHTML = '评估反馈';
        feedbackBtn.title = '对本次分析结果提供评估反馈';
        feedbackBtn.addEventListener('click', () => {
            // 打开反馈表单抽屉
            openFeedbackDrawer(mergedData);
        });
        rightSection.appendChild(feedbackBtn);

        // 导出报告按钮
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-primary';
        exportBtn.style.fontSize = '0.75rem';
        exportBtn.style.padding = '0.375rem 0.75rem';
        exportBtn.style.minWidth = '80px';
        exportBtn.innerHTML = '导出报告';
        exportBtn.title = '导出为Markdown格式，需要使用Markdown渲染工具查看完整格式';
        exportBtn.addEventListener('click', () => {
            // 创建一个模拟的result对象，用于导出报告
            const result = {
                analysis_id: mergedData.analysis_id,
                result_type: mergedData.analysis_result_type,
                result_desc: mergedData.analysis_result_desc,
                confidence: mergedData.analysis_confidence,
                details: {
                    detailed_analysis: mergedData.analysis_deep_detail,
                    attack_type: mergedData.alert_category,
                    severity: mergedData.alert_severity,
                    recommended_action: mergedData.analysis_disposal_suggestion
                },
                general_alert_model_result: mergedData.raw_data_general_alert_model,
                use_tool_result: mergedData.tools_result
            };
            exportReport(result);
        });
        rightSection.appendChild(exportBtn);
        
        resultHeader.appendChild(leftSection);
        resultHeader.appendChild(rightSection);
        
        // 结果描述
        const resultDesc = document.createElement('div');
        resultDesc.className = 'result-desc';
        resultDesc.textContent = mergedData.analysis_result_desc || '无描述';
        resultDesc.style.marginBottom = '1rem';
        
        // 创建折叠面板来显示详细内容，避免内容堆叠
        const collapsiblePanels = document.createElement('div');
        collapsiblePanels.style.marginBottom = '1.25rem';
        collapsiblePanels.style.display = 'flex';
        collapsiblePanels.style.flexDirection = 'column';
        collapsiblePanels.style.gap = '0.75rem';
        
        // 查看完整分析折叠面板
        const analysisDeepDetail = mergedData.analysis_deep_detail;
        const analysisInitialDetail = mergedData.analysis_initial_detail;
        let analysisContent = '';
        
        if (analysisDeepDetail) {
            analysisContent = marked.parse(analysisDeepDetail);
        } else if (analysisInitialDetail) {
            analysisContent = marked.parse(analysisInitialDetail);
        } else {
            analysisContent = '<p>无分析内容</p>';
        }
        
        if (analysisContent) {
            const analysisPanel = createCollapsiblePanel('完整分析', analysisContent);
            collapsiblePanels.appendChild(analysisPanel);
        }
        
        // 添加查看通用告警模型结果折叠面板
        const rawDataGeneralAlertModel = mergedData.raw_data_general_alert_model;
        if (rawDataGeneralAlertModel) {
            const alertModelPanel = createCollapsiblePanel('通用告警模型结果', marked.parse(formatAlertModelResult(rawDataGeneralAlertModel)));
            collapsiblePanels.appendChild(alertModelPanel);
        }
        
        // 添加查看工具结果折叠面板
        const toolsResult = mergedData.tools_result;
        if (toolsResult) {
            const toolResultPanel = createCollapsiblePanel('工具执行结果', marked.parse(formatToolResult(toolsResult)));
            collapsiblePanels.appendChild(toolResultPanel);
        }
        
        // 添加证据链折叠面板
        const analysisEvidenceChain = mergedData.analysis_evidence_chain;
        if (analysisEvidenceChain) {
            let evidenceChainContent = '';
            if (typeof analysisEvidenceChain === 'string') {
                evidenceChainContent = marked.parse(analysisEvidenceChain);
            } else if (typeof analysisEvidenceChain === 'object') {
                evidenceChainContent = `<pre><code>${JSON.stringify(analysisEvidenceChain, null, 2)}</code></pre>`;
            }
            const evidenceChainPanel = createCollapsiblePanel('证据链', evidenceChainContent);
            collapsiblePanels.appendChild(evidenceChainPanel);
        }
        
        // 添加原始告警数据折叠面板
        const rawDataAlert = mergedData.raw_data_alert;
        if (rawDataAlert) {
            let rawAlertContent = '';
            if (typeof rawDataAlert === 'string') {
                rawAlertContent = `<pre><code>${rawDataAlert}</code></pre>`;
            } else if (typeof rawDataAlert === 'object') {
                rawAlertContent = `<pre><code>${JSON.stringify(rawDataAlert, null, 2)}</code></pre>`;
            }
            const rawAlertPanel = createCollapsiblePanel('原始告警数据', rawAlertContent);
            collapsiblePanels.appendChild(rawAlertPanel);
        }
        
        // 分析信息
        const analysisInfo = document.createElement('div');
        analysisInfo.style.backgroundColor = 'var(--surface-color)';
        analysisInfo.style.borderRadius = 'var(--border-radius)';
        analysisInfo.style.padding = '1rem';
        analysisInfo.style.marginBottom = '1.25rem';
        analysisInfo.style.border = '1px solid var(--border-color)';
        
        // 计算分析耗时
        const analysisStartTime = mergedData.analysis_start_time || 0;
        const analysisEndTime = mergedData.analysis_end_time || 0;
        const analysisTime = analysisEndTime > analysisStartTime ? ((analysisEndTime - analysisStartTime) / 1000).toFixed(1) + '秒' : '未知';
        
        let analysisInfoHTML = `
            <h3 style="margin-top: 0; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">分析信息</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="detail-item">
                    <span class="detail-label">分析时间:</span>
                    <span class="detail-value">${formatDateTime(analysisEndTime ? new Date(analysisEndTime).toISOString() : new Date().toISOString())}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">分析耗时:</span>
                    <span class="detail-value">${analysisTime}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">分析ID:</span>
                    <span class="detail-value">${mergedData.analysis_id || '无'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警来源:</span>
                    <span class="detail-value">${mergedData.alert_source || '未知'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警类别:</span>
                    <span class="detail-value">${mergedData.alert_category || '未知'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">严重程度:</span>
                    <span class="detail-value">${mergedData.alert_severity || '未知'}</span>
                </div>
            </div>
        `;
        
        analysisInfo.innerHTML = analysisInfoHTML;
        
        // 详情信息
        const detailInfo = document.createElement('div');
        detailInfo.style.backgroundColor = 'var(--surface-color)';
        detailInfo.style.borderRadius = 'var(--border-radius)';
        detailInfo.style.padding = '1rem';
        detailInfo.style.marginBottom = '1.25rem';
        detailInfo.style.border = '1px solid var(--border-color)';
        
        let detailInfoHTML = `
            <h3 style="margin-top: 0; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">详情信息</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="detail-item">
                    <span class="detail-label">告警标题:</span>
                    <span class="detail-value">${mergedData.alert_name || '无'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警UUID:</span>
                    <span class="detail-value">${mergedData.alert_uuid || '无'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警发生时间:</span>
                    <span class="detail-value">${formatDateTime(mergedData.alert_event_timestamp || '无')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警资产ID:</span>
                    <span class="detail-value">${mergedData.alert_asset_id || '未知'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">告警资产类型:</span>
                    <span class="detail-value">${mergedData.alert_asset_type || '未知'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">网络信息:</span>
                    <span class="detail-value">${mergedData.alert_source_ip || '未知'}:${mergedData.alert_source_port || '未知'} - ${mergedData.alert_destination_ip || '未知'}:${mergedData.alert_destination_port || '未知'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">攻击方向:</span>
                    <span class="detail-value">${mergedData.alert_direction || '未知'}</span>
                </div>
            </div>
        `;
        
        detailInfo.innerHTML = detailInfoHTML;
        
        // 建议措施
        const suggestionInfo = document.createElement('div');
        suggestionInfo.style.backgroundColor = 'var(--surface-color)';
        suggestionInfo.style.borderRadius = 'var(--border-radius)';
        suggestionInfo.style.padding = '1rem';
        suggestionInfo.style.marginBottom = '1.25rem';
        suggestionInfo.style.border = '1px solid var(--border-color)';
        
        let suggestionInfoHTML = `
            <h3 style="margin-top: 0; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">建议措施</h3>
            <div class="markdown-content">
                ${mergedData.analysis_disposal_suggestion ? marked.parse(mergedData.analysis_disposal_suggestion) : '<p>无</p>'}
            </div>
        `;
        
        suggestionInfo.innerHTML = suggestionInfoHTML;
        
        // 相关IOCs
        const iocsInfo = document.createElement('div');
        iocsInfo.style.backgroundColor = 'var(--surface-color)';
        iocsInfo.style.borderRadius = 'var(--border-radius)';
        iocsInfo.style.padding = '1rem';
        iocsInfo.style.marginBottom = '1.25rem';
        iocsInfo.style.border = '1px solid var(--border-color)';
        
        const analysisRelatedIOCs = mergedData.analysis_related_iocs;
        let iocsHTML = '';
        if (analysisRelatedIOCs && Array.isArray(analysisRelatedIOCs) && analysisRelatedIOCs.length > 0) {
            iocsHTML = '<div class="tags">';
            analysisRelatedIOCs.forEach(ioc => {
                if (ioc) {
                    iocsHTML += `<span class="tag">${ioc}</span>`;
                }
            });
            iocsHTML += '</div>';
        } else {
            iocsHTML = '<p>无</p>';
        }
        
        let iocsInfoHTML = `
            <h3 style="margin-top: 0; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">相关IOCs</h3>
            ${iocsHTML}
        `;
        
        iocsInfo.innerHTML = iocsInfoHTML;
        
        // 组装结果卡片
        resultCard.appendChild(resultHeader);
        resultCard.appendChild(resultDesc);
        resultCard.appendChild(analysisInfo);
        resultCard.appendChild(detailInfo);
        resultCard.appendChild(suggestionInfo);
        resultCard.appendChild(iocsInfo);
        resultCard.appendChild(collapsiblePanels);
        
        // 添加到抽屉内容
        DOM.drawerContent.appendChild(resultCard);
        
        // 更新抽屉标题
        DOM.drawerTitle.textContent = '告警运营记录详情';
        
    } catch (error) {
        console.error('获取告警运营记录详情失败:', error);
        
        // 显示错误信息
        DOM.drawerTitle.textContent = '告警运营记录详情';
        DOM.drawerContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <p style="color: var(--danger-color); margin-bottom: 1rem;">获取详情失败</p>
                <p style="color: var(--text-secondary); text-align: center;">${error.message}</p>
            </div>
        `;
    }
}

// 创建折叠面板
function createCollapsiblePanel(title, content) {
    const panel = document.createElement('div');
    panel.className = 'collapsible-panel';
    
    const header = document.createElement('div');
    header.className = 'collapsible-header';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    
    const toggle = document.createElement('button');
    toggle.className = 'collapsible-toggle';
    toggle.innerHTML = '▼';
    
    // 添加点击事件到整个header
    const togglePanel = () => {
        const contentElement = panel.querySelector('.collapsible-content');
        if (contentElement) {
            contentElement.classList.toggle('active');
            toggle.innerHTML = contentElement.classList.contains('active') ? '▲' : '▼';
        }
    };
    
    // 点击三角图标时切换
    toggle.addEventListener('click', togglePanel);
    
    // 点击整个header时切换
    header.addEventListener('click', (e) => {
        // 防止事件冒泡导致重复触发
        if (e.target !== toggle) {
            togglePanel();
        }
    });
    
    header.appendChild(titleElement);
    header.appendChild(toggle);
    
    const contentElement = document.createElement('div');
    contentElement.className = 'collapsible-content';
    contentElement.innerHTML = content;
    
    panel.appendChild(header);
    panel.appendChild(contentElement);
    
    return panel;
}

// 处理看板时间范围变化
function handleDashboardTimeRangeChange() {
    const timeRange = DOM.dashboardTimeRange.value;
    
    // 显示或隐藏自定义时间范围输入框
    if (timeRange === 'custom') {
        DOM.customTimeRange.style.display = 'block';
        DOM.customTimeRangeEnd.style.display = 'block';
    } else {
        DOM.customTimeRange.style.display = 'none';
        DOM.customTimeRangeEnd.style.display = 'none';
    }
}

// 加载看板数据
async function loadDashboardData() {
    try {
        // 获取时间范围参数
        const timeRange = DOM.dashboardTimeRange.value;
        let startTime = '';
        let endTime = '';
        
        if (timeRange === 'custom') {
            startTime = DOM.dashboardStartTime.value;
            endTime = DOM.dashboardEndTime.value;
        }
        
        // 构建查询参数
        const params = new URLSearchParams();
        params.append('time_range', timeRange);
        if (startTime) {
            params.append('start_time', startTime);
        }
        if (endTime) {
            params.append('end_time', endTime);
        }
        
        // 加载概览数据
        const overviewData = await fetchDashboardOverview(params);
        renderDashboardOverview(overviewData);
        
        // 加载趋势数据
        const trendData = await fetchDashboardTrend(params);
        renderTimeTrendChart(trendData);
        
        // 加载详细数据
        const detailData = await fetchDashboardDetail(params);
        renderResultTypeChart(detailData.result_type_distribution);
        renderAlertSourceChart(detailData.alert_source_distribution);
        renderAlertSeverityChart(detailData.alert_severity_distribution);
        
        // 加载效率数据
        const efficiencyData = await fetchDashboardEfficiency(params);
        renderEfficiencyChart(efficiencyData);
        
    } catch (error) {
        console.error('加载看板数据失败:', error);
        // 显示错误信息
        alert('加载看板数据失败，请重试');
    }
}

// 带超时的fetch函数
async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('请求超时');
        }
        throw error;
    }
}

// 获取看板概览数据
async function fetchDashboardOverview(params) {
    const url = `${API_CONFIG.BASE_URL}/dashboard/overview?${params.toString()}`;
    
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'  // 允许跨域请求
    }, API_CONFIG.TIMEOUT);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 获取看板趋势数据
async function fetchDashboardTrend(params) {
    const url = `${API_CONFIG.BASE_URL}/dashboard/trend?${params.toString()}`;
    
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'  // 允许跨域请求
    }, API_CONFIG.TIMEOUT);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 获取看板详细数据
async function fetchDashboardDetail(params) {
    const url = `${API_CONFIG.BASE_URL}/dashboard/detail?${params.toString()}`;
    
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'  // 允许跨域请求
    }, API_CONFIG.TIMEOUT);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 获取看板效率数据
async function fetchDashboardEfficiency(params) {
    const url = `${API_CONFIG.BASE_URL}/dashboard/efficiency?${params.toString()}`;
    
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'  // 允许跨域请求
    }, API_CONFIG.TIMEOUT);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 渲染看板概览数据
function renderDashboardOverview(data) {
    if (data) {
        if (DOM.totalAlerts) {
            DOM.totalAlerts.textContent = data.total_alerts || 0;
        }
        if (DOM.averageAnalysisTime) {
            DOM.averageAnalysisTime.textContent = (data.average_analysis_time || 0) + 's';
        }
        if (DOM.truePositiveCount) {
            DOM.truePositiveCount.textContent = data.true_positive_count || 0;
        }
        if (DOM.falsePositiveCount) {
            DOM.falsePositiveCount.textContent = data.false_positive_count || 0;
        }
        // 检查元素是否存在，避免TypeError
        if (DOM.suspiciousCount) {
            DOM.suspiciousCount.textContent = data.suspicious_count || 0;
        }
        if (DOM.invalidCount) {
            DOM.invalidCount.textContent = data.invalid_count || 0;
        }
    }
}

// 渲染研判结果分布图表
function renderResultTypeChart(data) {
    const chart = echarts.init(DOM.resultTypeChart);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: data ? data.map(item => item.name) : []
        },
        series: [
            {
                name: '研判结果',
                type: 'pie',
                radius: '50%',
                data: data || [],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 渲染告警来源分布图表
function renderAlertSourceChart(data) {
    const chart = echarts.init(DOM.alertSourceChart);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: data ? data.map(item => item.name) : []
        },
        series: [
            {
                name: '告警来源',
                type: 'pie',
                radius: '50%',
                data: data || [],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 渲染告警级别分布图表
function renderAlertSeverityChart(data) {
    const chart = echarts.init(DOM.alertSeverityChart);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: data ? data.map(item => item.name) : []
        },
        series: [
            {
                name: '告警级别',
                type: 'pie',
                radius: '50%',
                data: data || [],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 渲染告警数量趋势图表
function renderTimeTrendChart(data) {
    const chart = echarts.init(DOM.timeTrendChart);
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['告警数量']
        },
        xAxis: {
            type: 'category',
            data: data ? data.map(item => item.date) : []
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '告警数量',
                type: 'line',
                data: data ? data.map(item => item.count) : [],
                smooth: true
            }
        ]
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 渲染分析效率图表
function renderEfficiencyChart(data) {
    const chart = echarts.init(DOM.efficiencyChart);
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['分析时间分布']
        },
        xAxis: {
            type: 'category',
            data: data ? data.map(item => item.time_range) : []
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '分析时间分布',
                type: 'bar',
                data: data ? data.map(item => item.count) : []
            }
        ]
    };
    
    chart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// 更新分页信息
function updatePagination() {
    const { currentPage, totalPages, totalItems } = AppState.historyState;
    
    // 更新分页信息
    DOM.pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页，总计 ${totalItems} 条`;
    
    // 更新分页按钮状态
    DOM.prevPage.disabled = currentPage === 1;
    DOM.nextPage.disabled = currentPage >= totalPages;
}

// 格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return '无';
    
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime;
    
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 处理任务筛选条件提交
function handleTaskFilterSubmit(e) {
    e.preventDefault();
    
    // 获取筛选条件
    const filter = {
        analysis_id: DOM.taskFilterAnalysisId ? (DOM.taskFilterAnalysisId.value || '') : '',
        source: DOM.taskFilterSource ? (DOM.taskFilterSource.value || '') : '',
        raw_alert: DOM.taskFilterRawAlert ? (DOM.taskFilterRawAlert.value || '') : '',
        page: 1,
        page_size: AppState.taskState.pageSize
    };
    
    // 保存当前筛选条件
    AppState.taskState.currentFilter = filter;
    AppState.taskState.currentPage = 1;
    
    // 加载任务列表
    fetchTaskList();
}

// 调用任务列表API
async function callTaskListAPI(filter) {
    const url = `${API_CONFIG.BASE_URL}/alert/analysis/task/list`;
    
    // 构建查询参数
    const params = new URLSearchParams();
    params.append('page', filter.page || AppState.taskState.currentPage);
    params.append('page_size', filter.page_size || AppState.taskState.pageSize);
    
    if (filter.analysis_id) {
        params.append('analysis_id', filter.analysis_id);
    }
    if (filter.source) {
        params.append('source', filter.source);
    }
    if (filter.raw_alert) {
        params.append('raw_alert', filter.raw_alert);
    }
    
    const fullUrl = `${url}?${params.toString()}`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: API_CONFIG.TIMEOUT,
        mode: 'cors'  // 允许跨域请求
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API调用失败 (${response.status})`);
    }
    
    return await response.json();
}

// 获取任务列表
async function fetchTaskList() {
    if (AppState.taskState.isLoading) return;
    
    try {
        AppState.taskState.isLoading = true;
        
        // 显示加载状态
        DOM.taskContainer.innerHTML = `
            <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
                <div class="loading-spinner" style="width: 2rem; height: 2rem; border: 3px solid rgba(59, 130, 246, 0.3); border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">加载中...</p>
            </div>
        `;
        
        // 构建筛选条件
        const filter = {
            ...AppState.taskState.currentFilter,
            page: AppState.taskState.currentPage,
            page_size: AppState.taskState.pageSize
        };
        
        // 调用API
        const response = await callTaskListAPI(filter);
        
        // 更新状态
        AppState.taskState.totalItems = response.total || 0;
        AppState.taskState.totalPages = response.total_pages || 0;
        // 确保 taskList 是一个数组，并且过滤掉 null 或 undefined 元素
        AppState.taskState.taskList = Array.isArray(response.items) ? response.items.filter(item => item != null) : [];
        
        // 渲染任务列表
        renderTaskList();
        
        // 更新分页信息
        updateTaskPagination();
        
    } catch (error) {
        console.error('获取任务列表失败:', error);
        
        // 显示错误信息
        DOM.taskContainer.innerHTML = `
            <div class="error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <p style="color: var(--danger-color); margin-bottom: 1rem;">获取任务列表失败</p>
                <p style="color: var(--text-secondary); text-align: center;">${error.message}</p>
            </div>
        `;
    } finally {
        AppState.taskState.isLoading = false;
    }
}

// 渲染任务列表
function renderTaskList() {
    const taskList = AppState.taskState.taskList;
    
    if (!Array.isArray(taskList) || taskList.length === 0) {
        DOM.taskContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚙️</div>
                <p>暂无告警研判任务</p>
            </div>
        `;
        return;
    }
    
    // 创建表格元素
    const table = document.createElement('table');
    table.className = 'history-list'; // 使用与告警运营列表相同的样式
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>告警分析ID</th>
            <th>告警来源</th>
            <th>研判开始时间</th>
            <th>研判结束时间</th>
            <th>任务状态</th>
            <th>操作</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    taskList.forEach(item => {
        // 跳过null或undefined的项
        if (!item) return;
        
        const row = document.createElement('tr');
        
        // 获取分析ID
        const analysisId = item.analysis_id || item.AnalysisID || '';
        
        // 获取任务状态
        const status = item.disposal_status || item.status || 'unknown';
        
        // 获取错误日志
        const errorLog = item.err_message || item.error_log || '';
        
        // 获取研判开始时间
        let startTime = item.analysis_start_time || '无';
        // 确保开始时间只显示时间值，不显示错误信息
        if (typeof startTime === 'string' && (startTime.includes('error') || startTime.includes('Error') || startTime.includes('failed') || startTime.includes('Failed'))) {
            startTime = '无';
        }
        
        // 获取研判结束时间
        let endTime = item.analysis_end_time;
        // 处理特殊情况：为空、时间戳为0或值为"1970-01-01 08:00:00"
        if (!endTime || endTime === 0 || endTime === '1970-01-01 08:00:00' || endTime === '1970-01-01T08:00:00+08:00') {
            endTime = ' - ';
        }
        // 确保结束时间只显示时间值，不显示错误信息
        if (typeof endTime === 'string' && (endTime.includes('error') || endTime.includes('Error') || endTime.includes('failed') || endTime.includes('Failed'))) {
            endTime = ' - ';
        }
        
        // 计算任务耗时
        let duration = '无';
        if (startTime !== '无' && endTime !== ' - ' && endTime !== '1970-01-01T08:00:00+08:00') {
            try {
                const startDate = new Date(startTime);
                const endDate = new Date(endTime);
                const diffMs = endDate - startDate;
                const diffSec = Math.round(diffMs / 1000);
                if (diffSec < 60) {
                    duration = `${diffSec}秒`;
                } else if (diffSec < 3600) {
                    const minutes = Math.floor(diffSec / 60);
                    const seconds = diffSec % 60;
                    duration = `${minutes}分${seconds}秒`;
                } else {
                    const hours = Math.floor(diffSec / 3600);
                    const minutes = Math.floor((diffSec % 3600) / 60);
                    duration = `${hours}时${minutes}分`;
                }
            } catch (e) {
                duration = '计算失败';
            }
        }
        
        // 获取原始告警
        const rawAlert = item.raw_alert || item.alert_data || '无';
        
        // 获取告警来源
        const source = item.source || '无';
        
        // 构建表格行内容
        row.innerHTML = `
            <td>${analysisId}</td>
            <td>${source}</td>
            <td>${startTime}</td>
            <td>
                ${endTime}
                ${duration !== '无' && endTime !== ' - ' ? `<span class="duration-tag">${duration}</span>` : ''}
            </td>
            <td>
                <div class="status-wrapper" ${errorLog ? `data-error="${escapeHtml(errorLog)}"` : ''}>
                    <span class="status-tag ${getStatusClass(status)}">
                        ${getTaskStatusLabel(status)}
                        ${errorLog ? '<i class="error-icon">i</i>' : ''}
                    </span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary raw-alert-btn" data-text="${escapeHtml(rawAlert)}" data-id="${analysisId}">
                        原始告警
                    </button>
                    <button class="btn btn-secondary view-workflow-btn" data-id="${analysisId}">
                        任务流程
                    </button>
                </div>
            </td>
        `;
        
        // 添加查看原始告警事件
        const rawAlertBtn = row.querySelector('.raw-alert-btn');
        if (rawAlertBtn) {
            rawAlertBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rawAlertText = rawAlertBtn.dataset.text;
                viewRawAlert(rawAlertText);
            });
        }
        
        // 添加查看工作流事件
        const viewWorkflowBtn = row.querySelector('.view-workflow-btn');
        if (viewWorkflowBtn && analysisId) {
            viewWorkflowBtn.addEventListener('click', () => {
                viewTaskWorkflow(analysisId);
            });
        }
        
        // 添加状态标签hover效果
        const statusWrapper = row.querySelector('.status-wrapper');
        if (statusWrapper && statusWrapper.hasAttribute('data-error')) {
            statusWrapper.addEventListener('mouseenter', function() {
                const errorLog = this.getAttribute('data-error');
                if (errorLog) {
                    // 移除其他提示框
                    document.querySelectorAll('.error-tooltip').forEach(tooltip => {
                        tooltip.remove();
                    });
                    
                    // 创建提示框
                    const tooltip = document.createElement('div');
                    tooltip.className = 'error-tooltip';
                    
                    // 使用textContent确保HTML被正确转义
                    tooltip.textContent = errorLog;
                    
                    // 添加到document.body
                    document.body.appendChild(tooltip);
                    
                    // 定位提示框
                    const rect = this.getBoundingClientRect();
                    const tooltipRect = tooltip.getBoundingClientRect();
                    
                    tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                    tooltip.style.top = `${rect.top - tooltipRect.height - 10}px`;
                    tooltip.style.position = 'fixed';
                    tooltip.style.zIndex = '999999';
                    
                    // 存储tooltip引用
                    this._tooltip = tooltip;
                }
            });
            
            // 添加点击关闭tooltip的事件
            statusWrapper.addEventListener('click', function() {
                if (this._tooltip) {
                    this._tooltip.remove();
                    this._tooltip = null;
                }
            });
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    DOM.taskContainer.innerHTML = '';
    DOM.taskContainer.appendChild(table);
    
    // 添加点击页面其他位置关闭所有tooltip的事件（只添加一次）
    if (!window.tooltipClickHandlerAdded) {
        window.tooltipClickHandlerAdded = true;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.status-wrapper')) {
                document.querySelectorAll('.error-tooltip').forEach(tooltip => {
                    tooltip.remove();
                });
                // 清除所有状态标签的tooltip引用
                document.querySelectorAll('.status-wrapper').forEach(wrapper => {
                    wrapper._tooltip = null;
                });
            }
        });
    }
}

// 更新任务分页信息
function updateTaskPagination() {
    const { currentPage, totalPages, totalItems } = AppState.taskState;
    
    // 更新分页信息
    DOM.taskPageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页，总计 ${totalItems} 条`;
    
    // 更新分页按钮状态
    DOM.taskPrevPage.disabled = currentPage === 1;
    DOM.taskNextPage.disabled = currentPage >= totalPages;
}

// 获取任务状态图标
function getTaskStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'processing': '🔄',
        'success': '✅',
        'failed': '❌'
    };
    return icons[status] || '📋';
}

// 获取任务状态标签
function getTaskStatusLabel(status) {
    const labels = {
        'pending': '待处理',
        'processing': '处理中',
        'running': '运行中',
        'success': '成功',
        'failed': '失败'
    };
    return labels[status] || status;
}

// 获取任务状态CSS类
function getStatusClass(status) {
    const classes = {
        'running': 'status-running',
        'pending': 'status-pending',
        'success': 'status-success',
        'failed': 'status-failed'
    };
    return classes[status] || 'status-pending';
}

// 对HTML特殊字符进行转义
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 查看原始告警
function viewRawAlert(rawAlert) {
    // 对原始告警进行格式解析
    let formattedAlert = rawAlert;
    
    try {
        // 尝试将原始告警解析为JSON
        const parsedAlert = JSON.parse(rawAlert);
        formattedAlert = `<div style="max-width: 100%; overflow-x: auto;"><pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 0.875rem; line-height: 1.5;"><code>${JSON.stringify(parsedAlert, null, 2)}</code></pre></div>`;
    } catch (e) {
        // 如果不是JSON，尝试进行其他格式解析
        // 检查是否是常见的日志格式
        if (rawAlert.includes('[')) {
            // 尝试按行分割并高亮显示
            const lines = rawAlert.split('\n');
            formattedAlert = `<div style="max-width: 100%; overflow-x: auto;"><pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 0.875rem; line-height: 1.5;"><code>${lines.map(line => line).join('\n')}</code></pre></div>`;
        } else {
            // 简单的文本显示
            formattedAlert = `<div style="max-width: 100%; overflow-x: auto;"><pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 0.875rem; line-height: 1.5;"><code>${rawAlert}</code></pre></div>`;
        }
    }
    
    // 直接设置抽屉内容，不使用Markdown解析
    DOM.drawerTitle.textContent = '原始告警';
    DOM.drawerContent.innerHTML = formattedAlert;
    
    // 隐藏重新加载按钮
    if (DOM.drawerRefresh) {
        DOM.drawerRefresh.style.display = 'none';
    }
    
    // 显示抽屉
    DOM.drawerOverlay.classList.add('active');
    DOM.drawer.classList.add('active');
    
    // 聚焦到抽屉内容
    DOM.drawerContent.focus();
}

// 查看任务工作流
async function viewTaskWorkflow(analysisId) {
    if (!analysisId) return;
    
    try {
        // 存储analysisId到drawer的dataset中
        if (DOM.drawer) {
            DOM.drawer.dataset.analysisId = analysisId;
        }
        
        // 显示加载状态
        openDrawer('研判流程', '<div style="display: flex; justify-content: center; align-items: center; min-height: 200px;"><div class="loading-spinner" style="width: 2rem; height: 2rem; border: 3px solid rgba(59, 130, 246, 0.3); border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div></div>', false);
        
        // 调用API获取工作流日志
        const workflowLog = await callWorkflowLogAPI(analysisId);
        
        // 渲染工作流时间轴
        renderWorkflowTimeline(workflowLog);
        
    } catch (error) {
        console.error('获取工作流日志失败:', error);
        
        // 存储analysisId到drawer的dataset中（即使出错也要存储，以便刷新时能重新获取）
        if (DOM.drawer) {
            DOM.drawer.dataset.analysisId = analysisId;
        }
        
        // 显示错误信息
        DOM.drawerTitle.textContent = '研判流程';
        DOM.drawerContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <p style="color: var(--danger-color); margin-bottom: 1rem;">获取工作流日志失败</p>
                <p style="color: var(--text-secondary); text-align: center;">${error.message}</p>
            </div>
        `;
        
        // 显示重新加载按钮
        if (DOM.drawerRefresh) {
            DOM.drawerRefresh.style.display = 'block';
        }
    }
}

// 调用工作流日志API
async function callWorkflowLogAPI(analysisId) {
    const url = `${API_CONFIG.BASE_URL}/alert/analysis/task/${analysisId}/workflow`;
    
    // 使用AbortController实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal,
            mode: 'cors'  // 允许跨域请求
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API调用失败 (${response.status})`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API调用超时');
        }
        throw error;
    }
}

// 获取component类型对应的图标
function getComponentIcon(component) {
    const icons = {
        'Workflow': '🔄',
        'ChatTemplate': '💬',
        'ChatModel': '🤖',
        'Lambda': '⚡',
        'ToolsNode': '🔧',
        'Tool': '🛠️',
        'Embedding': '📊'
    };
    return icons[component] || '📋';
}

// 展示完整文本并添加复制按钮
function displayFullText(text) {
    if (!text) return '<span class="text-gray-400">无</span>';
    
    return `
        <div class="text-content">
            <div class="text-wrapper">
                <code>${text}</code>
            </div>
            <button class="copy-btn" data-text="${escapeHtml(text)}" onclick="copyTextFromButton(this)">
                复制
            </button>
        </div>
    `;
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 可以添加复制成功的提示
        console.log('复制成功');
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// 从按钮复制文本
function copyTextFromButton(button) {
    const text = button.getAttribute('data-text');
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            // 显示复制成功的提示
            const originalText = button.textContent;
            button.textContent = '已复制';
            button.style.backgroundColor = '#d1fae5';
            button.style.color = '#065f46';
            
            // 2秒后恢复原样
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
        });
    }
}

// 渲染工作流时间轴
function renderWorkflowTimeline(workflowLog) {
    // 清空抽屉内容
    if (DOM.drawerContent) {
        DOM.drawerContent.innerHTML = '';
    } else {
        throw new Error('抽屉内容容器不存在');
    }
    
    // 更新抽屉标题
    DOM.drawerTitle.textContent = '研判流程';
    
    // 检查workflowLog是否存在
    if (!workflowLog) {
        DOM.drawerContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>暂无工作流日志</p>
            </div>
        `;
        return;
    }
    
    // 尝试不同的工作流日志结构
    let workflowSteps = [];
    
    // 处理常见的响应格式
    if (Array.isArray(workflowLog)) {
        workflowSteps = workflowLog;
    } else if (workflowLog && workflowLog.workflow_log) {
        workflowSteps = Array.isArray(workflowLog.workflow_log) ? workflowLog.workflow_log : [];
    } else if (workflowLog && workflowLog.steps) {
        workflowSteps = Array.isArray(workflowLog.steps) ? workflowLog.steps : [];
    } else if (workflowLog && workflowLog.logs) {
        workflowSteps = Array.isArray(workflowLog.logs) ? workflowLog.logs : [];
    } else if (workflowLog && workflowLog.data) {
        workflowSteps = Array.isArray(workflowLog.data) ? workflowLog.data : [];
    } else if (workflowLog && workflowLog.result) {
        workflowSteps = Array.isArray(workflowLog.result) ? workflowLog.result : [];
    } else if (workflowLog) {
        // 如果workflowLog是一个对象，但不是预期的结构，尝试将其作为单个步骤
        workflowSteps = [workflowLog];
    }
    
    if (workflowSteps.length === 0) {
        DOM.drawerContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>暂无工作流日志</p>
            </div>
        `;
        return;
    }
    
    // 按时间倒序排序
    const sortedSteps = [...workflowSteps].sort((a, b) => {
        // 尝试获取时间字段
        let timeA = 0;
        let timeB = 0;
        
        // 尝试不同的时间字段
        try {
            if (a.exec_time) timeA = typeof a.exec_time === 'number' ? a.exec_time : new Date(a.exec_time).getTime();
            else if (a.execTime) timeA = typeof a.execTime === 'number' ? a.execTime : new Date(a.execTime).getTime();
            else if (a.timestamp) timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
            else if (a.time) timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
        } catch (e) {
            timeA = 0;
        }
        
        try {
            if (b.exec_time) timeB = typeof b.exec_time === 'number' ? b.exec_time : new Date(b.exec_time).getTime();
            else if (b.execTime) timeB = typeof b.execTime === 'number' ? b.execTime : new Date(b.execTime).getTime();
            else if (b.timestamp) timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
            else if (b.time) timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
        } catch (e) {
            timeB = 0;
        }
        
        return timeB - timeA;
    });
    
    // 创建时间轴容器
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'workflow-timeline';
    
    sortedSteps.forEach(step => {
        // 跳过null或undefined的项
        if (!step) return;
        
        const stepElement = document.createElement('div');
        stepElement.className = 'timeline-step';
        
        // 获取步骤信息
        const component = step.component || '未知组件';
        const nodeName = step.node_name || step.nodeName || '';
        const nodeType = step.node_type || step.nodeType || '';
        const execTime = step.exec_time || step.execTime || step.timestamp || step.time || 0;
        const input = step.input || '';
        const output = step.output || '';
        const errMessage = step.err_message || step.errMessage || '';
        
        // 获取component图标
        const componentIcon = getComponentIcon(component);
        
        // 格式化执行时间
        let formattedTime = '未知';
        try {
            if (typeof execTime === 'number') {
                // 如果execTime是时间戳
                formattedTime = formatDateTime(new Date(execTime).toISOString());
            } else if (typeof execTime === 'string') {
                // 如果execTime是字符串
                formattedTime = formatDateTime(execTime);
            }
        } catch (e) {
            formattedTime = '未知';
        }
        
        // 构建标签
        let tags = '';
        if (nodeName) {
            tags += `<span class="node-tag">${nodeName}</span>`;
        }
        if (nodeType) {
            tags += `<span class="node-tag">${nodeType}</span>`;
        }
        
        // 构建步骤内容
        stepElement.innerHTML = `
            <div class="timeline-content">
                <div class="step-header">
                    <h4>${componentIcon} ${component}</h4>
                    <span class="step-time">${formattedTime}</span>
                </div>
                ${tags ? `<div class="node-tags">${tags}</div>` : ''}
                <div class="step-details">
                    <div class="detail-item">
                        <strong>Input:</strong>
                        ${displayFullText(input)}
                    </div>
                    <div class="detail-item">
                        <strong>Output:</strong>
                        ${displayFullText(output)}
                    </div>
                    ${errMessage ? `
                        <div class="detail-item error">
                            <strong>Error:</strong>
                            ${displayFullText(errMessage)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        timelineContainer.appendChild(stepElement);
    });
    
    // 添加到抽屉内容
    DOM.drawerContent.appendChild(timelineContainer);
}

// 任务列表和工作流时间轴样式
const style = document.createElement('style');
style.textContent = `
    /* 表格样式 */
    .history-list {
        width: 100%;
        border-collapse: collapse;
    }
    
    .history-list th,
    .history-list td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .history-list th {
        background-color: #f9fafb;
        font-weight: 600;
        font-size: 0.875rem;
    }
    
    .history-list tr:hover {
        background-color: #f3f4f6;
    }
    
    /* 原始告警容器样式 */
    .raw-alert-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    /* 复制按钮样式 */
    .copy-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.8rem;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .copy-btn:hover {
        opacity: 1;
    }
    
    /* 操作按钮样式 */
    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .action-buttons .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
    
    /* 任务耗时标签样式 */
    .duration-tag {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.125rem 0.375rem;
        font-size: 0.75rem;
        background-color: #e0e7ff;
        color: #3730a3;
        border-radius: 0.25rem;
        font-weight: 500;
    }
    
    /* 工作流时间轴样式 */
    .workflow-timeline {
        position: relative;
        padding-left: 3rem;
        margin-top: 1rem;
    }
    
    .workflow-timeline::before {
        content: '';
        position: absolute;
        left: 1rem;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: #e5e7eb;
    }
    
    .timeline-step {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .timeline-marker {
        position: absolute;
        left: -2.5rem;
        top: 0.75rem;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        z-index: 1;
        background-color: #d1d5db;
    }
    
    .timeline-content {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 1rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        width: 100%;
        max-width: 800px;
    }
    
    .step-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .step-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .step-time {
        font-size: 0.8rem;
        color: #6b7280;
    }
    
    /* 节点标签样式 */
    .node-tags {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }
    
    .node-tag {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        background-color: #e5e7eb;
        color: #374151;
        border-radius: 1rem;
        font-weight: 500;
    }
    
    /* 步骤详情样式 */
    .step-details {
        margin-top: 0.5rem;
    }
    
    .detail-item {
        margin-bottom: 0.75rem;
    }
    
    .detail-item strong {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.8rem;
        color: #374151;
    }
    
    .detail-item.error strong {
        color: #dc2626;
    }
    
    /* 文本内容容器 */
    .text-content {
        position: relative;
        background-color: #f3f4f6;
        border-radius: 0.25rem;
        padding: 0.33rem;
        width: 711.502px;
        max-height: 199.971px;
        min-height: 60px;
        box-sizing: border-box;
        margin: 0 auto;
    }
    
    .text-wrapper {
        max-height: 180px;
        overflow-y: auto;
        margin-right: 60px;
        width: 100%;
        box-sizing: border-box;
    }
    
    .text-content code {
        display: block;
        font-size: 0.8rem;
        line-height: 1.4;
        word-wrap: break-word;
        white-space: pre-wrap;
        width: 100%;
        box-sizing: border-box;
    }
    
    .text-content .copy-btn {
        position: absolute;
        top: 0.15rem;
        right: 0.15rem;
        background-color: #e5e7eb;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        padding: 0.15rem 0.35rem;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 500;
        transition: all 0.2s;
        z-index: 1;
    }
    
    .text-content .copy-btn:hover {
        background-color: #d1d5db;
    }
    
    /* 文本颜色 */
    .text-gray-400 {
        color: #9ca3af;
    }
    
    /* 状态标签样式 */
    .status-wrapper {
        position: relative;
        display: inline-block;
        z-index: 1;
    }
    
    .status-wrapper:hover {
        z-index: 9999;
    }
    
    .status-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: help;
    }
    
    .error-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.8);
        color: inherit;
        font-size: 0.75rem;
        font-weight: bold;
        margin-left: 0.5rem;
        font-style: normal;
        border: 1px solid currentColor;
    }
    
    /* 错误信息提示框 */
    .error-tooltip {
        background-color: #000;
        color: #fff;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: normal;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-width: 400px;
        white-space: pre-wrap;
        word-wrap: break-word;
        /* 移除pointer-events: none，允许文本选择 */
    }
    
    .error-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0.375rem;
        border-style: solid;
        border-color: #000 transparent transparent transparent;
        margin-top: -0.1rem;
    }
    
    .status-running {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .status-pending {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .status-success {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-failed {
        background-color: #fee2e2;
        color: #b91c1c;
    }
    

    
    .workflow-timeline {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0;
    }
    
    .timeline-step {
        display: flex;
        gap: 1rem;
    }
    
    .timeline-marker {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        background-color: var(--surface-color);
        border: 2px solid var(--border-color);
    }
    
    .timeline-marker.success {
        border-color: #10b981;
        background-color: rgba(16, 185, 129, 0.1);
    }
    
    .timeline-marker.failed {
        border-color: #ef4444;
        background-color: rgba(239, 68, 68, 0.1);
    }
    
    .timeline-content {
        flex: 1;
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        padding: 1rem;
        border: 1px solid var(--border-color);
    }
    
    .step-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .step-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .step-time {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .step-status {
        font-size: 0.8rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
    
    .step-status.success {
        color: #10b981;
    }
    
    .step-status.failed {
        color: #ef4444;
    }
    
    .step-result {
        margin-top: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        border-top: 1px solid var(--border-color);
        padding-top: 0.5rem;
    }
    
    .step-result pre {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);

