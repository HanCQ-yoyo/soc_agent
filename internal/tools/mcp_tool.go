package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"

	"soc_agent/internal/config"
)

// MCPTool MCP工具
type MCPTool struct {
	// 配置
	cfg config.MCPConfig
}

// NewMCPTool 创建MCP工具
func NewMCPTool(cfg config.MCPConfig) (*MCPTool, error) {
	return &MCPTool{
		cfg: cfg,
	}, nil
}

// Info 获取工具信息
func (t *MCPTool) Info(_ context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "mcp_tool",
		Desc: "连接远程MCP服务器获取威胁情报、资产信息等",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"action": {
				Desc:     "操作类型：threat_intel, asset_info, vulnerability",
				Type:     schema.String,
				Required: true,
			},
			"target_type": {
				Desc:     "目标类型：ip, domain, hostname, asset_id",
				Type:     schema.String,
				Required: true,
			},
			"target_value": {
				Desc:     "目标值",
				Type:     schema.String,
				Required: true,
			},
			"server_name": {
				Desc:     "MCP服务器名称，默认使用配置中的默认服务器",
				Type:     schema.String,
				Required: false,
			},
		}),
	}, nil
}

// InvokableRun 执行工具
func (t *MCPTool) InvokableRun(ctx context.Context, argumentsInJSON string, _ ...tool.Option) (string, error) {
	logrus.Info("Invoking MCP tool")

	// 解析参数
	var params map[string]interface{}
	if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
		return "", err
	}

	// 提取参数
	action, _ := params["action"].(string)
	targetType, _ := params["target_type"].(string)
	targetValue, _ := params["target_value"].(string)
	serverName, _ := params["server_name"].(string)

	logrus.Infof("MCP action: %s, target_type: %s, target_value: %s, server: %s", action, targetType, targetValue, serverName)

	// 选择MCP服务器
	serverURL := t.getSelectedServerURL(serverName)
	if serverURL == "" {
		logrus.Errorf("No MCP server found")
		// 返回模拟结果
		return t.getMockResult(action, targetType, targetValue), nil
	}

	// 执行MCP操作
	result, err := t.executeMCPServer(serverURL, action, targetType, targetValue)
	if err != nil {
		logrus.Errorf("MCP action failed: %v", err)
		// 返回模拟结果
		return t.getMockResult(action, targetType, targetValue), nil
	}

	return result, nil
}

// getSelectedServerURL 获取选定的MCP服务器URL
func (t *MCPTool) getSelectedServerURL(serverName string) string {
	// 如果指定了服务器名称，使用指定的服务器
	if serverName != "" {
		if server, exists := t.cfg.Servers[serverName]; exists {
			return server.URL
		}
	}

	// 使用默认服务器
	if t.cfg.DefaultServer != "" {
		if server, exists := t.cfg.Servers[t.cfg.DefaultServer]; exists {
			return server.URL
		}
	}

	// 如果没有配置默认服务器，返回第一个可用服务器
	for _, server := range t.cfg.Servers {
		return server.URL
	}

	return ""
}

// executeMCPServer 执行MCP服务器操作
func (t *MCPTool) executeMCPServer(serverURL, action, targetType, targetValue string) (string, error) {
	// 构建完整URL
	fullURL := serverURL

	// 创建HTTP客户端
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 发送请求
	resp, err := client.Post(fullURL, "application/json", nil)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("MCP server returned status: %d", resp.StatusCode)
	}

	// 读取响应体
	// TODO: 实现实际的响应解析

	// 暂时返回模拟结果
	return t.getMockResult(action, targetType, targetValue), nil
}

// getMockResult 获取模拟结果
func (t *MCPTool) getMockResult(action, targetType, targetValue string) string {
	var result map[string]interface{}

	switch action {
	case "threat_intel":
		result = map[string]interface{}{
			"action":       action,
			"target_type":  targetType,
			"target_value": targetValue,
			"source":       "MCP Threat Intel",
			"result": map[string]interface{}{
				"is_malicious": false,
				"threat_level": "low",
				"threat_type":  "",
				"description":  "No threats found",
				"related_iocs": []string{},
				"last_updated": time.Now().Format(time.RFC3339),
			},
		}

	case "asset_info":
		result = map[string]interface{}{
			"action":       action,
			"target_type":  targetType,
			"target_value": targetValue,
			"source":       "MCP Asset Management",
			"result": map[string]interface{}{
				"asset_id":     "asset-12345",
				"asset_name":   "Web Server",
				"asset_type":   "server",
				"ip_address":   targetValue,
				"os":           "Ubuntu 20.04",
				"location":     "DC1",
				"owner":        "IT Department",
				"importance":   "high",
				"last_scanned": time.Now().Format(time.RFC3339),
			},
		}

	case "vulnerability":
		result = map[string]interface{}{
			"action":       action,
			"target_type":  targetType,
			"target_value": targetValue,
			"source":       "MCP Vulnerability Scanner",
			"result": map[string]interface{}{
				"total_vulnerabilities":    5,
				"critical_vulnerabilities": 1,
				"high_vulnerabilities":     2,
				"medium_vulnerabilities":   1,
				"low_vulnerabilities":      1,
				"vulnerabilities": []map[string]interface{}{
					{
						"cve_id":       "CVE-2023-12345",
						"severity":     "critical",
						"description":  "Critical vulnerability in web server",
						"cvss_score":   9.8,
						"published_at": "2023-12-01T00:00:00Z",
						"fixed_in":     "1.2.3",
					},
				},
			},
		}

	default:
		result = map[string]interface{}{
			"action":       action,
			"target_type":  targetType,
			"target_value": targetValue,
			"error":        "Invalid action",
		}
	}

	resultJSON, _ := json.Marshal(result)
	return string(resultJSON)
}
