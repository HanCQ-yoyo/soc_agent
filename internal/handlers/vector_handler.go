package handlers

import (
	"net/http"

	"soc_agent/internal/models"
	"soc_agent/internal/storage/milvus"
	"soc_agent/internal/storage/mongo"
	"soc_agent/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/milvus-io/milvus-sdk-go/v2/entity"
)

// VectorHandler 向量库操作处理器
type VectorHandler struct {
	alertAnalysisRepo *mongo.AlertAnalysisRepo
	milvus            *milvus.MilvusClient
}

// NewVectorHandler 创建向量库操作处理器实例
func NewVectorHandler(alertAnalysisRepo *mongo.AlertAnalysisRepo, milvus *milvus.MilvusClient) *VectorHandler {
	return &VectorHandler{
		alertAnalysisRepo: alertAnalysisRepo,
		milvus:            milvus,
	}
}

// GetAllVectorData 获取所有向量库数据，支持分页
func (h *VectorHandler) GetAllVectorData(c *gin.Context) {
	// post参数
	var req models.SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}
	// 调用向量库操作接口
	data, err := h.milvus.QueryDataForPlatform(req.QueryExpr, req.Page, req.PageSize,
		req.SimilarKeyword, req.TopK, req.ScoreThreshold, entity.MetricType(req.MitricType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get vector data",
		})
		return
	}

	// 调用向量库操作接口
	total, err := h.milvus.GetTotalCount(req.QueryExpr, req.SimilarKeyword,
		req.TopK, req.ScoreThreshold, entity.MetricType(req.MitricType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get total count",
		})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Success",
		"data":    data,
		"total":   total,
	})
}

// SearchByAnalysisID 根据analysis_uid获取研判数据并检索
func (h *VectorHandler) SearchByAnalysisID(c *gin.Context) {
	// 解析参数
	var req models.SearchByAnalysisUIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	analysisResult, err := h.alertAnalysisRepo.GetAlertAnalysisByID(req.AnalysisUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get alert analysis by ID",
		})
		return
	}

	if analysisResult == nil {
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "Success",
			"data":    []models.MilvusData{},
			"count":   0,
		})
		return
	}
	structFeature := []models.StructFeature{
		{Key: "alarm_name", Value: analysisResult.Detail.AlertName},
		{Key: "alarm_type", Value: analysisResult.Detail.AlertCategory},
		{Key: "alarm_source", Value: analysisResult.Detail.AlertSource},
		{Key: "alarm_detail", Value: analysisResult.Detail.AlertDescription},
		{Key: "source_ip", Value: analysisResult.Detail.AlertSourceIP},
		{Key: "dest_ip", Value: analysisResult.Detail.AlertDestinationIP},
		{Key: "asset_id", Value: analysisResult.Detail.AlertAssetID},
	}
	milvusContent := utils.GenMilvusContent(structFeature)
	data, err := h.milvus.QueryDataForPlatform("", req.Page, req.PageSize,
		milvusContent, req.TopK, req.ScoreThreshold, entity.MetricType(req.MitricType))

	// 调用向量库操作接口
	total, err := h.milvus.GetTotalCount("", milvusContent,
		req.TopK, req.ScoreThreshold, entity.MetricType(req.MitricType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get total count",
			"error":   err.Error(),
		})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Success",
		"data":    data,
		"total":   total,
	})
}
