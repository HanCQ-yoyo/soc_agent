package models

import "time"

type AlertFeedback struct {
	ID              string    `json:"id" bson:"_id"`
	FeedbackUID     string    `json:"feedback_uid" bson:"feedback_uid"`
	AnalysisUID     string    `json:"analysis_uid" bson:"analysis_uid"`
	FeedbackType    string    `json:"feedback_type" bson:"feedback_type"`
	CorrectResult   string    `json:"correct_result" bson:"correct_result"`
	FeedbackReason  string    `json:"feedback_reason" bson:"feedback_reason"`
	CoreFeatureTags []string  `json:"core_feature_tags" bson:"core_feature_tags"`
	FeedbackUser    string    `json:"feedback_user" bson:"feedback_user"`
	UserRole        string    `json:"user_role" bson:"user_role"`
	FeedbackTime    time.Time `json:"feedback_time" bson:"feedback_time"`
	Status          string    `json:"status" bson:"status"`
}
