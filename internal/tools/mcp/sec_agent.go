package mcp

import (
	"context"
	"fmt"
	"soc_agent/internal/config"

	mcpp "github.com/cloudwego/eino-ext/components/tool/mcp"
	"github.com/cloudwego/eino/components/tool"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

func GetMCPTool(ctx context.Context, config config.MCPConfig) ([]tool.BaseTool, error) {

	secAgentConfig, ok := config.Servers["sec_agent"]
	if !ok {
		return nil, fmt.Errorf("sec_agent server not found in config")
	}
	if secAgentConfig.URL == "" {
		return nil, fmt.Errorf("sec_agent server url is empty")
	}

	// 创建 MCP 客户端
	cli, err := client.NewStreamableHttpClient(secAgentConfig.URL)
	if err != nil {
		return nil, err
	}

	// 启动 MCP 客户端
	err = cli.Start(ctx)
	if err != nil {
		return nil, err
	}

	// 初始化 MCP 客户端
	initReq := mcp.InitializeRequest{}
	initReq.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initReq.Params.ClientInfo = mcp.Implementation{
		Name:    "sec_agent Client",
		Version: "0.0.1",
	}
	_, err = cli.Initialize(ctx, initReq)
	if err != nil {
		return nil, err
	}

	// 获取 MCP 工具
	tools, err := mcpp.GetTools(ctx, &mcpp.Config{
		Cli: cli,
		Meta: &mcp.Meta{
			AdditionalFields: map[string]any{"metadata1": "metadata1"},
		}})
	if err != nil {
		return nil, err
	}
	return tools, nil
}
