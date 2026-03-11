package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"soc_agent/internal/agent"
	"soc_agent/internal/config"
	"soc_agent/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)


func main() {
	// 加载配置
	cfg, err := config.LoadConfig("")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化日志
	initLogger(cfg)

	logrus.Info("Starting SOC Agent MVP server...")

	// 初始化Eino智能体
	agt, err := agent.NewSOCAgent(context.Background())
	if err != nil {
		logrus.Fatalf("Failed to initialize agent: %v", err)
	}
	defer agt.Close()

	// 设置Gin模式
	if cfg.Log.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	router := handlers.SetupRouter(agt)

	// 启动服务器
	serverAddr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: router,
	}

	// 在goroutine中启动服务器
	go func() {
		logrus.Infof("Server is running on %s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 打印服务器启动成功信息
	logrus.Infof("Server started successfully on %s", serverAddr)

	// 等待中断信号优雅关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down server...")

	// 创建上下文用于通知服务器它有5秒的时间来完成当前正在处理的请求
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.Fatalf("Server forced to shutdown: %v", err)
	}

	logrus.Info("Server exiting")
}

// initLogger 初始化日志
func initLogger(cfg *config.Config) {
	// 设置日志级别
	level, err := logrus.ParseLevel(cfg.Log.Level)
	if err != nil {
		logrus.SetLevel(logrus.InfoLevel)
		logrus.Warnf("Invalid log level %s, using info level", cfg.Log.Level)
	} else {
		logrus.SetLevel(level)
	}

	// 设置日志格式
	if cfg.Log.Format == "json" {
		logrus.SetFormatter(&logrus.JSONFormatter{})
	} else {
		logrus.SetFormatter(&logrus.TextFormatter{})
	}

	// 设置日志文件
	if cfg.Log.File != "" {
		// 创建日志目录
		logDir := filepath.Dir(cfg.Log.File)
		if _, err := os.Stat(logDir); os.IsNotExist(err) {
			if err := os.MkdirAll(logDir, 0755); err != nil {
				logrus.Warnf("Failed to create log directory: %v", err)
				return
			}
		}

		// 打开日志文件
		logFile, err := os.OpenFile(cfg.Log.File, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			logrus.Warnf("Failed to open log file: %v", err)
			return
		}

		// 设置输出到文件
		logrus.SetOutput(logFile)
	}
}


