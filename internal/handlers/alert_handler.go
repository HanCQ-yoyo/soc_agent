package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"

	"soc_agent/internal/agent"
	"soc_agent/internal/consts"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/mongo"
)

// AlertHandler 告警处理结构体
type AlertHandler struct {
	agent *agent.SOCAgent
}

// NewAlertHandler 创建告警处理器
func NewAlertHandler(agent *agent.SOCAgent) *AlertHandler {
	return &AlertHandler{
		agent: agent,
	}
}

// AnalyzeAlert 处理告警分析请求
func (h *AlertHandler) AnalyzeAlert(c *gin.Context) {
	var req models.AlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成分析ID
	analysisID := mongo.GetFieldUID(consts.FieldUIDPrefixAlertAnalysis)
	logrus.Infof("Received alert analysis request: %s, source: %s", analysisID, req.Source)

	// 创建上下文 - 增加超时时间以处理LLM响应
	ctx, cancel := context.WithTimeout(c.Request.Context(), 600*time.Second)
	defer cancel()

	// 调用智能体进行分析
	result, err := h.agent.AnalyzeAlert(ctx, analysisID, req.AlertData, req.Source)
	if err != nil {
		logrus.Errorf("Alert analysis failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert analysis failed"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, result)
}

// HealthCheck 健康检查
func (h *AlertHandler) HealthCheck(c *gin.Context) {
	response := models.HealthCheckResponse{
		Status:  "ok",
		Version: "1.0.0",
		Time:    time.Now().Format(time.RFC3339),
	}
	c.JSON(http.StatusOK, response)
}

// HandleFeedback 处理用户反馈
func (h *AlertHandler) HandleFeedback(c *gin.Context) {
	var req models.FeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid feedback request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用智能体提交反馈
	err := h.agent.SubmitFeedback(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to submit feedback: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit feedback"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"message": "Feedback submitted successfully"})
}

// GetAlertAnalysisByID 根据分析ID获取告警分析详情
func (h *AlertHandler) GetAlertAnalysisByID(c *gin.Context) {
	// 获取分析ID
	analysisID := c.Param("id")
	if analysisID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Analysis ID is required"})
		return
	}

	logrus.Infof("Received request for alert analysis details: %s", analysisID)

	// 检查存储库是否初始化
	if h.agent.AlertAnalysisRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert analysis repository not initialized"})
		return
	}

	// 查询告警分析详情
	analysis, err := h.agent.AlertAnalysisRepo.GetAlertAnalysisByID(analysisID)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert analysis not found"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, analysis)
}

// GetAlertAnalysisList 获取告警分析列表，支持筛选条件
func (h *AlertHandler) GetAlertAnalysisList(c *gin.Context) {
	// 绑定筛选条件
	var filter models.AlertAnalysisFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		logrus.Errorf("Invalid filter parameters: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 10
	}
	filter.Status = string(consts.DisposalStatusSuccess)

	logrus.Infof("Received request for alert analysis list with filter: %+v", filter)

	// 检查存储库是否初始化
	if h.agent.AlertAnalysisRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert analysis repository not initialized"})
		return
	}

	// 查询告警分析列表
	response, err := h.agent.AlertAnalysisRepo.GetAlertAnalysisList(&filter)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get alert analysis list"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, response)
}

// GetAnalysisTaskList 获取任务管理列表，支持筛选条件
func (h *AlertHandler) GetAnalysisTaskList(c *gin.Context) {
	// 绑定筛选条件
	var filter models.AlertAnalysisFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		logrus.Errorf("Invalid filter parameters: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 || filter.PageSize > 100 {
		filter.PageSize = 10
	}

	logrus.Infof("Received request for alert analysis task list with filter: %+v", filter)

	// 检查存储库是否初始化
	if h.agent.AlertAnalysisRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert analysis repository not initialized"})
		return
	}

	// 查询告警分析列表
	response, err := h.agent.AlertAnalysisRepo.GetAlertAnalysisList(&filter)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get alert analysis list"})
		return
	}

	// 只返回任务列表需要的字段
	type TaskListItem struct {
		AnalysisID        string `json:"analysis_id"`
		AlertSource       string `json:"source"`
		RawDataAlert      string `json:"raw_alert"`
		DisposalStatus    string `json:"disposal_status"`
		ErrMessage        string `json:"err_message"`
		AnalysisStartTime string `json:"analysis_start_time"`
		AnalysisEndTime   string `json:"analysis_end_time"`
	}

	var taskListItems []TaskListItem
	for _, analysis := range response.Data {
		taskListItems = append(taskListItems, TaskListItem{
			AnalysisID:        analysis.Detail.AnalysisID,
			AlertSource:       analysis.Detail.AlertSource,
			RawDataAlert:      analysis.Detail.RawDataAlert,
			DisposalStatus:    analysis.DisposalStatus,
			ErrMessage:        analysis.ErrMessage,
			AnalysisStartTime: time.UnixMilli(analysis.Detail.AnalysisStartTime).Format(time.DateTime),
			AnalysisEndTime:   time.UnixMilli(analysis.Detail.AnalysisEndTime).Format(time.DateTime),
		})
	}

	// 构建简化的响应
	c.JSON(http.StatusOK, gin.H{
		"total":       response.Total,
		"items":       taskListItems,
		"page":        response.Page,
		"page_size":   response.PageSize,
		"total_pages": response.TotalPages,
	})
}

// SubmitAlertAnalysis 提交异步告警研判任务
func (h *AlertHandler) SubmitAlertAnalysis(c *gin.Context) {
	var req models.AlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成分析ID
	analysisID := mongo.GetFieldUID(consts.FieldUIDPrefixAlertAnalysis)

	logrus.Infof("Received alert analysis request: %s, source: %s", analysisID, req.Source)

	// 异步执行告警分析
	go func() {
		logrus.Infof("Starting async alert analysis: %s", analysisID)

		// 创建上下文 - 增加超时时间以处理LLM响应
		ctx, cancel := context.WithTimeout(context.Background(), 600*time.Second)
		defer cancel()

		// 调用智能体进行分析
		_, err := h.agent.AnalyzeAlert(ctx, analysisID, req.AlertData, req.Source)
		if err != nil {
			logrus.Errorf("Async alert analysis failed: %v", err)
			// 可以在这里更新告警分析记录的状态为Failed
			return
		}
	}()

	// 直接返回研判状态
	c.JSON(http.StatusOK, gin.H{
		"analysis_id": analysisID,
		"status":      string(consts.DisposalStatusPending),
		"message":     "Alert analysis task submitted successfully",
	})
}

// GetWorkflowLog 获取告警研判任务的workflow日志，按时间倒序返回
func (h *AlertHandler) GetWorkflowLog(c *gin.Context) {
	// 获取分析ID
	analysisID := c.Param("id")
	if analysisID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Analysis ID is required"})
		return
	}

	logrus.Infof("Received request for workflow log: %s", analysisID)

	// 检查存储库是否初始化
	if h.agent.AlertAnalysisRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert analysis repository not initialized"})
		return
	}

	// 验证分析ID是否存在
	_, err := h.agent.AlertAnalysisRepo.GetAlertAnalysisByID(analysisID)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert analysis not found"})
		return
	}

	// 获取workflow日志
	workflowLogs, err := h.agent.AlertAnalysisRepo.GetWorkflowLogs(analysisID)
	if err != nil {
		logrus.Errorf("Failed to get workflow logs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get workflow logs"})
		return
	}

	// 按时间倒序排序
	for i := 0; i < len(workflowLogs)-1; i++ {
		for j := i + 1; j < len(workflowLogs); j++ {
			if workflowLogs[i].ExecTime.Before(workflowLogs[j].ExecTime) {
				workflowLogs[i], workflowLogs[j] = workflowLogs[j], workflowLogs[i]
			}
		}
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{
		"analysis_id":  analysisID,
		"workflow_log": workflowLogs,
	})
}

// GetFeedbackList 获取反馈数据列表
func (h *AlertHandler) GetFeedbackList(c *gin.Context) {
	// 绑定查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	analysisID := c.Query("analysis_id")
	feedbackType := c.Query("feedback_type")
	correctResult := c.Query("correct_result")
	status := c.Query("status")

	// 设置默认值
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	logrus.Infof("Received request for feedback list: page=%d, page_size=%d, analysis_id=%s, feedback_type=%s, correct_result=%s, status=%s", page, pageSize, analysisID, feedbackType, correctResult, status)

	// 检查存储库是否初始化
	if h.agent.AlertFeedbackRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert feedback repository not initialized"})
		return
	}

	// 构建筛选条件
	filter := bson.M{}
	if analysisID != "" {
		filter["analysis_uid"] = analysisID
	}
	if feedbackType != "" {
		filter["feedback_type"] = feedbackType
	}
	if correctResult != "" {
		filter["correct_result"] = correctResult
	}
	if status != "" {
		filter["status"] = status
	}

	// 查询反馈数据列表
	feedbacks, total, err := h.agent.AlertFeedbackRepo.ListFeedbacks(filter, page, pageSize)
	if err != nil {
		logrus.Errorf("Failed to get feedback list: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get feedback list"})
		return
	}

	// 计算总页数
	totalPages := total / int64(pageSize)
	if total%int64(pageSize) > 0 {
		totalPages++
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"items":       feedbacks,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// GetFeedbackByID 根据ID获取反馈数据详情
func (h *AlertHandler) GetFeedbackByID(c *gin.Context) {
	// 获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Feedback ID is required"})
		return
	}

	logrus.Infof("Received request for feedback details: %s", feedbackID)

	// 检查存储库是否初始化
	if h.agent.AlertFeedbackRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert feedback repository not initialized"})
		return
	}

	// 查询反馈数据详情
	feedback, err := h.agent.AlertFeedbackRepo.GetFeedbackByID(feedbackID)
	if err != nil {
		logrus.Errorf("Failed to get feedback: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Feedback not found"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, feedback)
}

// DeleteFeedback 删除反馈数据
func (h *AlertHandler) DeleteFeedback(c *gin.Context) {
	// 获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Feedback ID is required"})
		return
	}

	logrus.Infof("Received request to delete feedback: %s", feedbackID)

	// 检查存储库是否初始化
	if h.agent.AlertFeedbackRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert feedback repository not initialized"})
		return
	}

	// 删除反馈数据
	err := h.agent.AlertFeedbackRepo.DeleteFeedback(feedbackID)
	if err != nil {
		logrus.Errorf("Failed to delete feedback: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete feedback"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"message": "Feedback deleted successfully"})
}

// UpdateFeedback 更新反馈数据
func (h *AlertHandler) UpdateFeedback(c *gin.Context) {
	// 获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Feedback ID is required"})
		return
	}

	// 绑定请求体
	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		logrus.Errorf("Invalid update data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logrus.Infof("Received request to update feedback: %s", feedbackID)

	// 检查存储库是否初始化
	if h.agent.AlertFeedbackRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alert feedback repository not initialized"})
		return
	}

	// 更新反馈数据
	err := h.agent.AlertFeedbackRepo.UpdateFeedback(feedbackID, updateData)
	if err != nil {
		logrus.Errorf("Failed to update feedback: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update feedback"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"message": "Feedback updated successfully"})
}
