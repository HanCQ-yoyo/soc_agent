package mongo

import (
	"context"
	"fmt"
	"soc_agent/internal/models"
	"time"

	"soc_agent/internal/consts"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	CollectionPromptTemplate = "settings_agent_prompt_template"
)

// PromptTemplateRepo 提示词模板存储库
type PromptTemplateRepo struct {
	client *Client
}

// NewPromptTemplateRepo 创建提示词模板存储库实例
func NewPromptTemplateRepo(client *Client) *PromptTemplateRepo {
	return &PromptTemplateRepo{
		client: client,
	}
}

// Create 创建新的提示词模板
func (r *PromptTemplateRepo) Create(ctx context.Context, prompt *models.PromptTemplate) error {
	// 生成唯一ID
	if prompt.ID == "" {
		prompt.ID = primitive.NewObjectID().Hex()
	}

	// 设置时间戳
	now := time.Now()
	prompt.CreateTimestamp = now
	prompt.UpdateTimestamp = now
	prompt.IsDeleted = false // 默认未删除

	// 获取下一个版本号
	nextVersion, err := r.getNextVersion(ctx, prompt.PromptTemplateKey)
	fmt.Printf("nextVersion: %d\n", nextVersion)
	if err != nil {
		return err
	}
	prompt.Version = nextVersion

	// 插入文档
	collection := r.client.GetCollection(CollectionPromptTemplate)
	_, err = collection.InsertOne(ctx, prompt)
	if err != nil {
		return fmt.Errorf("failed to create prompt template: %w", err)
	}

	return nil
}

// getNextVersion 获取下一个版本号
func (r *PromptTemplateRepo) getNextVersion(ctx context.Context, promptKey string) (int, error) {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 查询指定promptKey的最大版本号，只查询未删除的记录
	filter := bson.M{
		"prompt_template_key": promptKey,
		"is_deleted":          false,
	}
	options := options.FindOne().SetSort(bson.D{{Key: "version", Value: -1}})

	var result models.PromptTemplate
	err := collection.FindOne(ctx, filter, options).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// 没有找到记录，返回版本1
			return 1, nil
		}
		return 0, fmt.Errorf("failed to get next version: %w", err)
	}

	// 返回最大版本号+1
	return result.Version + 1, nil
}

// GetPublishedByKey 获取指定key的最新发布版本提示词模板
func (r *PromptTemplateRepo) GetPublishedPromptTemplateByKey(ctx context.Context, promptKey string) (*models.PromptTemplate, error) {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 查询指定promptKey且状态为published的最新版本，只查询未删除的记录
	filter := bson.M{
		"prompt_template_key": promptKey,
		"publish_status":      string(consts.PromptPublishStatusActive),
		"is_deleted":          false,
	}
	options := options.FindOne().SetSort(bson.D{{Key: "version", Value: -1}})

	var result models.PromptTemplate
	err := collection.FindOne(ctx, filter, options).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("no published prompt template found for key: %s", promptKey)
		}
		return nil, fmt.Errorf("failed to get prompt template: %w", err)
	}

	return &result, nil
}

// GetByVersion 获取指定key和版本的提示词模板
func (r *PromptTemplateRepo) GetByVersion(ctx context.Context, promptKey string, version int) (*models.PromptTemplate, error) {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 查询指定promptKey和版本的记录，只查询未删除的记录
	filter := bson.M{
		"prompt_template_key": promptKey,
		"version":             version,
		"is_deleted":          false,
	}

	var result models.PromptTemplate
	err := collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("no prompt template found for key: %s and version: %d", promptKey, version)
		}
		return nil, fmt.Errorf("failed to get prompt template: %w", err)
	}

	return &result, nil
}

// ListByKey 获取指定key的所有版本提示词模板
func (r *PromptTemplateRepo) ListByKey(ctx context.Context, promptKey string) ([]*models.PromptTemplate, error) {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 查询指定promptKey的所有记录，按版本降序排序，只查询未删除的记录
	filter := bson.M{
		"prompt_template_key": promptKey,
		"is_deleted":          false,
	}
	options := options.Find().SetSort(bson.D{{Key: "version", Value: -1}})

	cursor, err := collection.Find(ctx, filter, options)
	if err != nil {
		return nil, fmt.Errorf("failed to list prompt templates: %w", err)
	}
	defer cursor.Close(ctx)

	var results []*models.PromptTemplate
	for cursor.Next(ctx) {
		var prompt models.PromptTemplate
		if err := cursor.Decode(&prompt); err != nil {
			return nil, fmt.Errorf("failed to decode prompt template: %w", err)
		}
		results = append(results, &prompt)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return results, nil
}

// UpdateStatus 更新提示词模板状态
func (r *PromptTemplateRepo) UpdatePublishStatus(ctx context.Context, templateKey string,
	templateUID string, pubilshStatus string, updatedBy string) error {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 更新状态，只更新未删除的记录
	filter := bson.M{
		"prompt_template_key": templateKey,
		"prompt_template_uid": templateUID,
		"is_deleted":          false,
	}
	update := bson.M{
		"$set": bson.M{
			"publish_status":   pubilshStatus,
			"update_timestamp": time.Now(),
			"updated_by":       updatedBy,
		},
	}

	result, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update prompt template status: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("prompt template not found: %s", templateUID)
	}

	// 如果状态为active，将其他版本的状态设置为draft
	if pubilshStatus == string(consts.PromptPublishStatusActive) {
		// 先获取当前提示词模板的信息
		var prompt models.PromptTemplate
		err := collection.FindOne(ctx, filter).Decode(&prompt)
		if err != nil {
			return fmt.Errorf("failed to get prompt template: %w", err)
		}

		// 更新其他版本的状态，只更新未删除的记录
		otherFilter := bson.M{
			"prompt_template_key": templateKey,
			"prompt_template_uid": bson.M{"$ne": templateUID},
			"is_deleted":          false,
		}
		otherUpdate := bson.M{
			"$set": bson.M{
				"publish_status":   string(consts.PromptPublishStatusDraft),
				"update_timestamp": time.Now(),
				"updated_by":       updatedBy,
			},
		}

		_, err = collection.UpdateMany(ctx, otherFilter, otherUpdate)
		if err != nil {
			return fmt.Errorf("failed to update other prompt templates: %w", err)
		}
	}

	return nil
}

// Rollback 回滚到指定版本
func (r *PromptTemplateRepo) Rollback(ctx context.Context, promptKey string, version int, updatedBy string) error {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 查找指定版本的提示词模板，只查询未删除的记录
	filter := bson.M{
		"prompt_template_key": promptKey,
		"publish_status":      string(consts.PromptPublishStatusDraft),
		"version":             version,
		"is_deleted":          false,
	}

	var prompt models.PromptTemplate
	err := collection.FindOne(ctx, filter).Decode(&prompt)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return fmt.Errorf("prompt template not found for key: %s and version: %d", promptKey, version)
		}
		return fmt.Errorf("failed to get prompt template: %w", err)
	}

	// 将指定版本的状态设置为active
	err = r.UpdatePublishStatus(ctx, prompt.PromptTemplateKey,
		prompt.PromptTemplateUID, string(consts.PromptPublishStatusActive), updatedBy)
	if err != nil {
		return err
	}

	return nil
}

// Update 更新提示词模板内容（创建新版本）
func (r *PromptTemplateRepo) CreateVersion(ctx context.Context, prompt *models.PromptTemplate) error {
	// 创建新的版本
	newPrompt := &models.PromptTemplate{
		PromptTemplateUID:  GetFieldUID(consts.PromptTemplateFieldUIDPrefix),
		PromptTemplateKey:  prompt.PromptTemplateKey,
		PromptTemplateName: prompt.PromptTemplateName,
		SystemMessage:      prompt.SystemMessage,
		AssistantMessage:   prompt.AssistantMessage,
		UserMessage:        prompt.UserMessage,
		Description:        prompt.Description,
		PublishStatus:      prompt.PublishStatus,
		CreatedBy:          prompt.CreatedBy,
		UpdatedBy:          prompt.UpdatedBy,
	}

	// 插入新的版本
	err := r.Create(ctx, newPrompt)
	if err != nil {
		return fmt.Errorf("failed to create prompt template: %w", err)
	}

	// 更新状态为active
	err = r.UpdatePublishStatus(ctx, prompt.PromptTemplateKey,
		newPrompt.PromptTemplateUID, prompt.PublishStatus,
		newPrompt.UpdatedBy)
	if err != nil {
		return fmt.Errorf("failed to update prompt template status: %w", err)
	}

	return nil

}

// ListAllPrompts 获取所有提示词模板的最新版本
func (r *PromptTemplateRepo) ListPromptTemplate(ctx context.Context) ([]*models.PromptTemplate, error) {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 先获取所有不同的prompt_key，只查询未删除的记录
	filter := bson.M{
		"publish_status": string(consts.PromptPublishStatusActive),
		"is_deleted":     false,
	}
	findOptions := options.Find().SetProjection(bson.M{"prompt_template_key": 1}).
		SetSort(bson.D{{Key: "created_timestamp", Value: -1}})

	cursor, err := collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get prompt template keys: %w", err)
	}
	defer cursor.Close(ctx)

	var promptKeys []string
	keyMap := make(map[string]bool)

	for cursor.Next(ctx) {
		var result struct {
			PromptTemplateKey string `bson:"prompt_template_key"`
		}
		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode prompt template key: %w", err)
		}
		if result.PromptTemplateKey != "" && !keyMap[result.PromptTemplateKey] {
			promptKeys = append(promptKeys, result.PromptTemplateKey)
			keyMap[result.PromptTemplateKey] = true
		}
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	// 对每个prompt_key，获取最新版本
	var results []*models.PromptTemplate
	for _, key := range promptKeys {
		latestPrompt, err := r.GetPublishedPromptTemplateByKey(ctx, key)
		if err != nil {
			// 如果没有找到published版本，获取最新版本，只查询未删除的记录
			filter := bson.M{
				"prompt_template_key": key,
				"is_deleted":          false,
			}
			findOneOptions := options.FindOne().SetSort(bson.D{{"version", -1}})
			var prompt models.PromptTemplate
			err = collection.FindOne(ctx, filter, findOneOptions).Decode(&prompt)
			if err != nil {
				continue
			}
			results = append(results, &prompt)
		} else {
			results = append(results, latestPrompt)
		}
	}

	return results, nil
}

// SoftDelete 软删除提示词模板
func (r *PromptTemplateRepo) SoftDelete(ctx context.Context, promptKey string, deletedBy string) error {
	collection := r.client.GetCollection(CollectionPromptTemplate)

	// 软删除指定promptKey的所有版本
	filter := bson.M{
		"prompt_template_key": promptKey,
		"is_deleted":          false,
	}
	update := bson.M{
		"$set": bson.M{
			"is_deleted":       true,
			"delete_timestamp": time.Now(),
			"deleted_by":       deletedBy,
			"update_timestamp": time.Now(),
			"updated_by":       deletedBy,
		},
	}

	result, err := collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to soft delete prompt templates: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("no prompt templates found for key: %s", promptKey)
	}

	return nil
}
