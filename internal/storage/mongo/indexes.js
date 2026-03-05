// MongoDB索引创建语句
// 这些索引旨在优化soc_agent项目中的查询性能

// 连接到MongoDB
// mongo "mongodb://localhost:27017/soc_agent"

// 1. alert_analyses集合索引
// 用于根据analysis_id查询单个文档
// 适用于GetAlertAnalysisByID、UpdateAlertAnalysis等操作
db.alert_analyses.createIndex({ "detail.analysis_id": 1 });

// 用于告警分析列表查询，支持多种筛选条件
// 适用于GetAlertAnalysisList操作，包含常用的筛选字段
db.alert_analyses.createIndex({ "detail.alert_source": 1, "detail.analysis_result_type": 1, "create_timestamp": -1 });

// 用于时间范围查询，优化dashboard和列表查询中的时间筛选
db.alert_analyses.createIndex({ "create_timestamp": -1 });

// 用于dashboard聚合查询，优化趋势分析和时间分组
db.alert_analyses.createIndex({ "detail.analysis_start_time": 1 });

// 用于dashboard聚合查询，优化结果类型分布分析
db.alert_analyses.createIndex({ "detail.analysis_result_type": 1 });

// 用于dashboard聚合查询，优化告警来源分布分析
db.alert_analyses.createIndex({ "detail.alert_source": 1 });

// 用于dashboard聚合查询，优化告警级别分布分析
db.alert_analyses.createIndex({ "detail.alert_severity": 1 });

// 2. alert_feedback集合索引
// 用于根据analysis_uid查询反馈数据
// 适用于GetFeedbackByAnalysisUID操作
db.alert_feedback.createIndex({ "analysis_uid": 1, "feedback_time": -1 });

// 用于根据_id查询、删除和更新反馈数据
// 适用于GetFeedbackByID、DeleteFeedback、UpdateFeedback操作
db.alert_feedback.createIndex({ "_id": 1 });

// 用于反馈数据列表查询，支持分页和排序
// 适用于ListFeedbacks操作
db.alert_feedback.createIndex({ "feedback_time": -1 });

// 3. alert_feature集合索引
// 用于根据core_feature_md5查询特征数据
// 适用于GetFeatureByCoreFeatureMD5操作
db.alert_feature.createIndex({ "core_feature_md5": 1 });

// 用于根据milvus_vector_id查询特征数据
// 适用于GetFeatureByMilvusVectorID操作
db.alert_feature.createIndex({ "milvus_vector_id": 1 });

// 用于特征数据列表查询，支持分页和排序
// 适用于ListFeatures操作
db.alert_feature.createIndex({ "create_time": -1 });

// 查看所有索引
// db.alert_analyses.getIndexes();
// db.alert_feedback.getIndexes();
// db.alert_feature.getIndexes();

// 删除不需要的索引
// db.collection.dropIndex(indexName);
