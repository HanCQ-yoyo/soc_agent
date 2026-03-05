package models

// AlertUnifiedModel 统一告警模型
// 包含用户要求的所有告警模型相关字段
// 基础字段
type AlertUnifiedModel struct {
	DeviceID       interface{} `json:"设备ID"`
	FileMD5        interface{} `json:"文件md5"`
	DomainName     interface{} `json:"域名"`
	AlertID        interface{} `json:"告警ID"`
	AlertName      interface{} `json:"告警名称"`
	AlertCategory  interface{} `json:"告警分类"`
	AlertSource    interface{} `json:"告警来源"`
	OccurrenceTime interface{} `json:"发生时间"`
	AssetType      interface{} `json:"资产类型"`
	AssetID        interface{} `json:"资产ID"`
	HostIP         interface{} `json:"主机IP"`
	AssetOwner     interface{} `json:"资产负责人"`

	// 网络相关字段
	SourceIP          interface{} `json:"源IP"`
	DestinationIP     interface{} `json:"目的IP"`
	SourcePort        interface{} `json:"源端口"`
	DestinationPort   interface{} `json:"目的端口"`
	NetworkConnection interface{} `json:"网络连接"`
	AttackDirection   interface{} `json:"攻击方向"`
	IsInternalAsset   interface{} `json:"是否内部资产"`

	// 漏洞与威胁相关字段
	Vulnerability       interface{} `json:"漏洞"`
	ProcessChain        interface{} `json:"进程链"`
	Tools               interface{} `json:"工具"`
	FileNamePath        interface{} `json:"文件名及路径"`
	ProcessSignature    interface{} `json:"进程签名"`
	ExecutionPermission interface{} `json:"执行权限"`

	// 进程相关字段
	ProcessCommandLine       interface{} `json:"进程启动命令行"`
	ParentProcessCommandLine interface{} `json:"父进程启动命令行"`
	ProcessGroupCommandLine  interface{} `json:"进程组命令行"`

	// HTTP相关字段
	HTTPRequestContent  interface{} `json:"http请求内容"`
	HTTPResponseContent interface{} `json:"http响应内容"`
	Payload             interface{} `json:"Payload"`

	// 其他字段
	PCAP           interface{} `json:"PCAP"`
	CodeSnippet    interface{} `json:"代码片段"`
	DisposalResult interface{} `json:"处置结果"`
	RiskFeatures   interface{} `json:"风险特征"`
	EventSummary   interface{} `json:"事件摘要"`

	// 原始数据和分析元数据
	RawAlertData     interface{} `json:"原始告警数据"`
	AnalysisID       interface{} `json:"分析ID"`
	AnalysisTime     interface{} `json:"分析时间"`
	AlertDescription interface{} `json:"告警描述"`
	AlertType        interface{} `json:"告警类型"`
	Severity         interface{} `json:"严重程度"`
	Status           interface{} `json:"状态"`
	Confidence       interface{} `json:"置信度"`
	Tags             interface{} `json:"标签"`
}

// AlertParserOutput 告警解析输出结果
type AlertParserOutput struct {
	AlertUnifiedModel *AlertUnifiedModel `json:"alert_unified_model"`
	Error             string             `json:"error,omitempty"`
}
