package agent

import (
	"context"
	"soc_agent/internal/config"
	"time"

	"github.com/cloudwego/eino-ext/components/model/deepseek"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/samber/lo"
	"github.com/sirupsen/logrus"
)

func CreateDeepSeekChatModel(cfg *config.Config) (*deepseek.ChatModel, error) {
	// 设置超时时间，默认600秒
	timeout := 600
	if cfg.LLM.Deepseek.Timeout > 0 {
		timeout = cfg.LLM.Deepseek.Timeout
	}
	modelConf := &deepseek.ChatModelConfig{
		BaseURL:     cfg.LLM.Deepseek.BaseURL,
		APIKey:      cfg.LLM.Deepseek.APIKey,
		Model:       cfg.LLM.Deepseek.ModelName,
		Temperature: float32(cfg.LLM.Deepseek.Temperature),
		Timeout:     time.Duration(timeout) * time.Second,
	}

	// 使用带独立超时的上下文（避免全局上下文干扰）
	createCtx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	chatModel, err := deepseek.NewChatModel(createCtx, modelConf)
	if err != nil {
		return nil, err
	}

	logrus.Infof("successfully created deepseek chat model (model: %s, timeout: %ds)", cfg.LLM.Deepseek.ModelName, timeout)
	return chatModel, nil
}

func CreateQwen3ChatModel(cfg *config.Config) (*openai.ChatModel, error) {

	// 设置超时时间，默认600秒
	timeout := 600
	if cfg.LLM.Qwen3.Timeout > 0 {
		timeout = cfg.LLM.Qwen3.Timeout
	}

	modelConf := &openai.ChatModelConfig{
		BaseURL:     cfg.LLM.Qwen3.BaseURL,
		APIKey:      cfg.LLM.Qwen3.APIKey,
		Model:       cfg.LLM.Qwen3.ModelName,
		Temperature: lo.ToPtr(float32(cfg.LLM.Qwen3.Temperature)),
		Timeout:     time.Duration(timeout) * time.Second,
	}

	// 尝试创建真实的ChatModel实例
	chatModel, err := openai.NewChatModel(context.Background(), modelConf)
	if err != nil {
		logrus.Errorf("Failed to create OpenAI chat model: %v, using mock implementation", err)
		// 如果创建失败，使用模拟实现
		return nil, err
	}

	return chatModel, nil
}

func CreateVolcArkChatModel(cfg *config.Config) (*openai.ChatModel, error) {

	// 设置超时时间，默认600秒
	timeout := 600
	if cfg.LLM.VolcArk.Timeout > 0 {
		timeout = cfg.LLM.VolcArk.Timeout
	}

	modelConf := &openai.ChatModelConfig{
		BaseURL:     cfg.LLM.VolcArk.BaseURL,
		APIKey:      cfg.LLM.VolcArk.APIKey,
		Model:       cfg.LLM.VolcArk.ModelName,
		Temperature: lo.ToPtr(float32(cfg.LLM.VolcArk.Temperature)),
		Timeout:     time.Duration(timeout) * time.Second,
	}

	// 尝试创建真实的ChatModel实例
	chatModel, err := openai.NewChatModel(context.Background(), modelConf)
	if err != nil {
		logrus.Errorf("Failed to create chat model: %v, using mock implementation", err)
		// 如果创建失败，使用模拟实现
		return nil, err
	}

	return chatModel, nil
}
