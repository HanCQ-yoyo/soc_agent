package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"soc_agent/internal/agent"
	"soc_agent/internal/consts"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/mongo"
)

// ChatHandler 聊天处理器
type ChatHandler struct {
	agent *agent.SOCAgent
}

// NewChatHandler 创建聊天处理器
func NewChatHandler(agent *agent.SOCAgent) *ChatHandler {
	return &ChatHandler{
		agent: agent,
	}
}

// CreateChatSession 创建对话会话
func (h *ChatHandler) CreateChatSession(c *gin.Context) {
	var req models.CreateChatSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用聊天服务创建会话
	session, err := h.createSession(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to create chat session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat session"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"data": session})
}

// GetChatSession 获取对话会话
func (h *ChatHandler) GetChatSession(c *gin.Context) {
	// 获取会话ID
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// 调用聊天服务获取会话
	session, err := h.getSession(c.Request.Context(), sessionID)
	if err != nil {
		logrus.Errorf("Failed to get chat session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat session"})
		return
	}

	if session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat session not found"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"data": session})
}

// ListChatSessions 获取对话会话列表
func (h *ChatHandler) ListChatSessions(c *gin.Context) {
	// 绑定查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// 调用聊天服务获取会话列表
	response, err := h.listSessions(c.Request.Context(), page, pageSize)
	if err != nil {
		logrus.Errorf("Failed to get chat sessions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat sessions"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// DeleteChatSession 删除对话会话
func (h *ChatHandler) DeleteChatSession(c *gin.Context) {
	// 获取会话ID
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// 调用聊天服务删除会话
	err := h.deleteSession(c.Request.Context(), sessionID)
	if err != nil {
		logrus.Errorf("Failed to delete chat session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat session"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"message": "Chat session deleted successfully"})
}

// SendMessage 发送消息
func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req models.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	j, _ := json.Marshal(req)
	fmt.Println("req::", string(j))
	// 调用聊天服务发送消息
	response, err := h.sendMessage(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to send message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"data": models.ChatMessageResponse{Response: response}})
}

// QueryAlertInfo 查询告警信息
func (h *ChatHandler) QueryAlertInfo(c *gin.Context) {
	var req models.AlertQueryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用聊天服务查询告警信息
	result, err := h.queryAlertInfo(c.Request.Context(), &req)
	if err != nil {
		logrus.Errorf("Failed to query alert info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query alert info"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{"data": models.AlertQueryResponse{Result: result}})
}

// createSession 创建对话会话
func (s *ChatHandler) createSession(ctx context.Context, req *models.CreateChatSessionRequest) (*models.ChatSessionInfo, error) {
	// 检查ChatRepo是否初始化
	if s.agent.ChatRepo == nil {
		return nil, fmt.Errorf("chat repository not initialized")
	}

	// 生成会话ID
	sessionID := mongo.GetFieldUID(consts.ChatSessionFieldUIDPrefix)
	// 创建会话
	session := &models.ChatSession{
		Title:       req.Title,
		SessionUID:  sessionID,
		Messages:    []models.ChatMessage{},
		AlertData:   req.AlertData,
		AnalysisUID: req.AnalysisUID,
	}

	if req.AnalysisUID != "" {
		alertAnalysisData, err := s.agent.AlertAnalysisRepo.GetAlertAnalysisByID(req.AnalysisUID)
		if err != nil {
			return nil, err
		}
		session.AlertData = alertAnalysisData.Detail.RawDataAlert
		session.Title = alertAnalysisData.Detail.AlertName
	}

	// 如果没有提供标题，使用默认标题
	if session.Title == "" {
		session.Title = fmt.Sprintf("对话 %s", time.Now().Format("2006-01-02 15:04"))
	}

	// 如果有告警数据，添加系统消息
	if session.AlertData != "" {
		session.Messages = append(session.Messages, models.ChatMessage{
			SessionUID:      sessionID,
			Role:            "system",
			Content:         "已加载告警数据，您可以基于此告警进行分析和询问。",
			SubmitTimestamp: time.Now().UnixMilli(),
		})
		session.Messages = append(session.Messages, models.ChatMessage{
			SessionUID:      sessionID,
			Role:            "system",
			Content:         "以下是本地要分析的告警数据：\n" + session.AlertData,
			SubmitTimestamp: time.Now().UnixMilli(),
		})
	} else {
		session.Messages = append(session.Messages, models.ChatMessage{
			SessionUID:      sessionID,
			Role:            "system",
			Content:         "未加载告警数据，请在发送消息前先加载告警数据。",
			SubmitTimestamp: time.Now().UnixMilli(),
		})
	}

	// 保存会话
	err := s.agent.ChatRepo.CreateSession(ctx, session)
	if err != nil {
		return nil, err
	}

	// 保存系统消息
	for _, msg := range session.Messages {
		err = s.agent.ChatRepo.AddMessage(ctx, &msg)
		if err != nil {
			return nil, err
		}
	}

	sessionInfo, err := s.getSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	return sessionInfo, nil
}

// GetSession 获取对话会话
func (s *ChatHandler) getSession(ctx context.Context, sessionID string) (*models.ChatSessionInfo, error) {

	sessionResp := &models.ChatSessionInfo{}

	// 检查ChatRepo是否初始化
	if s.agent.ChatRepo == nil {
		return nil, fmt.Errorf("chat repository not initialized")
	}
	session, err := s.agent.ChatRepo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, nil
	}

	sessionResp.SessionID = session.SessionUID
	sessionResp.AnalysisUID = session.AnalysisUID
	sessionResp.Title = session.Title
	sessionResp.AlertData = session.AlertData
	sessionResp.CreateTimestamp = session.CreateTimestamp
	sessionResp.UpdateTimestamp = session.UpdateTimestamp

	messages, err := s.agent.ChatRepo.GetSessionMessages(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	for _, msg := range messages {
		sessionResp.Messages = append(sessionResp.Messages, models.ChatMessageItem{
			MessageUID:      msg.MessageUID,
			Role:            msg.Role,
			Content:         msg.Content,
			SubmitTimestamp: msg.SubmitTimestamp,
		})
	}
	return sessionResp, nil
}

// ListSessions 获取对话会话列表
func (s *ChatHandler) listSessions(ctx context.Context, page, pageSize int) (*models.ChatSessionListResponse, error) {
	// 检查ChatRepo是否初始化
	if s.agent.ChatRepo == nil {
		return nil, fmt.Errorf("chat repository not initialized")
	}
	sessions, count, err := s.agent.ChatRepo.ListSessions(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}

	items := make([]models.ChatSessionItem, 0)
	for _, session := range sessions {
		items = append(items, models.ChatSessionItem{
			SessionID:       session.SessionUID,
			AnalysisUID:     session.AnalysisUID,
			Title:           session.Title,
			AlertData:       session.AlertData,
			CreateTimestamp: session.CreateTimestamp,
			UpdateTimestamp: session.UpdateTimestamp,
		})
	}
	return &models.ChatSessionListResponse{
		Total:    count,
		Items:    items,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// DeleteSession 删除对话会话
func (s *ChatHandler) deleteSession(ctx context.Context, sessionID string) error {
	// 检查ChatRepo是否初始化
	if s.agent.ChatRepo == nil {
		return fmt.Errorf("chat repository not initialized")
	}
	return s.agent.ChatRepo.DeleteSession(ctx, sessionID)
}

// SendMessage 发送消息
func (s *ChatHandler) sendMessage(ctx context.Context, req *models.SendMessageRequest) (string, error) {
	// 检查ChatRepo是否初始化
	if s.agent.ChatRepo == nil {
		return "", fmt.Errorf("chat repository not initialized")
	}

	// 获取会话
	fmt.Println("req.SessionID::", req.SessionID)
	session, err := s.agent.ChatRepo.GetSessionByID(ctx, req.SessionID)
	if err != nil {
		return "", err
	}

	if session == nil {
		return "", fmt.Errorf("chat session not found")
	}

	// 添加用户消息
	userMessage := &models.ChatMessage{
		SessionUID:      req.SessionID,
		Role:            "user",
		Content:         req.Message,
		SubmitTimestamp: time.Now().UnixMilli(),
	}
	err = s.agent.ChatRepo.AddMessage(ctx, userMessage)
	if err != nil {
		return "", err
	}

	// 构建聊天历史
	chatHistory := make([]map[string]interface{}, 0)
	for _, msg := range session.Messages {
		chatHistory = append(chatHistory, map[string]interface{}{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}
	chatHistory = append(chatHistory, map[string]interface{}{
		"role":    "user",
		"content": req.Message,
	})

	// 调用智能体处理消息
	response, err := s.handleChatMessage(ctx, req.Message, session.AlertData, chatHistory)
	if err != nil {
		return "", err
	}

	// 添加AI消息
	aiMessage := &models.ChatMessage{
		SessionUID:      req.SessionID,
		Role:            "agent",
		Content:         response,
		SubmitTimestamp: time.Now().UnixMilli(),
	}
	err = s.agent.ChatRepo.AddMessage(ctx, aiMessage)
	if err != nil {
		return "", err
	}

	return response, nil
}

// handleChatMessage 处理聊天消息
func (s *ChatHandler) handleChatMessage(ctx context.Context, message string, alertData string, chatHistory []map[string]interface{}) (string, error) {
	// 这里可以集成LLM模型来处理消息
	// 暂时返回模拟响应
	return fmt.Sprintf("这是对您消息的响应：%s", message), nil
}

// QueryAlertInfo 查询告警信息
func (s *ChatHandler) queryAlertInfo(ctx context.Context, req *models.AlertQueryRequest) (string, error) {
	// 这里可以实现告警信息查询逻辑
	// 暂时返回模拟响应
	return fmt.Sprintf("这是对告警查询的响应：%s", req.Query), nil
}
