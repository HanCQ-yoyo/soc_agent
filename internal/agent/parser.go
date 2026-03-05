package agent

import (
	"regexp"
	"strings"

	"soc_agent/internal/models"
)

// ParseAlertString 使用正则表达式解析告警字符串为AlertUnifiedModel
// 输入：告警字符串
// 输出：AlertUnifiedModel
func ParseAlertString(alertString string) *models.AlertUnifiedModel {
	// 初始化AlertUnifiedModel
	alertModel := &models.AlertUnifiedModel{}
	// 移除所有空白行和多余的空格，确保JSON格式正确
	alertString = strings.TrimSpace(alertString)
	alertString = strings.ReplaceAll(alertString, "\n", " ")
	alertString = strings.ReplaceAll(alertString, "  ", " ")
	// 定义字段映射，键为结构体字段名，值为JSON键名
	fieldMappings := map[string]string{
		"DeviceID":                 "设备ID",
		"FileMD5":                  "文件md5",
		"DomainName":               "域名",
		"AlertID":                  "告警ID",
		"AlertName":                "告警名称",
		"AlertCategory":            "告警分类",
		"AlertSource":              "告警来源",
		"OccurrenceTime":           "发生时间",
		"HostIP":                   "主机IP",
		"AssetOwner":               "资产负责人",
		"SourceIP":                 "源IP",
		"DestinationIP":            "目的IP",
		"SourcePort":               "源端口",
		"DestinationPort":          "目的端口",
		"NetworkConnection":        "网络连接",
		"AttackDirection":          "攻击方向",
		"IsInternalAsset":          "是否内部资产",
		"Vulnerability":            "漏洞",
		"ProcessChain":             "进程链",
		"Tools":                    "工具",
		"FileNamePath":             "文件名及路径",
		"ProcessSignature":         "进程签名",
		"ExecutionPermission":      "执行权限",
		"ProcessCommandLine":       "进程启动命令行",
		"ParentProcessCommandLine": "父进程启动命令行",
		"ProcessGroupCommandLine":  "进程组命令行",
		"HTTPRequestContent":       "http请求内容",
		"HTTPResponseContent":      "http响应内容",
		"Payload":                  "Payload",
		"PCAP":                     "PCAP",
		"CodeSnippet":              "代码片段",
		"DisposalResult":           "处置结果",
		"RiskFeatures":             "风险特征",
		"EventSummary":             "事件摘要",
		"RawAlertData":             "原始告警数据",
		"AnalysisID":               "分析ID",
		"AnalysisTime":             "分析时间",
		"AlertDescription":         "告警描述",
		"AlertType":                "告警类型",
		"Severity":                 "严重程度",
		"Status":                   "状态",
		"Confidence":               "置信度",
		"Tags":                     "标签",
	}

	// 解析字符串字段
	for fieldName, jsonKey := range fieldMappings {
		// 构建正则表达式，匹配键值对
		// 注意：处理不同类型的值（字符串、数字、布尔值、数组等）
		regexPattern := `"` + regexp.QuoteMeta(jsonKey) + `":\s*(["\[][^"\[\]]*["\]]|true|false|null|\d+)`
		re := regexp.MustCompile(regexPattern)
		matches := re.FindStringSubmatch(alertString)

		if len(matches) > 1 {
			value := strings.TrimSpace(matches[1])

			// 根据字段名设置对应的值
			switch fieldName {
			case "DeviceID":
				alertModel.DeviceID = extractValue(value)
			case "FileMD5":
				alertModel.FileMD5 = extractValue(value)
			case "DomainName":
				alertModel.DomainName = extractValue(value)
			case "AlertID":
				alertModel.AlertID = extractValue(value)
			case "AlertName":
				alertModel.AlertName = extractValue(value)
			case "AlertCategory":
				alertModel.AlertCategory = extractValue(value)
			case "AlertSource":
				alertModel.AlertSource = extractValue(value)
			case "OccurrenceTime":
				alertModel.OccurrenceTime = extractValue(value)
			case "HostIP":
				alertModel.HostIP = extractValue(value)
			case "AssetOwner":
				alertModel.AssetOwner = extractValue(value)
			case "SourceIP":
				alertModel.SourceIP = extractValue(value)
			case "DestinationIP":
				alertModel.DestinationIP = extractValue(value)
			case "SourcePort":
				alertModel.SourcePort = extractValue(value)
			case "DestinationPort":
				alertModel.DestinationPort = extractValue(value)
			case "NetworkConnection":
				alertModel.NetworkConnection = extractValue(value)
			case "AttackDirection":
				alertModel.AttackDirection = extractValue(value)
			case "IsInternalAsset":
				alertModel.IsInternalAsset = extractValue(value)
			case "Vulnerability":
				alertModel.Vulnerability = extractValue(value)
			case "ProcessChain":
				alertModel.ProcessChain = extractValue(value)
			case "Tools":
				alertModel.Tools = extractValue(value)
			case "FileNamePath":
				alertModel.FileNamePath = extractValue(value)
			case "ProcessSignature":
				alertModel.ProcessSignature = extractValue(value)
			case "ExecutionPermission":
				alertModel.ExecutionPermission = extractValue(value)
			case "ProcessCommandLine":
				alertModel.ProcessCommandLine = extractValue(value)
			case "ParentProcessCommandLine":
				alertModel.ParentProcessCommandLine = extractValue(value)
			case "ProcessGroupCommandLine":
				alertModel.ProcessGroupCommandLine = extractValue(value)
			case "HTTPRequestContent":
				alertModel.HTTPRequestContent = extractValue(value)
			case "HTTPResponseContent":
				alertModel.HTTPResponseContent = extractValue(value)
			case "Payload":
				alertModel.Payload = extractValue(value)
			case "PCAP":
				alertModel.PCAP = extractValue(value)
			case "CodeSnippet":
				alertModel.CodeSnippet = extractValue(value)
			case "DisposalResult":
				alertModel.DisposalResult = extractValue(value)
			case "RiskFeatures":
				alertModel.RiskFeatures = extractValue(value)
			case "EventSummary":
				alertModel.EventSummary = extractValue(value)
			case "RawAlertData":
				alertModel.RawAlertData = extractValue(value)
			case "AnalysisID":
				alertModel.AnalysisID = extractValue(value)
			case "AnalysisTime":
				alertModel.AnalysisTime = extractValue(value)
			case "AlertDescription":
				alertModel.AlertDescription = extractValue(value)
			case "AlertType":
				alertModel.AlertType = extractValue(value)
			case "Severity":
				alertModel.Severity = extractValue(value)
			case "Status":
				alertModel.Status = extractValue(value)
			case "Confidence":
				alertModel.Confidence = extractValue(value)
			case "Tags":
				// 处理数组类型
				if strings.HasPrefix(value, "[") {
					// 简单处理，直接作为字符串返回
					alertModel.Tags = value
				} else {
					alertModel.Tags = value
				}
			}
		}
	}
	return alertModel
}

// extractValue 提取并处理值
func extractValue(value string) interface{} {
	// 移除引号
	value = strings.Trim(value, `"`)

	// 处理空字符串
	if value == "" {
		return ""
	}

	// 处理布尔值
	if value == "true" {
		return true
	}
	if value == "false" {
		return false
	}

	// 处理null
	if value == "null" {
		return nil
	}

	// 处理数组
	if strings.HasPrefix(value, "[") {
		return value
	}

	// 默认返回字符串
	return value
}
