package agent

import (
	"context"
	"fmt"
	"time"

	"soc_agent/internal/config"
	"soc_agent/internal/consts"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/milvus"
	"soc_agent/internal/storage/mongo"
	"soc_agent/internal/utils"

	"github.com/cloudwego/eino/callbacks"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// SOCAgent 安全运营智能体
type SOCAgent struct {
	Cfg                *config.Config
	Workflow           *SOCAgentWorkflow
	Milvus             *milvus.MilvusClient
	MongoClient        *mongo.Client
	AlertAnalysisRepo  *mongo.AlertAnalysisRepo
	AlertFeedbackRepo  *mongo.AlertFeedbackRepo
	AlertFeatureRepo   *mongo.AlertFeatureRepo
	DashboardRepo      *mongo.DashboardRepo
	PromptTemplateRepo *mongo.PromptTemplateRepo
	ChatRepo           *mongo.ChatRepo
}

// NewSOCAgent 创建智能体实例
func NewSOCAgent(ctx context.Context) (*SOCAgent, error) {
	// 创建配置
	cfg := config.GetConfig()

	// 创建Milvus客户端（可选）
	var milvusClient *milvus.MilvusClient
	var err error
	milvusClient, err = milvus.NewClient(cfg)
	if err != nil {
		logrus.Warnf("Failed to create Milvus client: %v, continuing without Milvus", err)
		milvusClient = nil
	}

	// 创建MongoDB客户端（可选）
	var mongoClient *mongo.Client
	mongoClient, err = mongo.NewClientFromConfig(cfg)
	if err != nil {
		logrus.Warnf("Failed to create MongoDB client: %v, continuing without MongoDB", err)
	}

	// 创建工作流（可选）
	var workflow *SOCAgentWorkflow
	if milvusClient != nil && mongoClient != nil {
		workflow, err = NewSOCAgentWorkflow(ctx, milvusClient, mongoClient)
		if err != nil {
			logrus.Warnf("Failed to create workflow: %v, continuing without workflow", err)
		}
	}

	// 创建存储库实例
	var alertAnalysisRepo *mongo.AlertAnalysisRepo
	var alertFeedbackRepo *mongo.AlertFeedbackRepo
	var dashboardRepo *mongo.DashboardRepo
	var featureRepo *mongo.AlertFeatureRepo
	var promptTemplateRepo *mongo.PromptTemplateRepo
	var chatRepo *mongo.ChatRepo

	if mongoClient != nil {
		alertAnalysisRepo = mongo.NewAlertAnalysisRepo(mongoClient)
		alertFeedbackRepo = mongo.NewAlertFeedbackRepo(mongoClient)
		dashboardRepo = mongo.NewDashboardRepo(mongoClient)
		featureRepo = mongo.NewAlertFeatureRepo(mongoClient)
		promptTemplateRepo = mongo.NewPromptTemplateRepo(mongoClient)
		chatRepo = mongo.NewChatRepo(mongoClient)
	}

	return &SOCAgent{
		Cfg:                cfg,
		Workflow:           workflow,
		Milvus:             milvusClient,
		MongoClient:        mongoClient,
		AlertAnalysisRepo:  alertAnalysisRepo,
		AlertFeedbackRepo:  alertFeedbackRepo,
		AlertFeatureRepo:   featureRepo,
		DashboardRepo:      dashboardRepo,
		PromptTemplateRepo: promptTemplateRepo,
		ChatRepo:           chatRepo,
	}, nil
}

// AnalyzeAlert 分析告警
func (a *SOCAgent) AnalyzeAlert(ctx context.Context, analysisID string, alertData string, source string) (*models.AlertResponse, error) {
	logrus.Infof("Analyzing alert: %s, source: %s", alertData, source)

	// 检查存储库是否初始化
	if a.AlertAnalysisRepo == nil {
		return nil, fmt.Errorf("alert analysis repository not initialized")
	}

	analysisID, err := a.AlertAnalysisRepo.InitStoreAnalysisResult(source, analysisID, alertData)
	if err != nil {
		return nil, err
	}

	err = a.AlertAnalysisRepo.UpdateDisposalStatus(analysisID, consts.DisposalStatusRunning)
	if err != nil {
		logrus.Errorf("Failed to update alert analysis status to running: %v", err)
		return nil, err
	}

	// 执行工作流
	callbacks.AppendGlobalHandlers(&loggerCallbacks{analysisID: analysisID, alertAnalysisRepo: a.AlertAnalysisRepo})
	result, err := a.Workflow.Execute(ctx, analysisID, alertData, source)
	if err != nil {
		// 更新状态为failed
		err := a.AlertAnalysisRepo.UpdateDisposalStatus(analysisID, consts.DisposalStatusFailed)
		if err != nil {
			logrus.Errorf("Failed to update alert analysis status to failed: %v", err)
			return nil, err
		}
		return nil, err
	}

	// 更新状态为success
	// 构建最终存储模型
	err = a.AlertAnalysisRepo.UpdateDetail(analysisID, *result)
	if err != nil {
		logrus.Errorf("Failed to update alert analysis detail: %v", err)
		return nil, err
	}

	return result, nil
}

// SubmitFeedback 提交用户反馈
func (a *SOCAgent) SubmitFeedback(ctx context.Context, feedback *models.FeedbackRequest) error {
	logrus.Infof("Received feedback for analysis ID: %s, type: %s", feedback.AnalysisID, feedback.FeedbackType)

	// 检查Milvus客户端是否存在
	if a.Milvus == nil {
		logrus.Errorf("Milvus client not initialized")
		return nil // 不返回错误，允许服务继续运行
	}

	// 检查存储库是否初始化
	if a.AlertAnalysisRepo == nil {
		logrus.Errorf("Alert analysis repository not initialized")
		return nil // 不返回错误，允许服务继续运行
	}

	// 将反馈数据转换为schema.Document格式
	analysis, err := a.AlertAnalysisRepo.GetAlertAnalysisByID(feedback.AnalysisID)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis: %v", err)
		// 即使获取分析结果失败，也继续处理反馈
	}

	// 写入反馈表
	feedbackData := &models.AlertFeedback{
		FeedbackUID:     mongo.GetFieldUID(consts.FieldUIDPrefixAlertFeedback),
		AnalysisUID:     feedback.AnalysisID,
		FeedbackType:    feedback.FeedbackType,
		CorrectResult:   feedback.CorrectResult,
		FeedbackReason:  feedback.FeedbackReason,
		CoreFeatureTags: feedback.CoreFeatureTags,
		FeedbackUser:    "zhangsan",
		UserRole:        "admin",
		FeedbackTime:    time.Now(),
		Status:          "finished",
	}
	err = a.AlertFeedbackRepo.CreateFeedback(feedbackData)
	if err != nil {
		logrus.Errorf("Failed to create alert feedback: %v", err)
		return err
	}

	// 写入特征表
	// 构建特征数据
	if analysis != nil {
		structFeature := []models.StructFeature{
			{Key: "alarm_name", Value: analysis.Detail.AlertName},
			{Key: "alarm_type", Value: analysis.Detail.AlertCategory},
			{Key: "alarm_source", Value: analysis.Detail.AlertSource},
			{Key: "alarm_detail", Value: analysis.Detail.AlertDescription},
			{Key: "source_ip", Value: analysis.Detail.AlertSourceIP},
			{Key: "dest_ip", Value: analysis.Detail.AlertDestinationIP},
			{Key: "asset_id", Value: analysis.Detail.AlertAssetID},
		}

		coreFeatureMD5, err := utils.GetCoreFeatureMd5(structFeature)
		if err != nil {
			logrus.Errorf("Failed to get core feature md5: %v", err)
			// 即使获取特征MD5失败，也继续处理
		} else {
			feature := &models.AlertFeature{
				AnalysisUID:    analysis.Detail.AnalysisID,
				StructFeature:  structFeature,
				CoreFeatureMD5: coreFeatureMD5,
				MilvusVectorID: mongo.GetFieldUID(consts.MilvusVectorFieldUIDPrefix),
				CreateTime:     time.Now(),
			}
			err = a.AlertFeatureRepo.CreateFeature(ctx, feature)
			if err != nil {
				logrus.Errorf("Failed to create alert feature: %v", err)
				// 即使创建特征失败，也继续处理
			} else {
				// 创建元数据
				metadata := map[string]any{
					"analysis_id":       feedback.AnalysisID,
					"feedback_type":     feedback.FeedbackType,
					"correct_result":    feedback.CorrectResult,
					"feedback_user":     feedback.UserID,
					"feedback_reason":   feedback.FeedbackReason,
					"core_feature_tags": feedback.CoreFeatureTags,
					"timestamp":         time.Now().UnixMilli(),
					"milvus_vector_id":  feature.MilvusVectorID,
				}

				// 创建文档
				docs := []*schema.Document{
					{
						ID:       uuid.NewString(),
						Content:  utils.GenMilvusContent(structFeature),
						MetaData: metadata,
					},
				}
				logrus.Infof("Feedback stored successfully for analysis ID: %s", feedback.AnalysisID)

				go func() {
					// 存储到Milvus
					err = a.Milvus.InsertData(docs)
					if err != nil {
						logrus.Errorf("Failed to store feedback in Milvus: %v", err)
					}
				}()
			}
		}
	}

	// 无论analysis是否存在，都返回成功
	logrus.Infof("Feedback received for analysis ID: %s", feedback.AnalysisID)

	return nil
}

// Close 关闭智能体
func (a *SOCAgent) Close() error {
	// 关闭工作流
	if a.Workflow != nil {
		err := a.Workflow.Close()
		if err != nil {
			return err
		}
	}

	// 关闭MongoDB客户端
	if a.MongoClient != nil {
		err := a.MongoClient.Close()
		if err != nil {
			return err
		}
	}

	return nil
}
