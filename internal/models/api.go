package models

import "soc_agent/internal/consts"

// AlertRequest 告警分析请求
type AlertRequest struct {
	// 告警数据
	AlertData string `json:"alert_data" binding:"required"`
	// 告警来源
	Source string `json:"source" binding:"required"`
}

// AlertResponse 告警分析响应
type AlertResponse struct {
	// 告警数据关键字段
	// 告警唯一ID 用于定位具体告警
	AlertUUID string `bson:"alert_uuid" json:"alert_uuid"`
	// 事件发生时间
	AlertEventTimestamp string `bson:"alert_event_timestamp" json:"alert_event_timestamp"`
	// 告警名称
	AlertName string `bson:"alert_name" json:"alert_name"`
	// 告警描述
	AlertDescription string `bson:"alert_description" json:"alert_description"`
	// 告警分类
	AlertCategory string `bson:"alert_category" json:"alert_category"`
	// 资产ID
	AlertAssetID string `bson:"alert_asset_id" json:"alert_asset_id"`
	// 资产类型（设备ID、域名、主机IP等）
	AlertAssetType string `bson:"alert_asset_type" json:"alert_asset_type"`
	// 资产负责人
	AlertAssetOwner string `bson:"alert_asset_owner" json:"alert_asset_owner"`
	// 告警来源IP
	AlertSourceIP string `bson:"alert_source_ip" json:"alert_source_ip"`
	// 告警来源端口
	AlertSourcePort string `bson:"alert_source_port" json:"alert_source_port"`
	// 告警目标IP
	AlertDestinationIP string `bson:"alert_destination_ip" json:"alert_destination_ip"`
	// 告警目标端口
	AlertDestinationPort string `bson:"alert_destination_port" json:"alert_destination_port"`
	// 方向
	AlertDirection string `bson:"alert_direction" json:"alert_direction"`
	// 告警来源
	AlertSource string `bson:"alert_source" json:"alert_source"`
	// 告警级别
	AlertSeverity string `bson:"alert_severity" json:"alert_severity"`
	// 事件摘要（模型生成）
	AlertEventSummary string `bson:"alert_event_summary" json:"alert_event_summary"`

	// 原始告警数据
	RawDataAlert string `bson:"raw_data_alert" json:"raw_data_alert"`
	// 通用告警模型的结果
	RawDataGeneralAlertModel string `bson:"raw_data_general_alert_model" json:"raw_data_general_alert_model"`

	// 智能研判结果信息
	// 分析ID
	AnalysisID string `bson:"analysis_id" json:"analysis_id"`
	// 分析开始时间
	AnalysisStartTime int64 `bson:"analysis_start_time" json:"analysis_start_time"`
	// 分析结束时间
	AnalysisEndTime int64 `bson:"analysis_end_time" json:"analysis_end_time"`
	// 分析结果类型（false_positive, true_positive, invalid, suspicious）
	AnalysisResultType consts.CorrectResultType `bson:"analysis_result_type" json:"analysis_result_type"`
	// 分析结果描述
	AnalysisResultDesc string `bson:"analysis_result_desc" json:"analysis_result_desc"`
	// 处置建议
	AnalysisDisposalSuggestion string `bson:"analysis_disposal_suggestion" json:"analysis_disposal_suggestion"`
	// 初步分析结果
	AnalysisInitialDetail string `bson:"analysis_initial_detail" json:"analysis_initial_detail"`
	// 分析详情
	AnalysisDeepDetail string `bson:"analysis_deep_detail" json:"analysis_deep_detail"`
	// 分析结果描述
	AnalysisRelatedIOCs []string `bson:"analysis_related_iocs" json:"analysis_related_iocs"`
	// 告警上下文信息
	AnalysisAlertContext interface{} `bson:"analysis_alert_context" json:"analysis_alert_context"`
	// 置信度
	AnalysisConfidence float64 `bson:"analysis_confidence" json:"analysis_confidence"`
	// 证据链特征
	AnalysisEvidenceChain string `bson:"analysis_evidence_chain" json:"analysis_evidence_chain"`

	// 工具结果
	ToolsRequiredList string                   `bson:"tools_required_list" json:"tools_required_list"`
	ToolsResult       []map[string]interface{} `bson:"tools_result" json:"tools_result"`

	// 知识检索结果
	KnowledgeBaseResults interface{} `bson:"knowledge_base_results" json:"knowledge_base_results"`
}

// HealthCheckResponse 健康检查响应
type HealthCheckResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Time    string `json:"time"`
}

// FeedbackRequest 用户反馈请求
type FeedbackRequest struct {
	// 分析ID
	AnalysisID string `json:"analysis_id" binding:"required"`
	// 反馈类型:①研判正确 ②误判（研判结果错误，如真告警标误报 / 误告警标真报） ③漏判（未研判出攻击） ④研判不精准（结论模糊 / 置信度错误）
	FeedbackType string `json:"feedback_type" binding:"required"`
	// 修正后研判结果:若反馈为「误判 / 漏判 / 不精准」，需选择修正结果：如「真实攻击」「误报」「可疑需人工复核」
	CorrectResult string `json:"correct_result" binding:"required"`
	// 反馈原因
	FeedbackReason string `json:"feedback_reason"`
	// 关键特征标注
	CoreFeatureTags []string `json:"core_feature_tags"`
	// 用户ID
	UserID string `json:"c"`
}
