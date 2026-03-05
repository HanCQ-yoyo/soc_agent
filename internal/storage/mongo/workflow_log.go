package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"

	"soc_agent/internal/models"
)

const (
	CollectionAlertAnalysisWorkflowLog = "alert_analysis_workflow_log"
)

// WorkflowLogRepo 工作流日志存储库
type WorkflowLogRepo struct {
	client *Client
}

// NewWorkflowLogRepo 创建工作流日志存储库实例
func NewWorkflowLogRepo(client *Client) *WorkflowLogRepo {
	return &WorkflowLogRepo{
		client: client,
	}
}

// WorkflowLogMongo MongoDB存储模型
type WorkflowLogMongo struct {
	// 唯一标识符
	ID              string             `bson:"_id,omitempty" json:"id"`
	AnalysisID      string             `bson:"analysis_id" json:"analysis_id"`
	Log             models.WorkflowLog `bson:"log" json:"log"`
	CreateTimestamp int64              `bson:"create_timestamp" json:"create_timestamp"`
}

// StoreWorkflowLog 存储工作流日志
func (r *WorkflowLogRepo) StoreWorkflowLog(analysisID string, log *models.WorkflowLog) error {
	if analysisID == "" || log == nil {
		return fmt.Errorf("analysisID or log is empty")
	}

	// 创建工作流日志记录
	workflowLog := &WorkflowLogMongo{
		AnalysisID:      analysisID,
		Log:             *log,
		CreateTimestamp: time.Now().UnixMilli(),
	}

	// 存储到MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysisWorkflowLog)
	_, err := col.InsertOne(ctx, workflowLog)
	if err != nil {
		return fmt.Errorf("failed to store workflow log: %v", err)
	}

	return nil
}

// GetWorkflowLogsByAnalysisID 根据分析ID获取工作流日志
func (r *WorkflowLogRepo) GetWorkflowLogsByAnalysisID(analysisID string) ([]models.WorkflowLog, error) {
	if analysisID == "" {
		return nil, fmt.Errorf("analysisID is empty")
	}

	// 构建查询条件
	filter := bson.M{"analysis_id": analysisID}

	// 设置排序选项
	opts := options.Find().
		SetSort(bson.D{{Key: "create_timestamp", Value: 1}})

	// 执行查询
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysisWorkflowLog)
	cursor, err := col.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to find workflow logs: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var workflowLogs []models.WorkflowLog
	for cursor.Next(ctx) {
		var workflowLogMongo WorkflowLogMongo
		if err := cursor.Decode(&workflowLogMongo); err != nil {
			return nil, fmt.Errorf("failed to decode workflow log: %v", err)
		}
		workflowLogs = append(workflowLogs, workflowLogMongo.Log)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return workflowLogs, nil
}

// DeleteWorkflowLogsByAnalysisID 根据分析ID删除工作流日志
func (r *WorkflowLogRepo) DeleteWorkflowLogsByAnalysisID(analysisID string) error {
	if analysisID == "" {
		return fmt.Errorf("analysisID is empty")
	}

	// 构建删除条件
	filter := bson.M{"analysis_id": analysisID}

	// 执行删除
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysisWorkflowLog)
	_, err := col.DeleteMany(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete workflow logs: %v", err)
	}

	return nil
}

// CountWorkflowLogsByAnalysisID 根据分析ID统计工作流日志数量
func (r *WorkflowLogRepo) CountWorkflowLogsByAnalysisID(analysisID string) (int64, error) {
	if analysisID == "" {
		return 0, fmt.Errorf("analysisID is empty")
	}

	// 构建查询条件
	filter := bson.M{"analysis_id": analysisID}

	// 执行计数
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysisWorkflowLog)
	count, err := col.CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("failed to count workflow logs: %v", err)
	}

	return count, nil
}
