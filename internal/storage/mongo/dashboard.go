package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

const (
	CollectionDashboard = "alert_analyses"
)

// DashboardRepo 仪表盘存储库
type DashboardRepo struct {
	client *Client
}

// NewDashboardRepo 创建仪表盘存储库实例
func NewDashboardRepo(client *Client) *DashboardRepo {
	return &DashboardRepo{
		client: client,
	}
}

// 仪表盘概览数据
type DashboardOverview struct {
	TotalAlerts         int64   `json:"total_alerts"`
	AverageAnalysisTime float64 `json:"average_analysis_time"`
	TruePositiveCount   int64   `json:"true_positive_count"`
	FalsePositiveCount  int64   `json:"false_positive_count"`
	InvalidCount        int64   `json:"invalid_count"`
	SuspiciousCount     int64   `json:"suspicious_count"`
}

// 趋势数据
type TrendData struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

// 分布数据
type DistributionData struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

// 效率数据
type EfficiencyData struct {
	TimeRange string `json:"time_range"`
	Count     int64  `json:"count"`
}

// 详细分析数据
type DashboardDetail struct {
	ResultTypeDistribution    []DistributionData `json:"result_type_distribution"`
	AlertSourceDistribution   []DistributionData `json:"alert_source_distribution"`
	AlertSeverityDistribution []DistributionData `json:"alert_severity_distribution"`
}

// GetDashboardOverview 获取仪表盘概览数据
func (r *DashboardRepo) GetDashboardOverview(ctx context.Context, timeRange string, startTime, endTime time.Time) (*DashboardOverview, error) {
	// 构建查询条件
	query := buildTimeRangeQuery(timeRange, startTime, endTime)

	// 使用批量计算函数，一次性获取所有概览数据
	return r.calculateDashboardOverviewBatch(ctx, query)
}

// GetDashboardTrend 获取仪表盘趋势数据
func (r *DashboardRepo) GetDashboardTrend(ctx context.Context, timeRange string, startTime, endTime time.Time) ([]TrendData, error) {
	// 构建查询条件
	query := buildTimeRangeQuery(timeRange, startTime, endTime)

	// 计算趋势数据
	// 根据时间范围确定分组间隔
	var interval string
	switch timeRange {
	case "today":
		interval = "hour"
	case "7days":
		interval = "day"
	case "30days":
		interval = "day"
	case "90days":
		interval = "week"
	case "1year":
		interval = "month"
	default:
		interval = "day"
	}

	return r.calculateTrendData(ctx, query, interval)
}

// GetDashboardDetail 获取仪表盘详细分析数据
func (r *DashboardRepo) GetDashboardDetail(ctx context.Context, timeRange string, startTime, endTime time.Time) (*DashboardDetail, error) {
	// 构建查询条件
	query := buildTimeRangeQuery(timeRange, startTime, endTime)

	// 使用批量计算函数，一次性获取所有详细数据
	return r.calculateDashboardDetailBatch(ctx, query)
}

// GetDashboardEfficiency 获取仪表盘效率分析数据
func (r *DashboardRepo) GetDashboardEfficiency(ctx context.Context, timeRange string, startTime, endTime time.Time) ([]EfficiencyData, error) {
	// 构建查询条件
	query := buildTimeRangeQuery(timeRange, startTime, endTime)

	// 计算分析时间分布
	return r.calculateAnalysisTimeDistribution(ctx, query)
}

// 构建时间范围查询
func buildTimeRangeQuery(timeRange string, startTime, endTime time.Time) bson.M {
	query := bson.M{}

	switch timeRange {
	case "today":
		// 今天
		now := time.Now()
		todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		todayStartMillis := todayStart.UnixMilli()
		query["detail.analysis_start_time"] = bson.M{"$gte": todayStartMillis}
	case "7days":
		// 近7天
		sevenDaysAgoMillis := time.Now().AddDate(0, 0, -7).UnixMilli()
		query["detail.analysis_start_time"] = bson.M{"$gte": sevenDaysAgoMillis}
	case "30days":
		// 近30天
		thirtyDaysAgoMillis := time.Now().AddDate(0, 0, -30).UnixMilli()
		query["detail.analysis_start_time"] = bson.M{"$gte": thirtyDaysAgoMillis}
	case "90days":
		// 近90天
		ninetyDaysAgoMillis := time.Now().AddDate(0, 0, -90).UnixMilli()
		query["detail.analysis_start_time"] = bson.M{"$gte": ninetyDaysAgoMillis}
	case "1year":
		// 近1年
		oneYearAgoMillis := time.Now().AddDate(-1, 0, 0).UnixMilli()
		query["detail.analysis_start_time"] = bson.M{"$gte": oneYearAgoMillis}
	case "custom":
		// 自定义时间范围
		if !startTime.IsZero() && !endTime.IsZero() {
			startTimeMillis := startTime.UnixMilli()
			endTimeMillis := endTime.UnixMilli()
			query["detail.analysis_start_time"] = bson.M{"$gte": startTimeMillis, "$lte": endTimeMillis}
		} else if !startTime.IsZero() {
			startTimeMillis := startTime.UnixMilli()
			query["detail.analysis_start_time"] = bson.M{"$gte": startTimeMillis}
		} else if !endTime.IsZero() {
			endTimeMillis := endTime.UnixMilli()
			query["detail.analysis_start_time"] = bson.M{"$lte": endTimeMillis}
		}
	}

	return query
}

// 计算总告警数
func (r *DashboardRepo) calculateTotalAlerts(ctx context.Context, query bson.M) (int64, error) {
	col := r.client.GetCollection(CollectionDashboard)
	return col.CountDocuments(ctx, query)
}

// 计算平均分析时间
func (r *DashboardRepo) calculateAverageAnalysisTime(ctx context.Context, query bson.M) (float64, error) {
	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$project": bson.M{
				"analysis_start_time": "$detail.analysis_start_time",
				"analysis_end_time":   "$detail.analysis_end_time",
			},
		},
		{
			"$match": bson.M{
				"analysis_start_time": bson.M{"$gt": 0},
				"analysis_end_time":   bson.M{"$gt": 0},
			},
		},
		{
			"$project": bson.M{
				"analysis_time_seconds": bson.M{
					"$divide": []interface{}{
						bson.M{
							"$subtract": []interface{}{"$analysis_end_time", "$analysis_start_time"},
						},
						1000,
					},
				},
			},
		},
		{
			"$match": bson.M{
				"analysis_time_seconds": bson.M{"$gt": 0},
			},
		},
		{
			"$group": bson.M{
				"_id":                   nil,
				"average_analysis_time": bson.M{"$avg": "$analysis_time_seconds"},
			},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, fmt.Errorf("failed to aggregate average analysis time: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var result struct {
		AverageAnalysisTime float64 `bson:"average_analysis_time"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return 0, fmt.Errorf("failed to decode result: %v", err)
		}
		// 确保返回非负值
		if result.AverageAnalysisTime < 0 {
			return 0, nil
		}
		// 保留小数点后两位
		roundedTime := float64(int(result.AverageAnalysisTime*100+0.5)) / 100
		return roundedTime, nil
	}

	return 0, nil
}

// 计算趋势数据
func (r *DashboardRepo) calculateTrendData(ctx context.Context, query bson.M, interval string) ([]TrendData, error) {
	// 构建时间分组表达式
	var timeGroupExpr bson.M
	switch interval {
	case "hour":
		timeGroupExpr = bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d %H:00", "date": bson.M{"$toDate": "$detail.analysis_start_time"}}}
	case "day":
		timeGroupExpr = bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": bson.M{"$toDate": "$detail.analysis_start_time"}}}
	case "week":
		timeGroupExpr = bson.M{"$dateToString": bson.M{"format": "%Y-W%V", "date": bson.M{"$toDate": "$detail.analysis_start_time"}}}
	case "month":
		timeGroupExpr = bson.M{"$dateToString": bson.M{"format": "%Y-%m", "date": bson.M{"$toDate": "$detail.analysis_start_time"}}}
	default:
		timeGroupExpr = bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": bson.M{"$toDate": "$detail.analysis_start_time"}}}
	}

	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$project": bson.M{
				"analysis_start_time": "$detail.analysis_start_time",
			},
		},
		{
			"$match": bson.M{
				"analysis_start_time": bson.M{"$gt": 0},
			},
		},
		{
			"$group": map[string]interface{}{
				"_id":   timeGroupExpr,
				"count": map[string]interface{}{"$sum": 1},
			},
		},
		{
			"$sort": map[string]interface{}{"_id": 1},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate trend data: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var trendData []TrendData
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}

		trendData = append(trendData, TrendData{
			Date:  result.ID,
			Count: result.Count,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return trendData, nil
}

// 计算研判结果分布
func (r *DashboardRepo) calculateResultTypeDistribution(ctx context.Context, query bson.M) ([]DistributionData, error) {
	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$group": map[string]interface{}{
				"_id":   "$detail.analysis_result_type",
				"count": map[string]interface{}{"$sum": 1},
			},
		},
		{
			"$sort": map[string]interface{}{"count": -1},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate result type distribution: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var distributionData []DistributionData
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}

		distributionData = append(distributionData, DistributionData{
			Name:  result.ID,
			Value: result.Count,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return distributionData, nil
}

// 计算告警来源分布
func (r *DashboardRepo) calculateAlertSourceDistribution(ctx context.Context, query bson.M) ([]DistributionData, error) {
	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$group": map[string]interface{}{
				"_id":   "$detail.alert_source",
				"count": map[string]interface{}{"$sum": 1},
			},
		},
		{
			"$sort": map[string]interface{}{"count": -1},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate alert source distribution: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var distributionData []DistributionData
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}

		distributionData = append(distributionData, DistributionData{
			Name:  result.ID,
			Value: result.Count,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return distributionData, nil
}

// 计算告警级别分布
func (r *DashboardRepo) calculateAlertSeverityDistribution(ctx context.Context, query bson.M) ([]DistributionData, error) {
	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$group": map[string]interface{}{
				"_id":   "$detail.alert_severity",
				"count": map[string]interface{}{"$sum": 1},
			},
		},
		{
			"$sort": map[string]interface{}{"count": -1},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate alert severity distribution: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var distributionData []DistributionData
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}

		distributionData = append(distributionData, DistributionData{
			Name:  result.ID,
			Value: result.Count,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return distributionData, nil
}

// 计算分析时间分布
func (r *DashboardRepo) calculateAnalysisTimeDistribution(ctx context.Context, query bson.M) ([]EfficiencyData, error) {
	// 构建聚合管道
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$project": bson.M{
				"analysis_start_time": "$detail.analysis_start_time",
				"analysis_end_time":   "$detail.analysis_end_time",
			},
		},
		{
			"$match": bson.M{
				"analysis_start_time": bson.M{"$gt": 0},
				"analysis_end_time":   bson.M{"$gt": 0},
			},
		},
		{
			"$project": bson.M{
				"analysis_time_seconds": bson.M{
					"$divide": []interface{}{
						bson.M{
							"$subtract": []interface{}{"$analysis_end_time", "$analysis_start_time"},
						},
						1000,
					},
				},
			},
		},
		{
			"$match": bson.M{
				"analysis_time_seconds": bson.M{"$gt": 0},
			},
		},
		{
			"$addFields": bson.M{
				"time_range": bson.M{
					"$switch": bson.M{
						"branches": []bson.M{
							{
								"case": bson.M{"$lt": []interface{}{"$analysis_time_seconds", 1}},
								"then": "< 1s",
							},
							{
								"case": bson.M{"$lt": []interface{}{"$analysis_time_seconds", 5}},
								"then": "1-5s",
							},
							{
								"case": bson.M{"$lt": []interface{}{"$analysis_time_seconds", 10}},
								"then": "5-10s",
							},
							{
								"case": bson.M{"$lt": []interface{}{"$analysis_time_seconds", 30}},
								"then": "10-30s",
							},
							{
								"case": bson.M{"$lt": []interface{}{"$analysis_time_seconds", 60}},
								"then": "30-60s",
							},
							{
								"case": bson.M{"$gte": []interface{}{"$analysis_time_seconds", 60}},
								"then": "> 60s",
							},
						},
						"default": "Unknown",
					},
				},
			},
		},
		{
			"$group": bson.M{
				"_id":   "$time_range",
				"count": bson.M{"$sum": 1},
			},
		},
		{
			"$sort": bson.M{
				"_id": 1,
			},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate analysis time distribution: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var efficiencyData []EfficiencyData
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}

		efficiencyData = append(efficiencyData, EfficiencyData{
			TimeRange: result.ID,
			Count:     result.Count,
		})
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %v", err)
	}

	return efficiencyData, nil
}

// 批量计算看板概览数据（优化版）
func (r *DashboardRepo) calculateDashboardOverviewBatch(ctx context.Context, query bson.M) (*DashboardOverview, error) {
	// 构建聚合管道，一次性计算所有概览数据
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$project": bson.M{
				"analysis_result_type": "$detail.analysis_result_type",
				"analysis_start_time":  "$detail.analysis_start_time",
				"analysis_end_time":    "$detail.analysis_end_time",
			},
		},
		{
			"$addFields": bson.M{
				"analysis_time_seconds": bson.M{
					"$cond": bson.M{
						"if": bson.M{
							"$and": []interface{}{
								bson.M{"$gt": []interface{}{"$analysis_start_time", 0}},
								bson.M{"$gt": []interface{}{"$analysis_end_time", 0}},
							},
						},
						"then": bson.M{
							"$divide": []interface{}{
								bson.M{
									"$subtract": []interface{}{"$analysis_end_time", "$analysis_start_time"},
								},
								1000,
							},
						},
						"else": 0,
					},
				},
				"is_true_positive": bson.M{
					"$eq": []interface{}{"$analysis_result_type", "true_positive"},
				},
				"is_false_positive": bson.M{
					"$eq": []interface{}{"$analysis_result_type", "false_positive"},
				},
				"is_invalid": bson.M{
					"$eq": []interface{}{"$analysis_result_type", "invalid"},
				},
				"is_suspicious": bson.M{
					"$eq": []interface{}{"$analysis_result_type", "suspicious"},
				},
			},
		},
		{
			"$group": bson.M{
				"_id":                    nil,
				"total_alerts":           bson.M{"$sum": 1},
				"average_analysis_time":  bson.M{"$avg": "$analysis_time_seconds"},
				"true_positive_count":    bson.M{"$sum": bson.M{"$cond": []interface{}{"$is_true_positive", 1, 0}}},
				"false_positive_count":   bson.M{"$sum": bson.M{"$cond": []interface{}{"$is_false_positive", 1, 0}}},
				"invalid_count":         bson.M{"$sum": bson.M{"$cond": []interface{}{"$is_invalid", 1, 0}}},
				"suspicious_count":      bson.M{"$sum": bson.M{"$cond": []interface{}{"$is_suspicious", 1, 0}}},
			},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate dashboard overview: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var result struct {
		TotalAlerts         int64   `bson:"total_alerts"`
		AverageAnalysisTime float64 `bson:"average_analysis_time"`
		TruePositiveCount   int64   `bson:"true_positive_count"`
		FalsePositiveCount  int64   `bson:"false_positive_count"`
		InvalidCount        int64   `bson:"invalid_count"`
		SuspiciousCount     int64   `bson:"suspicious_count"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}
		// 确保返回非负值
		if result.AverageAnalysisTime < 0 {
			result.AverageAnalysisTime = 0
		}
		// 保留小数点后两位
		roundedTime := float64(int(result.AverageAnalysisTime*100+0.5)) / 100
		return &DashboardOverview{
			TotalAlerts:         result.TotalAlerts,
			AverageAnalysisTime: roundedTime,
			TruePositiveCount:   result.TruePositiveCount,
			FalsePositiveCount:  result.FalsePositiveCount,
			InvalidCount:        result.InvalidCount,
			SuspiciousCount:     result.SuspiciousCount,
		}, nil
	}

	// 如果没有结果，返回默认值
	return &DashboardOverview{
		TotalAlerts:         0,
		AverageAnalysisTime: 0,
		TruePositiveCount:   0,
		FalsePositiveCount:  0,
		InvalidCount:        0,
		SuspiciousCount:     0,
	}, nil
}

// 批量计算看板详细数据（优化版）
func (r *DashboardRepo) calculateDashboardDetailBatch(ctx context.Context, query bson.M) (*DashboardDetail, error) {
	// 构建聚合管道，一次性计算所有详细数据
	pipeline := []bson.M{
		{
			"$match": query,
		},
		{
			"$project": bson.M{
				"analysis_result_type": "$detail.analysis_result_type",
				"alert_source":        "$detail.alert_source",
				"alert_severity":      "$detail.alert_severity",
			},
		},
		{
			"$facet": bson.M{
				"result_type_distribution": []bson.M{
					{
						"$group": bson.M{
							"_id":   "$analysis_result_type",
							"count": bson.M{"$sum": 1},
						},
					},
					{
						"$sort": bson.M{"count": -1},
					},
				},
				"alert_source_distribution": []bson.M{
					{
						"$group": bson.M{
							"_id":   "$alert_source",
							"count": bson.M{"$sum": 1},
						},
					},
					{
						"$sort": bson.M{"count": -1},
					},
				},
				"alert_severity_distribution": []bson.M{
					{
						"$group": bson.M{
							"_id":   "$alert_severity",
							"count": bson.M{"$sum": 1},
						},
					},
					{
						"$sort": bson.M{"count": -1},
					},
				},
			},
		},
	}

	// 执行聚合
	col := r.client.GetCollection(CollectionDashboard)
	cursor, err := col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate dashboard detail: %v", err)
	}
	defer cursor.Close(ctx)

	// 解析结果
	var result struct {
		ResultTypeDistribution    []struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		} `bson:"result_type_distribution"`
		AlertSourceDistribution   []struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		} `bson:"alert_source_distribution"`
		AlertSeverityDistribution []struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		} `bson:"alert_severity_distribution"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return nil, fmt.Errorf("failed to decode result: %v", err)
		}
		
		// 转换结果类型
		resultTypeDistribution := make([]DistributionData, len(result.ResultTypeDistribution))
		for i, item := range result.ResultTypeDistribution {
			resultTypeDistribution[i] = DistributionData{
				Name:  item.ID,
				Value: item.Count,
			}
		}
		
		alertSourceDistribution := make([]DistributionData, len(result.AlertSourceDistribution))
		for i, item := range result.AlertSourceDistribution {
			alertSourceDistribution[i] = DistributionData{
				Name:  item.ID,
				Value: item.Count,
			}
		}
		
		alertSeverityDistribution := make([]DistributionData, len(result.AlertSeverityDistribution))
		for i, item := range result.AlertSeverityDistribution {
			alertSeverityDistribution[i] = DistributionData{
				Name:  item.ID,
				Value: item.Count,
			}
		}
		
		return &DashboardDetail{
			ResultTypeDistribution:    resultTypeDistribution,
			AlertSourceDistribution:   alertSourceDistribution,
			AlertSeverityDistribution: alertSeverityDistribution,
		}, nil
	}

	// 如果没有结果，返回默认值
	return &DashboardDetail{
		ResultTypeDistribution:    []DistributionData{},
		AlertSourceDistribution:   []DistributionData{},
		AlertSeverityDistribution: []DistributionData{},
	}, nil
}
