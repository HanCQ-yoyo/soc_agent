package handlers

import (
	"net/http"

	"soc_agent/internal/consts"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/mongo"

	"github.com/gin-gonic/gin"
)

// PromptTemplateHandler 提示词管理处理器
type PromptTemplateHandler struct {
	promptTemplateRepo *mongo.PromptTemplateRepo
}

// NewPromptTemplateHandler 创建提示词管理处理器实例
func NewPromptTemplateHandler(promptTemplateRepo *mongo.PromptTemplateRepo) *PromptTemplateHandler {
	return &PromptTemplateHandler{
		promptTemplateRepo: promptTemplateRepo,
	}
}

// CreatePromptTemplate 创建新的提示词模板
func (h *PromptTemplateHandler) CreatePromptTemplate(c *gin.Context) {
	var request models.CreatePromptTemplateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 检查key是否已存在
	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), request.PromptKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板版本失败: " + err.Error(),
		})
		return
	}

	if len(promptList) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "提示词模板key已存在",
		})
		return
	}

	newPrompt := &models.PromptTemplate{
		PromptTemplateUID:  mongo.GetFieldUID(consts.PromptTemplateFieldUIDPrefix),
		PromptTemplateKey:  request.PromptKey,
		PromptTemplateName: request.PromptName,
		Description:        request.Description,
		SystemMessage:      request.SystemMessage,
		AssistantMessage:   request.AssistantMessage,
		UserMessage:        request.UserMessage,
		PublishStatus:      string(consts.PromptPublishStatusActive),
		CreatedBy:          "admin",
		UpdatedBy:          "admin",
	}

	err = h.promptTemplateRepo.Create(c.Request.Context(), newPrompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "创建提示词模板成功",
		"data":    newPrompt,
	})
}

// GetPromptTemplateByKey 根据key获取最新发布的提示词模板
func (h *PromptTemplateHandler) GetPublishedPromptTemplateByKey(c *gin.Context) {
	promptKey := c.Query("prompt_template_key")
	if promptKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "缺少prompt_template_key参数",
		})
		return
	}

	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), promptKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取提示词模板成功",
		"data":    promptList,
	})
}

// GetPromptByVersion 根据key和版本获取提示词模板
func (h *PromptTemplateHandler) GetPromptTemplateByVersion(c *gin.Context) {
	var req models.GetPromptTemplateByVersionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	prompt, err := h.promptTemplateRepo.GetByVersion(c.Request.Context(), req.PromptKey, req.Version)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取提示词模板成功",
		"data":    prompt,
	})
}

// ListPromptVersions 获取提示词模板版本列表
// 如果提供了prompt_key参数，则获取指定key的所有版本
// 如果没有提供prompt_key参数，则获取所有提示词模板的最新版本
func (h *PromptTemplateHandler) ListPromptTemplateList(c *gin.Context) {
	promptKey := c.Query("prompt_key")

	var prompts []*models.PromptTemplate
	var err error

	if promptKey != "" {
		// 获取指定key的所有版本
		prompts, err = h.promptTemplateRepo.ListByKey(c.Request.Context(), promptKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取提示词模板版本列表失败: " + err.Error(),
			})

			return
		}
	} else {
		// 获取所有提示词模板的最新版本
		prompts, err = h.promptTemplateRepo.ListPromptTemplate(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取提示词模板列表失败: " + err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取提示词模板列表成功",
		"data":    prompts,
	})
}

// UpdatePromptStatus 更新提示词模板状态
func (h *PromptTemplateHandler) UpdatePromptStatus(c *gin.Context) {
	var request models.UpdatePromptTemplateStatusRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 验证template_uid是否存在
	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), request.TemplateKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板版本失败: " + err.Error(),
		})
		return
	}
	if len(promptList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "提示词模板UID不存在",
		})
		return
	}

	err = h.promptTemplateRepo.UpdatePublishStatus(c.Request.Context(),
		request.TemplateKey, request.PromptTemplateUID,
		request.Status, "admin")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新提示词模板状态失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新提示词模板状态成功",
	})
}

// RollbackPrompt 回滚到指定版本
func (h *PromptTemplateHandler) RollbackPrompt(c *gin.Context) {
	var request models.RollbackPromptVersionRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 验证key和version对应
	prompt, err := h.promptTemplateRepo.GetByVersion(c.Request.Context(), request.PromptKey, request.Version)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板版本失败: " + err.Error(),
		})
		return
	}
	if prompt == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "提示词模板UID不存在",
		})
		return
	}

	updatedBy := "admin"
	err = h.promptTemplateRepo.Rollback(c.Request.Context(),
		request.PromptKey, request.Version, updatedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "回滚提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "回滚提示词模板成功",
	})
}

// UpdatePrompt 更新提示词模板内容（创建新版本）
func (h *PromptTemplateHandler) UpdatePrompt(c *gin.Context) {
	var request models.UpdatePromptTemplateRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 验证Key对应
	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), request.PromptKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板版本失败: " + err.Error(),
		})
		return
	}
	if len(promptList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "提示词模板UID不存在",
		})
		return
	}

	prompt := &models.PromptTemplate{
		PromptTemplateKey:  request.PromptKey,
		PromptTemplateName: request.PromptName,
		Description:        request.Description,
		SystemMessage:      request.SystemMessage,
		AssistantMessage:   request.AssistantMessage,
		UserMessage:        request.UserMessage,
		PublishStatus:      request.PublishStatus,
		UpdatedBy:          "admin",
	}

	err = h.promptTemplateRepo.CreateVersion(c.Request.Context(), prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新提示词模板成功",
	})
}

func (h *PromptTemplateHandler) GetPromptVersionCount(c *gin.Context) {
	promptKey := c.Query("prompt_template_key")
	if promptKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: prompt_template_key不能为空",
		})
		return
	}

	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), promptKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板版本数量失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取提示词模板版本数量成功",
		"data":    len(promptList),
	})
}

// DeletePromptTemplate 软删除提示词模板
func (h *PromptTemplateHandler) DeletePromptTemplate(c *gin.Context) {
	var request struct {
		PromptKey string `json:"prompt_key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	// 检查promptKey是否存在
	promptList, err := h.promptTemplateRepo.ListByKey(c.Request.Context(), request.PromptKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取提示词模板失败: " + err.Error(),
		})
		return
	}

	if len(promptList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "提示词模板不存在",
		})
		return
	}

	// 执行软删除
	err = h.promptTemplateRepo.SoftDelete(c.Request.Context(), request.PromptKey, "admin")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除提示词模板失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除提示词模板成功",
	})
}
