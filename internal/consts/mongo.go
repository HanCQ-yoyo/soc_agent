package consts

type FieldUIDPrefix string

const (
	FieldUIDPrefixAlertAnalysis  FieldUIDPrefix = "alert_analysis_"
	FieldUIDPrefixAlertFeedback  FieldUIDPrefix = "alert_feedback_"
	FieldUIDPrefixAlertFeature   FieldUIDPrefix = "alert_feature_"
	MilvusVectorFieldUIDPrefix   FieldUIDPrefix = "milvus_vector_"
	PromptTemplateFieldUIDPrefix FieldUIDPrefix = "prompt_template_"
	ChatSessionFieldUIDPrefix    FieldUIDPrefix = "chat_session_"
	ChatMessageFieldUIDPrefix    FieldUIDPrefix = "chat_msg_"
)
