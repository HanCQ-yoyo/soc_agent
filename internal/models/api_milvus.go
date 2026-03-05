package models

type SearchRequest struct {
	Page           int64   `json:"page" default:"1" binding:"min=1,required"`
	PageSize       int64   `json:"page_size" default:"10" binding:"min=1,max=100,required"`
	QueryExpr      string  `json:"query_expr"`
	SimilarKeyword string  `json:"similar_keyword"`
	TopK           int     `json:"top_k" default:"10"  binding:"min=1,max=100,required"`
	ScoreThreshold float64 `json:"score_threshold" default:"0.5" binding:"min=0,max=1,required" `
	MitricType     string  `json:"metric_type" default:"COSINE" binding:"min=1,max=100,required"`
}

type SearchByAnalysisUIDRequest struct {
	Page           int64   `json:"page" default:"1" binding:"min=1,required"`
	PageSize       int64   `json:"page_size" default:"10" binding:"min=1,max=100,required"`
	AnalysisUID    string  `json:"analysis_uid" binding:"required"`
	TopK           int     `json:"top_k" default:"10" binding:"min=1,max=100,required"`
	ScoreThreshold float64 `json:"score_threshold" default:"0.5" binding:"min=0,max=1,required"`
	MitricType     string  `json:"metric_type" default:"COSINE" binding:"min=1,max=100,required"`
}
