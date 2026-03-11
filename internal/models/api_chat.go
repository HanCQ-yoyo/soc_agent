package models

// CreateChatSessionRequest 创建对话会话请求
type CreateChatSessionRequest struct {
	Title       string `json:"title,omitempty"`
	AlertData   string `json:"alert_data,omitempty"`
	AnalysisUID string `json:"analysis_uid,omitempty"`
}

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	SessionID string `json:"session_id"`
	Message   string `json:"message"`
}

type ChatSessionInfo struct {
	SessionID       string            `json:"session_id"`
	Title           string            `json:"title"`
	AnalysisUID     string            `json:"analysis_uid,omitempty"`
	AlertData       string            `json:"alert_data,omitempty"`
	Messages        []ChatMessageItem `json:"messages"`
	CreateTimestamp int64             `json:"create_timestamp"`
	UpdateTimestamp int64             `json:"update_timestamp"`
}

type ChatMessageItem struct {
	MessageUID      string `json:"message_uid"`
	Role            string `json:"role"` // user, agent, system
	Content         string `json:"content"`
	SubmitTimestamp int64  `json:"submit_timestamp"`
}

// ChatMessageResponse 聊天消息响应
type ChatMessageResponse struct {
	Response string `json:"response"`
}

type ChatSessionItem struct {
	SessionID       string `json:"session_id"`
	AnalysisUID     string `json:"analysis_uid,omitempty"`
	Title           string `json:"title"`
	AlertData       string `json:"alert_data,omitempty"`
	CreateTimestamp int64  `json:"create_timestamp"`
	UpdateTimestamp int64  `json:"update_timestamp"`
}

// ChatSessionListResponse 对话会话列表响应
type ChatSessionListResponse struct {
	Total    int64             `json:"total"`
	Items    []ChatSessionItem `json:"items"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

// AlertQueryRequest 告警信息查询请求
type AlertQueryRequest struct {
	SessionID string      `json:"session_id"`
	Query     string      `json:"query"`
	AlertData interface{} `json:"alert_data,omitempty"`
}

// AlertQueryResponse 告警信息查询响应
type AlertQueryResponse struct {
	Result string `json:"result"`
}
