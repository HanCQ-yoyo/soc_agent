package models

import (
	"time"
)

type AlertFeature struct {
	ID             string          `json:"id" bson:"_id"`
	AnalysisUID    string          `json:"analysis_uid" bson:"analysis_uid"`
	StructFeature  []StructFeature `json:"struct_feature" bson:"struct_feature"`
	CoreFeatureMD5 string          `json:"core_feature_md5" bson:"core_feature_md5"`
	MilvusVectorID string          `json:"milvus_vector_id" bson:"milvus_vector_id"`
	CreateTime     time.Time       `json:"create_time" bson:"create_time"`
}

type StructFeature struct {
	Key   string      `json:"key" bson:"key"`
	Value interface{} `json:"value" bson:"value"`
}
