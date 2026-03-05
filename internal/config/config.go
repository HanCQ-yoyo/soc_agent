package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// Config 应用配置结构体
type Config struct {
	Server    ServerConfig    `mapstructure:"server"`
	Log       LogConfig       `mapstructure:"log"`
	Eino      EinoConfig      `mapstructure:"eino"`
	LLM       LLMProvide      `mapstructure:"llm"`
	Milvus    MilvusConfig    `mapstructure:"milvus"`
	MCP       MCPConfig       `mapstructure:"mcp"`
	Embedding EmbeddingConfig `mapstructure:"embedding"`
	MongoDB   MongoDBConfig   `mapstructure:"mongodb"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port         string `mapstructure:"port"`
	Host         string `mapstructure:"host"`
	ReadTimeout  string `mapstructure:"read_timeout"`
	WriteTimeout string `mapstructure:"write_timeout"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
	File   string `mapstructure:"file"`
}

// EinoConfig Eino框架配置
type EinoConfig struct {
	TraceEnabled        bool   `mapstructure:"trace_enabled"`
	CozeLoopAPIToken    string `mapstructure:"cozeloop_api_token"`
	CozeLoopWorkspaceID string `mapstructure:"cozeloop_workspace_id"`
}

type LLMProvide struct {
	VolcArk  LLMConfig `mapstructure:"volc_ark"`
	Deepseek LLMConfig `mapstructure:"deep_seek"`
	Qwen3    LLMConfig `mapstructure:"qwen3"`
}

// LLMConfig 大语言模型配置
type LLMConfig struct {
	ModelName   string  `mapstructure:"model_name"`
	APIKey      string  `mapstructure:"api_key"`
	BaseURL     string  `mapstructure:"base_url"`
	Temperature float64 `mapstructure:"temperature"`
	MaxTokens   int     `mapstructure:"max_tokens"`
	Timeout     int     `mapstructure:"timeout"`
	Provider    string  `mapstructure:"provider"`
}

// MilvusConfig Milvus向量数据库配置
type MilvusConfig struct {
	Addr           string  `mapstructure:"addr"`
	Collection     string  `mapstructure:"collection"`
	Username       string  `mapstructure:"username"`
	Password       string  `mapstructure:"password"`
	Database       string  `mapstructure:"database"`
	VectorField    string  `mapstructure:"vector_field"`
	MetricType     string  `mapstructure:"metric_type"`
	TopK           int     `mapstructure:"top_k"`
	ScoreThreshold float64 `mapstructure:"score_threshold"`
}

// MCPConfig MCP工具配置
type MCPConfig struct {
	Servers       map[string]MCPServerConfig `mapstructure:"mcp_servers"`
	DefaultServer string                     `mapstructure:"default_server"`
	Timeout       string                     `mapstructure:"timeout"`
}

// MCPServerConfig 单个MCP服务器配置
type MCPServerConfig struct {
	URL string `mapstructure:"url"`
}

// EmbeddingConfig 嵌入模型配置
type EmbeddingConfig struct {
	BaseURL string `mapstructure:"base_url"`
	Model   string `mapstructure:"model"`
	Timeout int    `mapstructure:"timeout"`
}

// MongoDBConfig MongoDB数据库配置
type MongoDBConfig struct {
	Host       string `mapstructure:"host"`
	Database   string `mapstructure:"database"`
	Username   string `mapstructure:"username"`
	Password   string `mapstructure:"password"`
	AuthSource string `mapstructure:"auth_source"`
}

var AppConfig *Config

// LoadConfig 加载配置文件
func LoadConfig(configPath string) (*Config, error) {
	if configPath == "" {
		// 如果没有指定配置文件路径，根据环境变量选择配置文件
		workDir, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("get work dir error: %v", err)
		}

		// 获取环境变量，默认为production
		env := os.Getenv("SOC_AGENT_ENV")
		if env == "" {
			env = "prod"
		}

		// 特殊处理production环境，使用config_prod.yaml
		configEnv := env

		// 构建配置文件路径
		configPath = filepath.Join(workDir, "configs", "config_"+configEnv+".yaml")

		// 检查配置文件是否存在，如果不存在则使用默认配置文件
		if _, err := os.Stat(configPath); os.IsNotExist(err) {
			logrus.Infof("Config file %s not found, using default config.yaml", configPath)
			configPath = filepath.Join(workDir, "configs", "config.yaml")
		}
	}
	fmt.Println("config file path :", configPath)

	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	// 读取环境变量
	viper.AutomaticEnv()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("read config file error: %v", err)
	}

	// 解析配置
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("unmarshal config error: %v", err)
	}

	AppConfig = &config
	return &config, nil
}

// GetConfig 获取配置
func GetConfig() *Config {
	if AppConfig == nil {
		// 如果配置未加载，使用默认配置
		defaultConfig, err := LoadConfig("")
		if err != nil {
			logrus.Warnf("load default config error: %v, using empty config", err)
			return &Config{}
		}
		return defaultConfig
	}
	return AppConfig
}
