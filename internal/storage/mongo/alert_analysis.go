package mongo

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"soc_agent/internal/consts"
	"soc_agent/internal/models"
)

const (
	CollectionAlertAnalysis = "alert_analyses"
)

// AlertAnalysisRepo 告警分析存储库
type AlertAnalysisRepo struct {
	client          *Client
	workflowLogRepo *WorkflowLogRepo
}

// NewAlertAnalysisRepo 创建告警分析存储库实例
func NewAlertAnalysisRepo(client *Client) *AlertAnalysisRepo {
	return &AlertAnalysisRepo{
		client:          client,
		workflowLogRepo: NewWorkflowLogRepo(client),
	}
}

// InitStoreAnalysisResult 初始化并存储告警分析结果
func (r *AlertAnalysisRepo) InitStoreAnalysisResult(source string, analysisID string, alertData string) (string, error) {
	if analysisID == "" {
		analysisID = GetFieldUID(consts.FieldUIDPrefixAlertAnalysis)
	}

	initAlertAnalysis := &models.AlertAnalysis{
		Detail: models.AlertResponse{
			AnalysisID:        analysisID,
			AnalysisStartTime: time.Now().UnixMilli(),
			RawDataAlert:      alertData,
			AlertSource:       source,
		},
		DisposalStatus:  string(consts.DisposalStatusPending),
		CreateTimestamp: time.Now().UnixMilli(),
		UpdateTimestamp: time.Now().UnixMilli(),
	}

	// 存储到MongoDB
	err := r.StoreAlertAnalysis(initAlertAnalysis)
	if err != nil {
		log.Printf("Failed to store initial alert analysis to MongoDB: %v", err)
		// 即使存储失败，也继续执行
	}
	return analysisID, nil
}

// UpdateDisposalStatus 更新处置状态
func (r *AlertAnalysisRepo) UpdateDisposalStatus(analysisID string, status consts.DisposalStatusType) error {
	alertAnalysis, err := r.GetAlertAnalysisByID(analysisID)
	if err != nil {
		return fmt.Errorf("failed to get alert analysis: %v", err)
	}
	alertAnalysis.DisposalStatus = string(status)
	alertAnalysis.ErrMessage = ""
	err = r.UpdateAlertAnalysis(alertAnalysis)
	if err != nil {
		log.Printf("Failed to update alert analysis status: %v", err)
		// 即使更新失败，也继续执行
	}
	return nil
}

// StoreAlertAnalysis 存储告警分析结果
func (r *AlertAnalysisRepo) StoreAlertAnalysis(analysis *models.AlertAnalysis) error {
	if analysis == nil {
		return fmt.Errorf("analysis is nil")
	}

	// 设置时间戳
	now := time.Now()
	analysis.CreateTimestamp = now.UnixMilli()
	analysis.UpdateTimestamp = now.UnixMilli()

	// 如果没有ID，生成一个
	if analysis.ID == "" {
		analysis.ID = primitive.NewObjectID().Hex()
	}

	// 存储到MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysis)
	_, err := col.InsertOne(ctx, analysis)
	if err != nil {
		return fmt.Errorf("failed to store alert analysis: %v", err)
	}

	log.Printf("Successfully stored alert analysis with ID: %s", analysis.Detail.AnalysisID)
	return nil
}

// GetAlertAnalysisByID 根据分析ID获取告警分析结果
func (r *AlertAnalysisRepo) GetAlertAnalysisByID(analysisID string) (*models.AlertAnalysis, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var analysis models.AlertAnalysis
	filter := bson.M{"detail.analysis_id": analysisID}

	col := r.client.GetCollection(CollectionAlertAnalysis)
	err := col.FindOne(ctx, filter).Decode(&analysis)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get alert analysis: %v", err)
	}

	return &analysis, nil
}

// GetAlertAnalysisList 根据筛选条件获取告警分析列表
func (r *AlertAnalysisRepo) GetAlertAnalysisList(filter *models.AlertAnalysisFilter) (*models.AlertAnalysisListResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建查询条件
	query := bson.M{}

	// 添加筛选条件
	if filter.AnalysisID != "" {
		query["detail.analysis_id"] = filter.AnalysisID
	}

	if filter.Source != "" {
		query["detail.alert_source"] = filter.Source
	}

	if filter.ResultType != "" {
		query["detail.analysis_result_type"] = filter.ResultType
	}

	// 添加原始告警模糊检索
	if filter.RawAlert != "" {
		query["detail.raw_data_alert"] = bson.M{"$regex": filter.RawAlert, "$options": "i"}
	}

	// 时间范围筛选
	if filter.StartTime != "" {
		startTime, err := time.Parse(time.RFC3339, filter.StartTime)
		if err == nil {
			query["create_timestamp"] = bson.M{"$gte": startTime.UnixMilli()}
		}
	}

	if filter.EndTime != "" {
		endTime, err := time.Parse(time.RFC3339, filter.EndTime)
		if err == nil {
			if query["create_timestamp"] == nil {
				query["create_timestamp"] = bson.M{}
			}
			query["create_timestamp"].(bson.M)["$lte"] = endTime.UnixMilli()
		}
	}

	// 根据Status字段决定状态过滤逻辑
	if filter.Status != "" {
		// 如果指定了状态，只返回该状态的记录
		query["disposal_status"] = filter.Status
	}

	// 计算总数
	col := r.client.GetCollection(CollectionAlertAnalysis)
	count, err := col.CountDocuments(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to count alert analyses: %v", err)
	}

	// 设置默认值
	if filter.Page <= 0 {
		filter.Page = 1
	}

	if filter.PageSize <= 0 {
		filter.PageSize = 10
	}

	// 计算跳过的记录数
	skip := (filter.Page - 1) * filter.PageSize

	// 设置排序和分页选项
	opts := options.Find().
		SetSort(bson.D{{Key: "create_timestamp", Value: -1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(filter.PageSize))

	// 执行查询
	cursor, err := col.Find(ctx, query, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to find alert analyses: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var analyses []models.AlertAnalysis
	for cursor.Next(ctx) {
		var analysis models.AlertAnalysis
		if err := cursor.Decode(&analysis); err != nil {
			return nil, fmt.Errorf("failed to decode alert analysis: %v", err)
		}
		analyses = append(analyses, analysis)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(count) / float64(filter.PageSize)))

	// 构建响应
	response := &models.AlertAnalysisListResponse{
		Total:      count,
		Data:       analyses,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: totalPages,
	}

	return response, nil
}

// UpdateAlertAnalysis 更新告警分析结果
func (r *AlertAnalysisRepo) UpdateAlertAnalysis(analysis *models.AlertAnalysis) error {
	if analysis == nil {
		return fmt.Errorf("analysis is nil")
	}

	// 更新时间戳
	analysis.UpdateTimestamp = time.Now().UnixMilli()

	// 构建更新条件
	filter := bson.M{"detail.analysis_id": analysis.Detail.AnalysisID}

	// 构建更新内容
	update := bson.M{
		"$set": analysis,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionAlertAnalysis)
	_, err := col.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update alert analysis: %v", err)
	}

	log.Printf("Successfully updated alert analysis with ID: %s", analysis.Detail.AnalysisID)
	return nil
}

// RecordWorkflowLog 记录工作流日志
func (r *AlertAnalysisRepo) RecordWorkflowLog(analysisID string, nodeName, nodeType, nodeComponent, nodeInput, nodeOutput, errMsg string) error {
	// 创建工作流日志
	workflowLog := &models.WorkflowLog{
		ExecTime:   time.Now(),
		NodeName:   nodeName,
		NodeType:   nodeType,
		Component:  nodeComponent,
		Input:      nodeInput,
		Output:     nodeOutput,
		ErrMessage: errMsg,
	}

	// 存储到新的表中
	err := r.workflowLogRepo.StoreWorkflowLog(analysisID, workflowLog)
	if err != nil {
		log.Printf("Failed to store workflow log to MongoDB: %v", err)
		// 即使存储失败，也继续执行
	}

	// 如果有错误信息，更新告警分析的错误信息
	if errMsg != "" {
		alertAnalysis, err := r.GetAlertAnalysisByID(analysisID)
		if err != nil {
			log.Printf("Failed to get alert analysis: %v", err)
			// 即使获取失败，也继续执行
		} else {
			alertAnalysis.ErrMessage = errMsg
			err = r.UpdateAlertAnalysis(alertAnalysis)
			if err != nil {
				log.Printf("Failed to update alert analysis error message: %v", err)
				// 即使更新失败，也继续执行
			}
		}
	}

	return nil
}

// GetWorkflowLogs 获取工作流日志
func (r *AlertAnalysisRepo) GetWorkflowLogs(analysisID string) ([]models.WorkflowLog, error) {
	return r.workflowLogRepo.GetWorkflowLogsByAnalysisID(analysisID)
}

// UpdateDetail 更新告警分析详情
func (r *AlertAnalysisRepo) UpdateDetail(analysisID string, detail models.AlertResponse) error {
	alertAnalysis, err := r.GetAlertAnalysisByID(analysisID)
	if err != nil {
		return fmt.Errorf("failed to get alert analysis: %v", err)
	}
	alertAnalysis.Detail = detail
	alertAnalysis.DisposalStatus = string(consts.DisposalStatusSuccess)
	alertAnalysis.ErrMessage = ""
	err = r.UpdateAlertAnalysis(alertAnalysis)
	if err != nil {
		return fmt.Errorf("failed to update alert analysis: %v", err)
	}

	return nil
}
