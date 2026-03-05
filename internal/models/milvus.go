package models

type MilvusData struct {
	ID              string                 `json:"id"`
	MilvusVectorID  string                 `json:"milvus_vector_id"`
	AnalysisID      string                 `json:"analysis_id"`
	Metadata        map[string]interface{} `json:"metadata"`
	Content         string                 `json:"content"`
	Score           float32                `json:"score"`
	CreateTimestamp int64                  `json:"create_timestamp"`
}
