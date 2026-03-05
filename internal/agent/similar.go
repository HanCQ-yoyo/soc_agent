package agent

import (
	"errors"
	"fmt"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/milvus"
	"soc_agent/internal/storage/mongo"
	"soc_agent/internal/utils"
	"strings"

	"github.com/sirupsen/logrus"
)

type MatchOp struct {
	mongo             *mongo.Client
	milvus            *milvus.MilvusClient
	alertFeatureRepo  *mongo.AlertFeatureRepo
	alertFeedbackRepo *mongo.AlertFeedbackRepo
	alertAnalysisRepo *mongo.AlertAnalysisRepo
}

func GetMatchOp(mongoClient *mongo.Client, milvusClient *milvus.MilvusClient) *MatchOp {
	return &MatchOp{
		mongo:             mongoClient,
		milvus:            milvusClient,
		alertFeatureRepo:  mongo.NewAlertFeatureRepo(mongoClient),
		alertFeedbackRepo: mongo.NewAlertFeedbackRepo(mongoClient),
		alertAnalysisRepo: mongo.NewAlertAnalysisRepo(mongoClient),
	}
}

func (s *MatchOp) GenPromptWithFeedbackANdAnalysis(uniformcModel *models.AlertUnifiedModel) (string, error) {
	if uniformcModel == nil {
		return "", errors.New("uniformcModel is nil")
	}
	feedbackPrompt := "未找到与当前告警关联的历史告警的用户反馈\n"
	feedbackList, analysis, err := s.GetExactMatchResult(uniformcModel)
	if err != nil {
		logrus.Errorf("Failed to get exact match result: %v", err)
		return "", err
	}

	if len(feedbackList) > 0 {
		feedbackPrompt = "已精准匹配到历史相同告警的研判分析结果和用户反馈，请充分结合以下内容对当前告警进行充分的研判分析：\n"
		for id, feedback := range feedbackList {
			feedbackPrompt += fmt.Sprintf("反馈序号：%d\n - 反馈时间：%s\n - 反馈类型：%s\n - 修正后的研判结果：%s\n - 修正的原因：%s\n核心特征标签：%s\n\n",
				id+1,
				feedback.FeedbackTime.Format("2006-01-02 15:04:05"),
				feedback.FeedbackType,
				feedback.CorrectResult,
				feedback.FeedbackReason,
				strings.Join(feedback.CoreFeatureTags, ","),
			)
		}
		if analysis != nil {
			feedbackPrompt += fmt.Sprintf("历史研判分析结果：\n - 原始告警：%s\n - 研判结果：%s \n - 研判描述：%s\n\n",
				analysis.Detail.RawDataAlert, analysis.Detail.AnalysisResultType, analysis.Detail.AnalysisResultDesc)
		}
		return feedbackPrompt, nil
	}

	feedbackList, analysis, err = s.GetSimilarResult(uniformcModel)
	if err != nil {
		logrus.Errorf("Failed to get similar result: %v", err)
		return "", err
	}
	if len(feedbackList) > 0 {
		feedbackPrompt = "已匹配到历史相似告警的研判分析结果和用户反馈，请充分参考以下内容对当前告警进行充分的研判分析：\n"
		for id, feedback := range feedbackList {
			feedbackPrompt += fmt.Sprintf("反馈序号：%d\n - 反馈时间：%s\n - 反馈类型：%s\n - 修正后的研判结果：%s\n - 修正的原因：%s\n核心特征标签：%s\n\n",
				id+1,
				feedback.FeedbackTime.Format("2006-01-02 15:04:05"),
				feedback.FeedbackType,
				feedback.CorrectResult,
				feedback.FeedbackReason,
				strings.Join(feedback.CoreFeatureTags, ","),
			)
		}
		if analysis != nil {
			feedbackPrompt += fmt.Sprintf("历史研判分析结果：\n - 原始告警：%s\n - 研判结果：%s \n - 研判描述：%s\n\n",
				analysis.Detail.RawDataAlert, analysis.Detail.AnalysisResultType, analysis.Detail.AnalysisResultDesc)
		}
	}
	return feedbackPrompt, nil
}

// 获取核心特征md5精确匹配的告警分析结果
func (s *MatchOp) GetExactMatchResult(uniformModel *models.AlertUnifiedModel) ([]models.AlertFeedback, *models.AlertAnalysis, error) {
	structFeature := []models.StructFeature{
		{Key: "alarm_name", Value: uniformModel.AlertName},
		{Key: "alarm_type", Value: uniformModel.AlertCategory},
		{Key: "alarm_source", Value: uniformModel.AlertSource},
		{Key: "alarm_detail", Value: uniformModel.AlertDescription},
		{Key: "source_ip", Value: uniformModel.SourceIP},
		{Key: "dest_ip", Value: uniformModel.DestinationIP},
		{Key: "asset_id", Value: uniformModel.AssetID},
	}

	coreFeatureMD5, err := utils.GetCoreFeatureMd5(structFeature)
	if err != nil {
		logrus.Errorf("Failed to get core feature md5: %v", err)
		return nil, nil, err
	}
	alertFeature, err := s.alertFeatureRepo.GetFeatureByCoreFeatureMD5(coreFeatureMD5)
	if err != nil {
		logrus.Errorf("Failed to get alert feature by core feature md5: %v", err)
		return nil, nil, err
	}

	if alertFeature == nil {
		return nil, nil, nil
	}

	feedbackList, analysis, err := s.GetFeedbackAndAnalysis(alertFeature.AnalysisUID)
	if err != nil {
		logrus.Errorf("Failed to get feedback and analysis by analysis uid: %v", err)
		return nil, nil, err
	}

	return feedbackList, analysis, nil
}

func (s *MatchOp) GetSimilarResult(uniformModel *models.AlertUnifiedModel) ([]models.AlertFeedback, *models.AlertAnalysis, error) {
	structFeature := []models.StructFeature{
		{Key: "alarm_name", Value: uniformModel.AlertName},
		{Key: "alarm_type", Value: uniformModel.AlertCategory},
		{Key: "alarm_source", Value: uniformModel.AlertSource},
		{Key: "alarm_detail", Value: uniformModel.AlertDescription},
		{Key: "source_ip", Value: uniformModel.SourceIP},
		{Key: "dest_ip", Value: uniformModel.DestinationIP},
		{Key: "asset_id", Value: uniformModel.AssetID},
	}
	milvusContent := utils.GenMilvusContent(structFeature)
	milvusData, err := s.milvus.SearchDataForWorkflow(milvusContent, 1, 0.9)
	if err != nil {
		logrus.Errorf("Failed to search milvus data: %v", err)
		return nil, nil, err
	}

	if len(milvusData) == 0 {
		return nil, nil, nil
	}

	feedbackList, analysis, err := s.GetFeedbackAndAnalysis(milvusData[0].AnalysisID)
	if err != nil {
		logrus.Errorf("Failed to get feedback and analysis by analysis uid: %v", err)
		return nil, nil, err
	}

	return feedbackList, analysis, nil
}

func (s *MatchOp) GetFeedbackAndAnalysis(analysisUID string) ([]models.AlertFeedback, *models.AlertAnalysis, error) {
	var feedbackList []models.AlertFeedback
	var analysis *models.AlertAnalysis
	// 查询历史研判结果反馈数据
	alertFeedbackList, err := s.alertFeedbackRepo.GetFeedbackByAnalysisUID(analysisUID)
	fmt.Printf("alertFeedbackList: %d\n,err: %v", len(alertFeedbackList), err)
	if err != nil {
		logrus.Errorf("Failed to get alert feedback by analysis uid: %v", err)
		return nil, nil, err
	}
	if len(alertFeedbackList) > 0 {
		feedbackList = alertFeedbackList
	}

	// 查询特征对应历史告警研判结果
	alertAnalysis, err := s.alertAnalysisRepo.GetAlertAnalysisByID(analysisUID)
	// fmt.Printf("alertAnalysis: %v\n,err: %v", alertAnalysis.Detail.AnalysisID, err)
	if err != nil {
		logrus.Errorf("Failed to get alert analysis by analysis uid: %v", err)
		return nil, nil, err
	}
	if alertAnalysis != nil {
		analysis = alertAnalysis
	}

	return feedbackList, analysis, nil
}
