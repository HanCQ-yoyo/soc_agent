package agent

import (
	"context"
	"errors"
	"time"

	"soc_agent/internal/config"
	"soc_agent/internal/consts"
	"soc_agent/internal/models"
	"soc_agent/internal/storage/milvus"
	"soc_agent/internal/storage/mongo"
	"soc_agent/internal/tools/mcp"
	"soc_agent/internal/utils"

	"github.com/bytedance/sonic"
	clc "github.com/cloudwego/eino-ext/callbacks/cozeloop"
	"github.com/cloudwego/eino-ext/components/embedding/ollama"
	"github.com/cloudwego/eino/callbacks"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/coze-dev/cozeloop-go"
	"github.com/kaptinlin/jsonrepair"
	"github.com/milvus-io/milvus-sdk-go/v2/client"
	"github.com/sirupsen/logrus"
)

// SOCAgentWorkflow 安全运营智能体工作流
type SOCAgentWorkflow struct {
	// Eino工作流
	Workflow compose.Runnable[models.WorkflowInput, models.AlertResponse]
	// 配置
	Cfg *config.Config
	// Milvus客户端
	MilvusClient client.Client
	// 嵌入模型
	Embedder *ollama.Embedder
	// mongo客户端
	MongoClient *mongo.Client
	// 提示词模板存储库
	PromptTemplateRepo *mongo.PromptTemplateRepo
}

// NewSOCAgentWorkflow 创建工作流实例
func NewSOCAgentWorkflow(ctx context.Context, milvusClient *milvus.MilvusClient,
	mongoClient *mongo.Client) (*SOCAgentWorkflow, error) {
	// 创建配置
	cfg := config.GetConfig()

	// 创建提示词模板存储库
	var promptTemplateRepo *mongo.PromptTemplateRepo
	if mongoClient != nil {
		promptTemplateRepo = mongo.NewPromptTemplateRepo(mongoClient)
	}

	// 初始化Eino回调
	// initEinoCallbacks(ctx, cfg)

	if milvusClient == nil {
		logrus.Errorf("Milvus client is nil")
		return nil, errors.New("Milvus client is nil")
	}
	if mongoClient == nil {
		logrus.Errorf("MongoDB client is nil")
		return nil, errors.New("MongoDB client is nil")
	}

	embedder, err := milvus.GetEmbedder(cfg.Embedding)
	if err != nil {
		logrus.Errorf("Failed to initialize embedder: %v", err)
		return nil, err
	}

	// 创建工作流
	workflow, err := buildWorkflow(ctx, cfg, milvusClient, mongoClient, promptTemplateRepo)
	if err != nil {
		return nil, err
	}

	return &SOCAgentWorkflow{
		Cfg:                cfg,
		Workflow:           workflow,
		MilvusClient:       milvusClient.GetClient(),
		Embedder:           embedder,
		MongoClient:        mongoClient,
		PromptTemplateRepo: promptTemplateRepo,
	}, nil
}

// Execute 执行工作流
func (w *SOCAgentWorkflow) Execute(ctx context.Context, analysisID string, alertData string, source string) (*models.AlertResponse, error) {
	// 准备输入数据

	input := models.WorkflowInput{
		AnalysisID: analysisID,
		AlertData:  alertData,
		Source:     source,
		Timestamp:  time.Now().UnixMilli(),
	}

	// 执行工作流
	result, err := w.Workflow.Invoke(ctx, input)
	if err != nil {
		logrus.Errorf("Workflow execution failed: %v", err)
		return nil, err
	}

	return &result, nil
}

// Close 关闭工作流
func (w *SOCAgentWorkflow) Close() error {
	if w.MilvusClient != nil {
		w.MilvusClient.Close()
	}
	return nil
}

// ProcessChatMessage 处理聊天消息
func (w *SOCAgentWorkflow) ProcessChatMessage(ctx context.Context, chatContext string) (string, error) {
	// 简单返回一个模拟响应，实际实现需要根据Eino API进行调整
	// 这里使用模拟响应是为了确保聊天功能能够正常运行
	return "我收到了您的消息：" + chatContext + "\n\n这是一个模拟响应，实际实现需要集成真实的LLM模型。", nil
}

// 初始化Eino回调
func getCozeCallbackHandles(ctx context.Context, cfg *config.Config) []callbacks.Handler {
	var handlers []callbacks.Handler
	// 如果启用了CozeLoop追踪
	if !cfg.Eino.TraceEnabled {
		return handlers
	}
	if cfg.Eino.CozeLoopAPIToken != "" && cfg.Eino.CozeLoopWorkspaceID != "" {
		client, err := cozeloop.NewClient(
			cozeloop.WithAPIToken(cfg.Eino.CozeLoopAPIToken),
			cozeloop.WithWorkspaceID(cfg.Eino.CozeLoopWorkspaceID),
		)
		if err != nil {
			logrus.Errorf("Failed to create CozeLoop client: %v", err)
			return handlers
		}
		defer client.Close(ctx)

		// 创建CozeLoop处理器并添加到handlers
		cozeHandler := clc.NewLoopHandler(client)
		handlers = append(handlers, cozeHandler)
	}
	return handlers
}

func buildWorkflow(ctx context.Context, cfg *config.Config, milvusClient *milvus.MilvusClient,
	mongoClient *mongo.Client, promptTemplateRepo *mongo.PromptTemplateRepo) (compose.Runnable[models.WorkflowInput, models.AlertResponse], error) {

	wf := compose.NewWorkflow[models.WorkflowInput, models.AlertResponse]()

	// ============ 阶段1: 告警解析 ============
	alertParserChatModel, err := CreateDeepSeekChatModel(cfg)
	if err != nil {
		logrus.Errorf("Failed to create chat model: %v", err)
		return nil, err
	}

	alertParserPrompt := GetPromptTemplateByKey(ctx, promptTemplateRepo, consts.PromptTemplateKeyAlertParser)
	if alertParserPrompt == nil {
		return nil, errors.New("Failed to get alert parser prompt")
	}

	wf.AddChatTemplateNode("alert_parser_template", alertParserPrompt).
		AddInput(compose.START,
			compose.MapFields("AnalysisID", "analysis_id"),
			compose.MapFields("Source", "source"),
			compose.MapFields("Timestamp", "timestamp"),
			compose.MapFields("AlertData", "raw_data"))

	wf.AddChatModelNode("alert_parser_model", alertParserChatModel).
		AddInput("alert_parser_template")

	type ChatModelResult struct {
		ChatModelResult *schema.Message
		AnalysisID      string
	}

	alertParserLambda := func(ctx context.Context, result ChatModelResult) (*models.AlertUnifiedModel, error) {
		if result.ChatModelResult == nil {
			return nil, errors.New("chat model result is nil")
		}

		logrus.Infof("Parsing alert for analysis: %s", result.AnalysisID)

		var alertUnifiedModel models.AlertUnifiedModel
		parserResult, err := jsonrepair.JSONRepair(result.ChatModelResult.Content)
		if err != nil {
			logrus.Errorf("Failed to repair JSON: %v", err)
			return ParseAlertString(result.ChatModelResult.Content), nil
		}

		err = sonic.UnmarshalString(parserResult, &alertUnifiedModel)
		if err != nil {
			logrus.Errorf("Failed to unmarshal alert unified model: %v", err)
			return ParseAlertString(result.ChatModelResult.Content), nil
		}

		return &alertUnifiedModel, nil
	}

	wf.AddLambdaNode("alert_parser_lambda", compose.InvokableLambda(alertParserLambda)).
		AddInput("alert_parser_model", compose.ToField("ChatModelResult")).
		AddInputWithOptions(compose.START,
			[]*compose.FieldMapping{compose.MapFields("AnalysisID", "AnalysisID")},
			compose.WithNoDirectDependency())

	// ============ 阶段2: 工具调用 ============
	useToolChatModel, err := CreateDeepSeekChatModel(cfg)
	if err != nil {
		return nil, err
	}

	useToolPrompt := GetPromptTemplateByKey(ctx, promptTemplateRepo, consts.PromptTemplateKeyUseTool)
	if useToolPrompt == nil {
		return nil, errors.New("Failed to get use tool prompt")
	}

	wf.AddChatTemplateNode("use_tool_template", useToolPrompt).
		AddInput("alert_parser_lambda", compose.ToField("alert_data"))

	wf.AddChatModelNode("use_tool_model", useToolChatModel).
		AddInput("use_tool_template")

	var tools []tool.BaseTool
	mcpTools, err := mcp.GetMCPTool(context.Background(), config.AppConfig.MCP)
	if err != nil {
		return nil, err
	}
	tools = append(tools, mcpTools...)

	var toolsInfos []*schema.ToolInfo
	for _, t := range tools {
		info, err := t.Info(context.Background())
		if err != nil {
			return nil, err
		}
		toolsInfos = append(toolsInfos, info)
	}

	err = useToolChatModel.BindForcedTools(toolsInfos)
	if err != nil {
		return nil, err
	}

	toolsNode, err := compose.NewToolNode(context.Background(), &compose.ToolsNodeConfig{
		Tools: tools,
	})
	if err != nil {
		return nil, err
	}

	wf.AddToolsNode("use_tool_node", toolsNode).
		AddInput("use_tool_model")

	// ============ 阶段3: 知识检索 ============
	type retrievalInput struct {
		UnifiedAlertModel *models.AlertUnifiedModel
	}

	knowledgeRetrievalLambda := func(ctx context.Context, input retrievalInput) (string, error) {
		matcher := GetMatchOp(mongoClient, milvusClient)
		prompt, err := matcher.GenPromptWithFeedbackANdAnalysis(input.UnifiedAlertModel)
		if err != nil {
			return "", err
		}
		return prompt, nil
	}

	wf.AddLambdaNode("knowledge_retrieval",
		compose.InvokableLambda(knowledgeRetrievalLambda)).
		AddInput("alert_parser_lambda", compose.ToField("UnifiedAlertModel"))

	// ============ 阶段4: 初次研判 ============
	initialJudgmentChatModel, err := CreateQwen3ChatModel(cfg)
	if err != nil {
		return nil, err
	}

	initialJudgmentPrompt := GetPromptTemplateByKey(ctx, promptTemplateRepo, consts.PromptTemplateKeyInitialJudgment)
	if initialJudgmentPrompt == nil {
		return nil, errors.New("Failed to get initial judgment prompt")
	}

	wf.AddChatTemplateNode("initial_judgment_template", initialJudgmentPrompt).
		AddInput("use_tool_node", compose.ToField("UseToolResult")).
		AddInput("alert_parser_model", compose.ToField("UnifiedModel")).
		AddInput("knowledge_retrieval", compose.ToField("KnowledgeRetrievalResult"))

	wf.AddChatModelNode("initial_judgment_model", initialJudgmentChatModel).
		AddInput("initial_judgment_template")

	initialJudgmentLambda := func(ctx context.Context, result ChatModelResult) (*models.InitialJudgmentResult, error) {
		if result.ChatModelResult == nil {
			return nil, errors.New("chat model result is nil")
		}

		logrus.Infof("Performing initial judgment for alert: %s", result.AnalysisID)

		var output models.InitialJudgmentResult
		initialJudgmentResult, err := jsonrepair.JSONRepair(result.ChatModelResult.Content)
		if err != nil {
			logrus.Errorf("Failed to repair JSON: %v", err)
			return nil, err
		}

		err = sonic.UnmarshalString(initialJudgmentResult, &output)
		if err != nil {
			logrus.Errorf("Failed to unmarshal initial judgment result: %v", err)
			return &models.InitialJudgmentResult{
				ResultType: "invalid",
				Reason:     "无法解析研判结果，标记为无效告警",
				Confidence: 0.0,
			}, nil
		}

		return &output, nil
	}

	wf.AddLambdaNode("initial_judgment_lambda", compose.InvokableLambda(initialJudgmentLambda)).
		AddInput("initial_judgment_model", compose.ToField("ChatModelResult")).
		AddInputWithOptions(compose.START,
			[]*compose.FieldMapping{compose.MapFields("AnalysisID", "AnalysisID")},
			compose.WithNoDirectDependency())

	// 解析初步研判
	type UnifiedIntegrationInput struct {
		InitialJudgmentResult *models.InitialJudgmentResult
		DeepJudgmentResult    *models.DeepJudgmentResult
		UnifiedAlertModel     *models.AlertUnifiedModel
		UnifiedAlertModelRaw  *schema.Message
		UseToolCallList       *schema.Message
		KnowledgeBaseResults  interface{}
		UseToolResult         []*schema.Message
		WorkflowInput         models.WorkflowInput
	}

	initialUnifiedResultIntegrationLambda := func(ctx context.Context, input UnifiedIntegrationInput) (models.AlertResponse, error) {
		logrus.Infof("Integrating results for alert: %s", input.WorkflowInput.AnalysisID)

		uniModel := input.UnifiedAlertModel
		var alertAssetID, alertAssetType string

		// 提取资产信息
		if uniModel.AssetID != nil {
			alertAssetID = utils.GetStrField(uniModel.AssetID)
			alertAssetType = utils.GetStrField(uniModel.AssetType)
		} else if uniModel.DeviceID != nil {
			alertAssetID = utils.GetStrField(uniModel.DeviceID)
			alertAssetType = "device"
		} else if uniModel.HostIP != nil {
			alertAssetID = utils.GetStrField(uniModel.HostIP)
			alertAssetType = "host"
		} else if uniModel.DomainName != nil {
			alertAssetID = utils.GetStrField(uniModel.DomainName)
			alertAssetType = "domain"
		}

		// 解析工具结果
		var toolsResults []map[string]interface{}
		for _, msg := range input.UseToolResult {
			var toolResult map[string]interface{}
			if err := sonic.UnmarshalString(msg.Content, &toolResult); err != nil {
				logrus.Errorf("Failed to unmarshal tool result: %v", err)
				continue
			}
			toolsResults = append(toolsResults, toolResult)
		}

		// 构建基础响应
		alertResponse := models.AlertResponse{
			AlertUUID:                utils.GetStrField(uniModel.AlertID),
			AlertEventTimestamp:      utils.GetStrField(uniModel.OccurrenceTime),
			AlertName:                utils.GetStrField(uniModel.AlertName),
			AlertDescription:         utils.GetStrField(uniModel.AlertDescription),
			AlertCategory:            utils.GetStrField(uniModel.AlertCategory),
			AlertAssetID:             alertAssetID,
			AlertAssetType:           alertAssetType,
			AlertAssetOwner:          utils.GetStrField(uniModel.AssetOwner),
			AlertSourceIP:            utils.GetStrField(uniModel.SourceIP),
			AlertSourcePort:          utils.GetStrField(uniModel.SourcePort),
			AlertDestinationIP:       utils.GetStrField(uniModel.DestinationIP),
			AlertDestinationPort:     utils.GetStrField(uniModel.DestinationPort),
			AlertDirection:           utils.GetStrField(uniModel.AttackDirection),
			AlertSource:              input.WorkflowInput.Source,
			AlertSeverity:            utils.GetStrField(uniModel.Severity),
			AlertEventSummary:        utils.GetStrField(uniModel.EventSummary),
			RawDataAlert:             input.WorkflowInput.AlertData,
			RawDataGeneralAlertModel: input.UnifiedAlertModelRaw.Content,
			AnalysisID:               input.WorkflowInput.AnalysisID,
			AnalysisStartTime:        input.WorkflowInput.Timestamp,
			AnalysisEndTime:          time.Now().UnixMilli(),
			ToolsRequiredList:        input.UseToolCallList.Content,
			ToolsResult:              toolsResults,
			KnowledgeBaseResults:     input.KnowledgeBaseResults,
		}

		// 处理初次研判结果
		if input.InitialJudgmentResult != nil {
			r := input.InitialJudgmentResult
			resultType := r.ResultType
			resultDesc := ""

			switch resultType {
			case consts.CorrectResultFalsePositive:
				resultDesc = "告警研判为误报"
			case consts.CorrectResultInvalid:
				resultDesc = "告警研判为无效告警"
			case consts.CorrectResultTruePositive:
				resultDesc = "告警已确认为真实攻击"
			case consts.CorrectResultSuspicious:
				resultDesc = "告警研判为可疑告警"
			default:
				resultDesc = "未知结果"
			}

			alertResponse.AnalysisResultType = resultType
			alertResponse.AnalysisResultDesc = resultDesc
			alertResponse.AnalysisInitialDetail = r.Reason
			alertResponse.AnalysisAlertContext = r.AlertContext
			alertResponse.AnalysisConfidence = r.Confidence
		}
		return alertResponse, nil
	}
	wf.AddLambdaNode("initial_unified_result_integration", compose.InvokableLambda(initialUnifiedResultIntegrationLambda)).
		AddInput("initial_judgment_lambda", compose.ToField("InitialJudgmentResult")).
		AddInput("alert_parser_lambda", compose.ToField("UnifiedAlertModel")).
		AddInput("alert_parser_model", compose.ToField("UnifiedAlertModelRaw")).
		AddInput("use_tool_node", compose.ToField("UseToolResult")).
		AddInput("knowledge_retrieval", compose.ToField("KnowledgeBaseResults")).
		AddInput(compose.START, compose.ToField("WorkflowInput")).
		AddInput("use_tool_model", compose.ToField("UseToolCallList"))

	// ============ 分支控制：根据初次研判结果决定是否进行深度研判 ============
	wf.AddBranch("initial_unified_result_integration", compose.NewGraphBranch(
		func(ctx context.Context, in models.AlertResponse) (endNode string, err error) {
			switch in.AnalysisResultType {
			case consts.CorrectResultTruePositive, consts.CorrectResultSuspicious:
				// 真实或可疑告警，执行深度研判
				return "deep_judgment_template", nil
			default:
				return compose.END, nil
			}
		},
		map[string]bool{compose.END: true, "deep_judgment_template": true}))

	// ============ 阶段5: 深度研判（仅当初次研判为真实/可疑时执行） ============
	getDeepJudgmentInput := func(ctx context.Context, input models.AlertResponse) (*models.DeepJudgmentInput, error) {
		deepResult := &models.DeepJudgmentInput{}
		initialResult := models.InitialJudgmentResult{
			ResultType:     input.AnalysisResultType,
			Reason:         input.AnalysisResultDesc,
			AlertContext:   input.AnalysisAlertContext,
			Confidence:     input.AnalysisConfidence,
			AnalysisDetail: input.AnalysisInitialDetail,
		}
		deepResultStr, _ := sonic.MarshalString(initialResult)
		deepResult.InitialJudgmentResult = deepResultStr

		knowledgeStr, _ := sonic.MarshalString(input.KnowledgeBaseResults)
		deepResult.KnowledgeBaseResult = knowledgeStr

		toolStr, _ := sonic.MarshalString(input.ToolsResult)
		deepResult.ToolsResult = toolStr

		deepResult.RawDataGeneralAlertModel = input.RawDataGeneralAlertModel
		return deepResult, nil
	}
	wf.AddLambdaNode("initial_result_recieve", compose.InvokableLambda(getDeepJudgmentInput)).
		AddInput("initial_unified_result_integration")

	deepJudgmentChatModel, err := CreateDeepSeekChatModel(cfg)
	if err != nil {
		return nil, err
	}
	deepJudgmentPrompt := GetPromptTemplateByKey(ctx, promptTemplateRepo, consts.PromptTemplateKeyDeepJudgment)
	if deepJudgmentPrompt == nil {
		return nil, errors.New("Failed to get deep judgment prompt")
	}
	wf.AddChatTemplateNode("deep_judgment_template", deepJudgmentPrompt).
		AddInputWithOptions("initial_result_recieve", []*compose.FieldMapping{
			compose.MapFields("InitialJudgmentResult", "InitialJudgmentResult"),
			compose.MapFields("KnowledgeBaseResult", "KnowledgeRetrievalResult"),
			compose.MapFields("ToolsResult", "UseToolResult"),
			compose.MapFields("RawDataGeneralAlertModel", "UnifiedAlertModel"),
		}, compose.WithNoDirectDependency())

	wf.AddChatModelNode("deep_judgment_model", deepJudgmentChatModel).
		AddInput("deep_judgment_template")
	deepJudgmentLambda := func(ctx context.Context, result ChatModelResult) (*models.DeepJudgmentResult, error) {
		if result.ChatModelResult == nil {
			return nil, errors.New("chat model result is nil")
		}

		var res models.DeepJudgmentResult
		deepJudgmentResult, err := jsonrepair.JSONRepair(result.ChatModelResult.Content)
		if err != nil {
			logrus.Errorf("Failed to repair JSON: %v", err)
			return nil, err
		}
		err = sonic.UnmarshalString(deepJudgmentResult, &res)
		if err != nil {
			logrus.Errorf("Failed to unmarshal deep judgment result: %v", err)
			return &models.DeepJudgmentResult{
				Severity:          "medium",
				AttackType:        "Unknown",
				RecommendedAction: "Review manually",
				RelatedIOCs:       []string{},
				Confidence:        0.5,
				DetailedAnalysis:  "Failed to parse deep judgment result: " + err.Error(),
			}, nil
		}
		return &res, nil
	}
	wf.AddLambdaNode("deep_judgment_lambda", compose.InvokableLambda(deepJudgmentLambda)).
		AddInput("deep_judgment_model", compose.ToField("ChatModelResult"))

	// ============ 阶段6: 统一结果整合 ============
	type DeepUnifiedIntegrationInput struct {
		AlertResponse      models.AlertResponse
		DeepJudgmentResult *models.DeepJudgmentResult
	}

	deepUnifiedResultIntegrationLambda := func(ctx context.Context, input DeepUnifiedIntegrationInput) (models.AlertResponse, error) {
		alertResponse := input.AlertResponse
		// 如果有深度研判结果，用其覆盖初次研判结果
		if input.DeepJudgmentResult != nil {
			r := input.DeepJudgmentResult
			resultType := consts.CorrectResultSuspicious
			resultDesc := "告警研判为可疑告警"

			switch r.ResultType {
			case consts.CorrectResultSuspicious:
				resultType = consts.CorrectResultSuspicious
				resultDesc = "告警研判为可疑告警"
			case consts.CorrectResultFalsePositive:
				resultType = consts.CorrectResultFalsePositive
				resultDesc = "告警研判为误报"
			case consts.CorrectResultInvalid:
				resultType = consts.CorrectResultInvalid
				resultDesc = "告警研判为无效告警"
			case consts.CorrectResultTruePositive:
				resultType = consts.CorrectResultTruePositive
				resultDesc = "告警已确认为真实攻击"
			}

			alertResponse.AnalysisResultType = resultType
			alertResponse.AnalysisResultDesc = resultDesc
			alertResponse.AnalysisRelatedIOCs = r.RelatedIOCs
			alertResponse.AnalysisDisposalSuggestion = r.RecommendedAction
			alertResponse.AnalysisDeepDetail = r.DetailedAnalysis
			alertResponse.AnalysisConfidence = r.Confidence
			alertResponse.AnalysisEvidenceChain = r.EvidenceChain
		}

		return alertResponse, nil
	}

	wf.AddLambdaNode("deep_unified_result_integration", compose.InvokableLambda(deepUnifiedResultIntegrationLambda)).
		AddInput("initial_unified_result_integration", compose.ToField("AlertResponse")).
		AddInput("deep_judgment_lambda", compose.ToField("DeepJudgmentResult"))

	// 连接到END节点
	wf.End().AddInput("deep_unified_result_integration")

	// 编译工作流
	compiledWorkflow, err := wf.Compile(context.Background())
	if err != nil {
		return nil, err
	}

	return compiledWorkflow, nil
}
