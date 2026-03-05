package tools

import (
	"context"
	"encoding/json"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

// ThreatIntelTool 威胁情报工具
type ThreatIntelTool struct {
	// 工具配置
	config map[string]string
}

// NewThreatIntelTool 创建威胁情报工具
func NewThreatIntelTool(config map[string]string) (*ThreatIntelTool, error) {
	return &ThreatIntelTool{
		config: config,
	}, nil
}

// Info 获取工具信息
func (t *ThreatIntelTool) Info(_ context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "threat_intel_tool",
		Desc: "获取威胁情报上下文信息，用于告警分析",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"ioc_type": {
				Desc:     "IOC类型：ip, domain, hostname, hash",
				Type:     schema.String,
				Required: true,
			},
			"ioc_value": {
				Desc:     "IOC值",
				Type:     schema.String,
				Required: true,
			},
		}),
	}, nil
}

// InvokableRun 执行工具
func (t *ThreatIntelTool) InvokableRun(ctx context.Context, argumentsInJSON string, _ ...tool.Option) (string, error) {
	logrus.Info("Invoking threat intel tool")

	// 解析参数
	var params map[string]interface{}
	if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
		return "", err
	}

	// 提取参数
	iocType, _ := params["ioc_type"].(string)
	iocValue, _ := params["ioc_value"].(string)

	logrus.Infof("Threat intel request: type=%s, value=%s", iocType, iocValue)

	// 获取威胁情报
	result := t.getThreatIntel(iocType, iocValue)

	return result, nil
}

// getThreatIntel 获取威胁情报
func (t *ThreatIntelTool) getThreatIntel(iocType, iocValue string) string {
	// 模拟威胁情报结果
	result := map[string]interface{}{
		"ioc_type":   iocType,
		"ioc_value":  iocValue,
		"source":     "Local Threat Intelligence",
		"timestamp":  "2024-01-15T10:00:00Z",
		"is_malicious": false,
		"threat_level": "low",
		"threat_type": "",
		"description": "No threats found",
		"related_iocs": []string{},
		"tags": []string{},
	}

	// 根据IOC类型和值返回不同的模拟结果
	switch iocType {
	case "ip":
		if iocValue == "192.168.1.1" {
			result["is_malicious"] = true
			result["threat_level"] = "high"
			result["threat_type"] = "Botnet Command and Control"
			result["description"] = "This IP is known to be a botnet C2 server"
			result["related_iocs"] = []string{"192.168.1.2", "192.168.1.3"}
			result["tags"] = []string{"botnet", "c2", "malicious"}
		}
	case "domain":
		if iocValue == "malicious.com" {
			result["is_malicious"] = true
			result["threat_level"] = "critical"
			result["threat_type"] = "Malware Distribution"
			result["description"] = "This domain distributes malware"
			result["related_iocs"] = []string{"1.1.1.1", "2.2.2.2"}
			result["tags"] = []string{"malware", "distribution", "critical"}
		}
	}

	resultJSON, _ := json.Marshal(result)
	return string(resultJSON)
}
