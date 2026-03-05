package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"soc_agent/internal/storage/mongo"
)

// DashboardHandler 看板处理器
type DashboardHandler struct {
	dashboardRepo *mongo.DashboardRepo
}

// NewDashboardHandler 创建看板处理器
func NewDashboardHandler(dashboardRepo *mongo.DashboardRepo) *DashboardHandler {
	return &DashboardHandler{
		dashboardRepo: dashboardRepo,
	}
}

// GetOverview 获取看板概览数据
func (h *DashboardHandler) GetOverview(c *gin.Context) {
	// 获取时间范围参数
	timeRange := c.DefaultQuery("time_range", "7days")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	logrus.Infof("Getting dashboard overview data: timeRange=%s, startTime=%s, endTime=%s", timeRange, startTimeStr, endTimeStr)

	// 检查DashboardRepo是否初始化
	if h.dashboardRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dashboard repository not initialized"})
		return
	}

	// 解析时间参数
	var startTime, endTime time.Time
	var err error
	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			logrus.Errorf("Invalid start_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format"})
			return
		}
	}
	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			logrus.Errorf("Invalid end_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format"})
			return
		}
	}

	// 调用DashboardRepo获取概览数据
	overview, err := h.dashboardRepo.GetDashboardOverview(c.Request.Context(), timeRange, startTime, endTime)
	if err != nil {
		logrus.Errorf("Failed to get dashboard overview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard overview"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, overview)
}

// GetTrend 获取看板趋势数据
func (h *DashboardHandler) GetTrend(c *gin.Context) {
	// 获取时间范围参数
	timeRange := c.DefaultQuery("time_range", "7days")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	logrus.Infof("Getting dashboard trend data: timeRange=%s, startTime=%s, endTime=%s", timeRange, startTimeStr, endTimeStr)

	// 检查DashboardRepo是否初始化
	if h.dashboardRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dashboard repository not initialized"})
		return
	}

	// 解析时间参数
	var startTime, endTime time.Time
	var err error
	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			logrus.Errorf("Invalid start_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format"})
			return
		}
	}
	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			logrus.Errorf("Invalid end_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format"})
			return
		}
	}

	// 调用DashboardRepo获取趋势数据
	trend, err := h.dashboardRepo.GetDashboardTrend(c.Request.Context(), timeRange, startTime, endTime)
	if err != nil {
		logrus.Errorf("Failed to get dashboard trend: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard trend"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, trend)
}

// GetDetail 获取看板详细数据
func (h *DashboardHandler) GetDetail(c *gin.Context) {
	// 获取时间范围参数
	timeRange := c.DefaultQuery("time_range", "7days")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	logrus.Infof("Getting dashboard detail data: timeRange=%s, startTime=%s, endTime=%s", timeRange, startTimeStr, endTimeStr)

	// 检查DashboardRepo是否初始化
	if h.dashboardRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dashboard repository not initialized"})
		return
	}

	// 解析时间参数
	var startTime, endTime time.Time
	var err error
	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			logrus.Errorf("Invalid start_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format"})
			return
		}
	}
	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			logrus.Errorf("Invalid end_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format"})
			return
		}
	}

	// 调用DashboardRepo获取详细数据
	detail, err := h.dashboardRepo.GetDashboardDetail(c.Request.Context(), timeRange, startTime, endTime)
	if err != nil {
		logrus.Errorf("Failed to get dashboard detail: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard detail"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, detail)
}

// GetEfficiency 获取看板效率数据
func (h *DashboardHandler) GetEfficiency(c *gin.Context) {
	// 获取时间范围参数
	timeRange := c.DefaultQuery("time_range", "7days")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	logrus.Infof("Getting dashboard efficiency data: timeRange=%s, startTime=%s, endTime=%s", timeRange, startTimeStr, endTimeStr)

	// 检查DashboardRepo是否初始化
	if h.dashboardRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dashboard repository not initialized"})
		return
	}

	// 解析时间参数
	var startTime, endTime time.Time
	var err error
	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			logrus.Errorf("Invalid start_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_time format"})
			return
		}
	}
	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			logrus.Errorf("Invalid end_time format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_time format"})
			return
		}
	}

	// 调用DashboardRepo获取效率数据
	efficiency, err := h.dashboardRepo.GetDashboardEfficiency(c.Request.Context(), timeRange, startTime, endTime)
	if err != nil {
		logrus.Errorf("Failed to get dashboard efficiency: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard efficiency"})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, efficiency)
}
