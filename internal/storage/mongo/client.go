package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"soc_agent/internal/config"
)

// Client MongoDB客户端

type Client struct {
	client   *mongo.Client
	database string
}

// 全局客户端实例
var globalClient *Client

// NewClient 创建一个新的MongoDB客户端实例
func NewClient(uri, database string) (*Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// 测试连接
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	return &Client{
		client:   client,
		database: database,
	}, nil
}

// NewClientFromConfig 从配置创建一个新的MongoDB客户端实例
func NewClientFromConfig(cfg *config.Config) (*Client, error) {
	// 构建MongoDB连接URI
	mongoConfig := cfg.MongoDB
	uri := fmt.Sprintf("mongodb://%s:%s@%s/%s?authSource=%s",
		mongoConfig.Username,
		mongoConfig.Password,
		mongoConfig.Host,
		mongoConfig.Database,
		mongoConfig.AuthSource,
	)

	client, err := NewClient(uri, mongoConfig.Database)
	if err != nil {
		return nil, err
	}

	// 存储到全局变量
	globalClient = client
	return client, nil
}

// GetClient 获取全局MongoDB客户端实例
func GetClient() *Client {
	return globalClient
}

// Close 关闭MongoDB连接
func (c *Client) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return c.client.Disconnect(ctx)
}

// GetCollection 获取指定的集合
func (c *Client) GetCollection(collection string) *mongo.Collection {
	return c.client.Database(c.database).Collection(collection)
}
