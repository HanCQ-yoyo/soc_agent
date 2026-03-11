package models

// ChatSession 对话会话模型
type ChatSession struct {
	ID              string        `json:"id" bson:"_id"`
	AnalysisUID     string        `json:"analysis_uid,omitempty" bson:"analysis_uid,omitempty"`
	SessionUID      string        `json:"session_uid" bson:"session_uid"`
	Title           string        `json:"title" bson:"title"`
	Messages        []ChatMessage `json:"messages" bson:"messages"`
	AlertData       string        `json:"alert_data,omitempty" bson:"alert_data,omitempty"`
	CreateTimestamp int64         `json:"create_timestamp" bson:"create_timestamp"`
	UpdateTimestamp int64         `json:"update_timestamp" bson:"update_timestamp"`
}

// ChatMessage 聊天消息模型
type ChatMessage struct {
	ID              string `json:"id" bson:"_id"`
	MessageUID      string `json:"message_uid" bson:"message_uid"`
	SessionUID      string `json:"session_uid" bson:"session_uid"`
	Role            string `json:"role" bson:"role"` // user, agent, system
	Content         string `json:"content" bson:"content"`
	SubmitTimestamp int64  `json:"submit_timestamp" bson:"submit_timestamp"`
}
