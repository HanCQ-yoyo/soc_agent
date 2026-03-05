package milvus

import (
	"context"
	"errors"
	"log"
	"soc_agent/internal/config"
	"time"

	"github.com/cloudwego/eino-ext/components/embedding/ollama"
)

type Embed struct {
	embedder *ollama.Embedder
}

// GetEmbedder 获取嵌入模型
func GetEmbedder(cfg config.EmbeddingConfig) (*ollama.Embedder, error) {
	// 检查配置是否完整
	if cfg.BaseURL == "" || cfg.Model == "" {
		log.Printf("Embedding configuration not complete, skipping embedder initialization")
		return nil, errors.New("embeding config is empty.")
	}

	embedder, err := ollama.NewEmbedder(context.Background(),
		&ollama.EmbeddingConfig{
			Timeout: time.Duration(cfg.Timeout) * time.Second,
			BaseURL: cfg.BaseURL,
			Model:   cfg.Model,
		})
	if err != nil {
		log.Printf("NewEmbedder of ollama error: %v", err)
		return nil, err
	}
	return embedder, nil
}

// Embedding 生成文本的向量表示
func (e *Embed) Embedding(ctx context.Context, text string) ([][]float32, error) {
	vectors, err := e.embedder.EmbedStrings(ctx, []string{text})
	if err != nil {
		log.Printf("EmbedStrings of Ollama failed, err=%v", err)
	}
	// 转换为float32，解决Milvus不支持float64的问题
	v32 := make([][]float32, len(vectors))
	for i, v := range vectors {
		v32[i] = make([]float32, len(v))
		for j, v := range v {
			v32[i][j] = float32(v)
		}
	}
	return v32, nil
}
