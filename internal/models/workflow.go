package models

import (
	"soc_agent/internal/consts"
)

// WorkflowInput 工作流输入
type WorkflowInput struct {
	AnalysisID string `json:"analysis_id"`
	AlertData  string `json:"alert_data"`
	Source     string `json:"source"`
	Timestamp  int64  `json:"timestamp"`
}

// InitialJudgmentResult 首次研判结果
type InitialJudgmentResult struct {
	ResultType     consts.CorrectResultType `json:"result_type"`
	Reason         string                   `json:"reason"`
	AnalysisDetail string                   `json:"analysis_detail"`
	AlertContext   interface{}              `json:"alert_context"`
	Confidence     float64                  `json:"confidence"`
}

// KnowledgeRetrievalResult 知识检索结果
type KnowledgeRetrievalResult struct {
	KnowledgeBaseResults interface{} `json:"knowledge_base_results"`
}

// DeepJudgmentInput 深度研判输入
//
//	type DeepJudgmentInput struct {
//		AnalysisID           string                 `json:"analysis_id"`
//		AlertData            map[string]interface{} `json:"alert_data"`
//		Source               string                 `json:"source"`
//		AlertContext         map[string]interface{} `json:"alert_context"`
//		KnowledgeBaseResults string                 `json:"knowledge_base_results"`
//		AssetInfo            string                 `json:"asset_info"`
//		ThreatIntelligence   string                 `json:"threat_intelligence"`
//		VulnerabilityInfo    string                 `json:"vulnerability_info"`
//	}
type DeepJudgmentInput struct {
	InitialJudgmentResult    string `json:"initial_judgment_result"`
	KnowledgeBaseResult      string `json:"knowledge_base_result"`
	ToolsResult              string `json:"tools_result"`
	RawDataGeneralAlertModel string `json:"raw_data_general_alert_model"`
}

// DeepJudgmentResult 深度研判结果
type DeepJudgmentResult struct {
	Severity          string                   `json:"severity"`
	AttackType        string                   `json:"attack_type"`
	RecommendedAction string                   `json:"recommended_action"`
	RelatedIOCs       []string                 `json:"related_iocs"`
	Confidence        float64                  `json:"confidence"`
	DetailedAnalysis  string                   `json:"detailed_analysis"`
	EvidenceChain     string                   `json:"evidence_chain"`
	ResultType        consts.CorrectResultType `json:"result_type"`
}

// ReflectInput 反思输入
type ReflectInput struct {
	InitialResult *InitialJudgmentResult `json:"initial_result"`
	DeepResult    *DeepJudgmentResult    `json:"deep_result"`
}
