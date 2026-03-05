package models

import "time"

// PromptTemplate 提示词模板模型
type PromptTemplate struct {
	ID                 string    `bson:"_id,omitempty" json:"id"`
	PromptTemplateUID  string    `bson:"prompt_template_uid" json:"prompt_template_uid"`
	PromptTemplateKey  string    `bson:"prompt_template_key" json:"prompt_template_key"`
	PromptTemplateName string    `bson:"prompt_template_name" json:"prompt_template_name"`
	Description        string    `bson:"description" json:"description"`
	SystemMessage      string    `bson:"system_message" json:"system_message"`       // 系统角色提示词
	AssistantMessage   string    `bson:"assistant_message" json:"assistant_message"` // 助手角色提示词
	UserMessage        string    `bson:"user_message" json:"user_message"`           // 用户角色提示词
	Version            int       `bson:"version" json:"version"`
	PublishStatus      string    `bson:"publish_status" json:"publish_status"` // draft, published
	IsDeleted          bool      `bson:"is_deleted" json:"is_deleted"`         // 软删除标记
	DeleteTimestamp    time.Time `bson:"delete_timestamp" json:"delete_timestamp"` // 删除时间戳
	CreateTimestamp    time.Time `bson:"created_timestamp" json:"created_timestamp"`
	UpdateTimestamp    time.Time `bson:"updated_timestamp" json:"updated_timestamp"`
	CreatedBy          string    `bson:"created_by" json:"created_by"`
	UpdatedBy          string    `bson:"updated_by" json:"updated_by"`
	DeletedBy          string    `bson:"deleted_by" json:"deleted_by"`         // 删除操作人
}
