package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"soc_agent/internal/models"
)

const (
	CollectionAlertFeedback = "alert_feedback"
)

// AlertFeedbackRepo 告警反馈存储库
type AlertFeedbackRepo struct {
	client *Client
}

// NewAlertFeedbackRepo 创建告警反馈存储库实例
func NewAlertFeedbackRepo(client *Client) *AlertFeedbackRepo {
	return &AlertFeedbackRepo{
		client: client,
	}
}

// GetFeedbackByAnalysisUID 根据analysis_uid查询对应反馈数据
func (r *AlertFeedbackRepo) GetFeedbackByAnalysisUID(analysisUID string) ([]models.AlertFeedback, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"analysis_uid": analysisUID,
	}

	col := r.client.GetCollection(CollectionAlertFeedback)

	cursor, err := col.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "feedback_time", Value: -1}}))
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find feedback: %w", err)
	}
	defer cursor.Close(ctx)

	var feedbacks []models.AlertFeedback
	if err := cursor.All(ctx, &feedbacks); err != nil {
		return nil, fmt.Errorf("failed to decode feedback: %w", err)
	}

	return feedbacks, nil
}

// CreateFeedback 创建新的反馈数据
func (r *AlertFeedbackRepo) CreateFeedback(feedback *models.AlertFeedback) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if feedback.FeedbackTime.IsZero() {
		feedback.FeedbackTime = time.Now()
	}
	// 如果没有ID，生成一个
	if feedback.ID == "" {
		feedback.ID = primitive.NewObjectID().Hex()
	}
	col := r.client.GetCollection(CollectionAlertFeedback)

	_, err := col.InsertOne(ctx, feedback)
	if err != nil {
		return fmt.Errorf("failed to insert feedback: %w", err)
	}

	return nil
}

// ListFeedbacks 获取反馈数据列表
func (r *AlertFeedbackRepo) ListFeedbacks(filter bson.M, page, pageSize int) ([]models.AlertFeedback, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertFeedback)

	// 计算总数
	count, err := col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count feedbacks: %w", err)
	}

	// 分页查询
	offset := (page - 1) * pageSize
	findOptions := options.Find()
	findOptions.SetSkip(int64(offset))
	findOptions.SetLimit(int64(pageSize))
	findOptions.SetSort(bson.D{{Key: "feedback_time", Value: -1}})
	cursor, err := col.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find feedbacks: %w", err)
	}
	defer cursor.Close(ctx)

	var feedbacks []models.AlertFeedback
	if err := cursor.All(ctx, &feedbacks); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to decode feedbacks: %w", err)
	}

	return feedbacks, count, nil
}

// DeleteFeedback 删除反馈数据
func (r *AlertFeedbackRepo) DeleteFeedback(feedbackID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"_id": feedbackID,
	}

	col := r.client.GetCollection(CollectionAlertFeedback)

	result, err := col.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete feedback: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("feedback not found")
	}

	return nil
}

// UpdateFeedback 更新反馈数据
func (r *AlertFeedbackRepo) UpdateFeedback(feedbackID string, update bson.M) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"_id": feedbackID,
	}

	col := r.client.GetCollection(CollectionAlertFeedback)

	result, err := col.UpdateOne(ctx, filter, bson.M{"$set": update})
	if err != nil {
		return fmt.Errorf("failed to update feedback: %w", err)
	}

	if result.ModifiedCount == 0 {
		return fmt.Errorf("feedback not found or no changes made")
	}

	return nil
}

// GetFeedbackByID 根据ID获取反馈数据
func (r *AlertFeedbackRepo) GetFeedbackByID(feedbackID string) (*models.AlertFeedback, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"_id": feedbackID,
	}

	col := r.client.GetCollection(CollectionAlertFeedback)

	var feedback models.AlertFeedback
	err := col.FindOne(ctx, filter).Decode(&feedback)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("feedback not found")
		}
		return nil, fmt.Errorf("failed to get feedback: %w", err)
	}

	return &feedback, nil
}
