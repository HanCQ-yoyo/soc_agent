package agent

import (
	"context"
	"fmt"
	"sync"
	"time"

	"soc_agent/internal/consts"
	"soc_agent/internal/storage/mongo"

	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

// 缓存结构体
type promptCache struct {
	mu         sync.RWMutex
	cache      map[string]cacheItem
	expiryTime time.Duration
}

// 缓存项
type cacheItem struct {
	prompt prompt.ChatTemplate
	expiry time.Time
}

// 全局缓存实例
var (
	promptCacheInstance *promptCache
	once                sync.Once
)

// 获取缓存实例
func getPromptCache() *promptCache {
	once.Do(func() {
		promptCacheInstance = &promptCache{
			cache:      make(map[string]cacheItem),
			expiryTime: 10 * time.Minute, // 缓存有效期10分钟
		}
	})
	return promptCacheInstance
}

// 获取缓存中的提示词
func (c *promptCache) get(promptKey string) (prompt.ChatTemplate, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.cache[promptKey]
	if !exists {
		return nil, false
	}

	// 检查缓存是否过期
	if time.Now().After(item.expiry) {
		return nil, false
	}

	return item.prompt, true
}

// 设置缓存中的提示词
func (c *promptCache) set(promptKey string, prompt prompt.ChatTemplate) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache[promptKey] = cacheItem{
		prompt: prompt,
		expiry: time.Now().Add(c.expiryTime),
	}
}

// GetPromptTemplateByKey 根据提示词键获取提示词模板
func GetPromptTemplateByKey(ctx context.Context, promptTemplateRepo *mongo.PromptTemplateRepo,
	promptKey string) prompt.ChatTemplate {

	// 先检查缓存
	cachKey := fmt.Sprintf("%s%s", consts.PromptTemplateCachePrefix, promptKey)
	if cachedPrompt, found := getPromptCache().get(cachKey); found {
		return cachedPrompt
	}

	defaultPrompt, err := consts.GetDefaultPromptTemplate(promptKey)
	if err != nil {
		logrus.Errorf("Failed to get default prompt: %v, using nil", err)
		return nil
	}

	if promptTemplateRepo == nil {
		logrus.Errorf("PromptTemplateRepo is nil, using default prompt")
		return defaultPrompt
	}

	promptTemplate, err := promptTemplateRepo.GetPublishedPromptTemplateByKey(ctx, promptKey)
	if err != nil {
		logrus.Errorf("Failed to get prompt from DB: %v, using default prompt", err)
		return nil
	}

	// 从数据库获取的提示词内容构建模板
	// 使用新添加的字段：SystemMessage、AssistantMessage 和 UserMessage
	logrus.Infof("Successfully loaded prompt from DB: %s, version: %d", promptKey, promptTemplate.Version)

	// 构建消息模板列表
	var messageTemplates []schema.MessagesTemplate

	// 添加系统消息
	if promptTemplate.SystemMessage != "" {
		messageTemplates = append(messageTemplates, schema.SystemMessage(promptTemplate.SystemMessage))
	}

	// 添加助手消息
	if promptTemplate.AssistantMessage != "" {
		messageTemplates = append(messageTemplates, schema.AssistantMessage(promptTemplate.AssistantMessage, nil))
	}

	// 添加用户消息
	if promptTemplate.UserMessage != "" {
		messageTemplates = append(messageTemplates, schema.UserMessage(promptTemplate.UserMessage))
	}

	// 如果没有设置消息，使用默认值
	if len(messageTemplates) == 0 {
		return defaultPrompt
	}

	// 构建提示词模板
	resultPrompt := prompt.FromMessages(schema.GoTemplate, messageTemplates...)

	// 将结果存入缓存
	getPromptCache().set(cachKey, resultPrompt)
	logrus.Infof("Prompt cached: %s", cachKey)

	return resultPrompt
}
