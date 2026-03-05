package handlers

import (
	"soc_agent/internal/agent"

	"github.com/gin-gonic/gin"
)

// SetupRouter 配置路由
func SetupRouter(agent *agent.SOCAgent) *gin.Engine {
	// 创建Gin引擎
	r := gin.Default()

	// 创建告警处理器
	alertHandler := NewAlertHandler(agent)
	// 创建看板处理器
	dashboardHandler := NewDashboardHandler(agent.DashboardRepo)
	// 创建提示词管理处理器
	promptHandler := NewPromptTemplateHandler(agent.PromptTemplateRepo)
	// 创建向量库处理器
	vectorHandler := NewVectorHandler(agent.AlertAnalysisRepo, agent.Milvus)

	// API路由组
	api := r.Group("/api/v1")
	{
		// 告警分析路由
		api.POST("/alert/analyze", alertHandler.AnalyzeAlert)
		// 异步告警分析路由
		api.POST("/alert/analyze/async", alertHandler.SubmitAlertAnalysis)
		// 健康检查路由
		api.GET("/health", alertHandler.HealthCheck)
		// 反馈提交路由
		api.POST("/alert/feedback", alertHandler.HandleFeedback)
		// 反馈数据列表查询路由
		api.GET("/alert/feedback/list", alertHandler.GetFeedbackList)
		// 反馈数据详情查询路由
		api.GET("/alert/feedback/:id", alertHandler.GetFeedbackByID)
		// 反馈数据删除路由
		api.DELETE("/alert/feedback/:id", alertHandler.DeleteFeedback)
		// 反馈数据更新路由
		api.PUT("/alert/feedback/:id", alertHandler.UpdateFeedback)
		// 告警分析详情查询路由
		api.GET("/alert/analysis/result/:id", alertHandler.GetAlertAnalysisByID)
		// 告警分析列表查询路由
		api.GET("/alert/analysis/result/list", alertHandler.GetAlertAnalysisList)
		// 任务管理列表查询路由
		api.GET("/alert/analysis/task/list", alertHandler.GetAnalysisTaskList)
		// 告警分析workflow日志查询路由
		api.GET("/alert/analysis/task/:id/workflow", alertHandler.GetWorkflowLog)

		// 看板路由
		api.GET("/dashboard/overview", dashboardHandler.GetOverview)
		api.GET("/dashboard/trend", dashboardHandler.GetTrend)
		api.GET("/dashboard/detail", dashboardHandler.GetDetail)
		api.GET("/dashboard/efficiency", dashboardHandler.GetEfficiency)

		// 提示词模板管理路由
		api.POST("/prompt/template", promptHandler.CreatePromptTemplate)               // 创建提示词模板
		api.GET("/prompt/template", promptHandler.GetPublishedPromptTemplateByKey)     // 根据key获取当前发布的提示词模板
		api.POST("/prompt/template/version", promptHandler.GetPromptTemplateByVersion) // 根据key和版本获取提示词模板
		api.GET("/prompt/template/list", promptHandler.ListPromptTemplateList)         // 获取提示词模板列表
		api.PUT("/prompt/template/status", promptHandler.UpdatePromptStatus)           // 更新提示词模板状态
		api.PUT("/prompt/template/rollback", promptHandler.RollbackPrompt)             // 回滚提示词模板到指定版本
		api.PUT("/prompt/template", promptHandler.UpdatePrompt)                        // 更新提示词模板内容（创建新版本）
		api.GET("/prompt/template/version/count", promptHandler.GetPromptVersionCount) // 获取提示词模板版本数量
		api.DELETE("/prompt/template", promptHandler.DeletePromptTemplate)             // 软删除提示词模板

		// 知识库检索路由
		api.POST("/vector/search", vectorHandler.GetAllVectorData)
		api.POST("/vector/search/analysis", vectorHandler.SearchByAnalysisID)
	}

	// 为CSS和JS目录提供静态文件服务
	r.Static("/images", "./frontend/images")
	r.Static("/css", "./frontend/css")
	r.Static("/js", "./frontend/js")

	// 为根路径提供index.html文件
	r.StaticFile("/", "./frontend/index.html")
	// 为所有其他路径提供index.html文件，支持前端路由
	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/index.html")
	})

	return r
}
