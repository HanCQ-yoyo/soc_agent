package models

import (
	"time"

	"github.com/cloudwego/eino/components/retriever"
)

// AlertAnalysis MongoDB存储模型
type AlertAnalysis struct {
	// 唯一标识符（MongoDB自动生成）
	ID string `bson:"_id,omitempty" json:"id"`

	Detail AlertResponse `bson:"detail" json:"detail"`

	// 研判结果运营处置
	// 运营处置状态
	DisposalStatus string `bson:"disposal_status" json:"disposal_status"`

	// 错误信息
	ErrMessage string `bson:"err_message" json:"err_message"`

	CallbackInfo []retriever.CallbackOutput `bson:"callback_info" json:"callback_info"`

	// 存储时间戳
	CreateTimestamp int64 `bson:"create_timestamp" json:"create_timestamp"`
	// 更新时间戳
	UpdateTimestamp int64 `bson:"update_timestamp" json:"update_timestamp"`
}

type WorkflowLog struct {
	ExecTime   time.Time `json:"exec_time"`
	NodeName   string    `json:"node_name"`
	NodeType   string    `json:"node_type"`
	Component  string    `json:"component"`
	Input      string    `json:"input"`
	Output     string    `json:"output"`
	ErrMessage string    `json:"err_message"`
}

// AlertAnalysisFilter 告警分析筛选条件
type AlertAnalysisFilter struct {
	// 分析ID
	AnalysisID string `form:"analysis_id" json:"analysis_id"`
	// 来源
	Source string `form:"source" json:"source"`
	// 结果类型
	ResultType string `form:"result_type" json:"result_type"`
	// 开始时间
	StartTime string `form:"start_time" json:"start_time"`
	// 结束时间
	EndTime string `form:"end_time" json:"end_time"`
	// 原始告警
	RawAlert string `form:"raw_alert" json:"raw_alert"`
	// 状态
	Status string `form:"status" json:"status"`
	// 页码
	Page int `form:"page" json:"page" binding:"min=1"`
	// 每页大小
	PageSize int `form:"page_size" json:"page_size" binding:"min=1,max=100"`
}

// AlertAnalysisListResponse 告警分析列表响应
type AlertAnalysisListResponse struct {
	// 总数
	Total int64 `json:"total"`
	// 数据
	Data []AlertAnalysis `json:"data"`
	// 页码
	Page int `json:"page"`
	// 每页大小
	PageSize int `json:"page_size"`
	// 总页数
	TotalPages int `json:"total_pages"`
}
