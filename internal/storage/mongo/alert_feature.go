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
	CollectionAlertFeature = "alert_feature"
)

// AlertFeatureRepo 告警特征存储库
type AlertFeatureRepo struct {
	client *Client
}

// NewAlertFeatureRepo 创建告警特征存储库实例
func NewAlertFeatureRepo(client *Client) *AlertFeatureRepo {
	return &AlertFeatureRepo{
		client: client,
	}
}

// GetFeatureByCoreFeatureMD5 根据core_feature_md5查询特征表数据
func (r *AlertFeatureRepo) GetFeatureByCoreFeatureMD5(coreFeatureMD5 string) (*models.AlertFeature, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"core_feature_md5": coreFeatureMD5,
	}

	col := r.client.GetCollection(CollectionAlertFeature)

	var feature models.AlertFeature
	if err := col.FindOne(ctx, filter).Decode(&feature); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find feature: %w", err)
	}

	return &feature, nil
}

// GetFeatureByMilvusVectorID 根据milvus_vector_id查询特征表数据
func (r *AlertFeatureRepo) GetFeatureByMilvusVectorID(milvusVectorID string) (*models.AlertFeature, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	filter := bson.M{
		"milvus_vector_id": milvusVectorID,
	}

	col := r.client.GetCollection(CollectionAlertFeature)

	var feature models.AlertFeature
	if err := col.FindOne(ctx, filter).Decode(&feature); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find feature: %w", err)
	}

	return &feature, nil
}

// CreateFeature 创建新的特征数据
func (r *AlertFeatureRepo) CreateFeature(ctx context.Context, feature *models.AlertFeature) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if feature.CreateTime.IsZero() {
		feature.CreateTime = time.Now()
	}
	// 如果没有ID，生成一个
	if feature.ID == "" {
		feature.ID = primitive.NewObjectID().Hex()
	}
	col := r.client.GetCollection(CollectionAlertFeature)

	_, err := col.InsertOne(ctx, feature)
	if err != nil {
		return fmt.Errorf("failed to insert feature: %w", err)
	}

	return nil
}

// ListFeatures 获取特征数据列表
func (r *AlertFeatureRepo) ListFeatures(filter bson.M, page, pageSize int) ([]models.AlertFeature, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertFeature)

	// 计算总数
	count, err := col.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count features: %w", err)
	}

	// 分页查询
	offset := (page - 1) * pageSize
	findOptions := options.Find()
	findOptions.SetSkip(int64(offset))
	findOptions.SetLimit(int64(pageSize))
	findOptions.SetSort(bson.D{{Key: "create_time", Value: -1}})
	cursor, err := col.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find features: %w", err)
	}
	defer cursor.Close(ctx)

	var features []models.AlertFeature
	if err := cursor.All(ctx, &features); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, 0, nil
		}
		return nil, 0, fmt.Errorf("failed to decode features: %w", err)
	}

	return features, count, nil
}
