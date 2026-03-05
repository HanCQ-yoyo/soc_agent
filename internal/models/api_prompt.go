package models

type CreatePromptTemplateRequest struct {
	PromptKey        string `json:"prompt_key" binding:"required"`
	PromptName       string `json:"prompt_name" binding:"required"`
	Description      string `json:"description" binding:"required"`
	SystemMessage    string `json:"system_message" binding:"required"`
	AssistantMessage string `json:"assistant_message"`
	UserMessage      string `json:"user_message" binding:"required"`
}

type GetPromptTemplateByVersionRequest struct {
	PromptKey string `json:"prompt_key" binding:"required"`
	Version   int    `json:"version" binding:"required,min=1"`
}

type RollbackPromptVersionRequest struct {
	PromptKey string `json:"prompt_key" binding:"required"`
	Version   int    `json:"version" binding:"required,min=1"`
}

type UpdatePromptTemplateStatusRequest struct {
	PromptTemplateUID string `json:"prompt_template_uid" binding:"required"`
	Status            string `json:"status" binding:"required,oneof=draft published"`
	TemplateKey       string `json:"template_key" binding:"required"`
}

type UpdatePromptTemplateRequest struct {
	PromptKey        string `json:"prompt_key" binding:"required"`
	PromptName       string `json:"prompt_name" binding:"required"`
	Description      string `json:"description" binding:"required"`
	SystemMessage    string `json:"system_message" binding:"required"`
	AssistantMessage string `json:"assistant_message"`
	UserMessage      string `json:"user_message" binding:"required"`
	PublishStatus    string `json:"publish_status" binding:"required,oneof=draft active"`
}
