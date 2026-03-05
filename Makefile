# SOC Agent Makefile

# 默认目标
.DEFAULT_GOAL := build

# 项目名称
APP_NAME := soc_agent

# 主入口文件
MAIN_FILE := cmd/server/main.go

# 测试文件
TEST_FILE := test_workflow.go

# 编译输出目录
OUTPUT_DIR := ./bin

# 编译命令
BUILD_CMD := go build -o $(OUTPUT_DIR)/$(APP_NAME) $(MAIN_FILE)

# 运行命令
RUN_CMD := go run $(MAIN_FILE)

# 测试命令
TEST_CMD := go run $(TEST_FILE)

# 清理命令
CLEAN_CMD := rm -rf $(OUTPUT_DIR)

# 依赖更新命令
DEPS_CMD := go mod tidy

# 编译目标
build:
	@echo "Building $(APP_NAME)..."
	@mkdir -p $(OUTPUT_DIR)
	@$(BUILD_CMD)
	@echo "Build completed: $(OUTPUT_DIR)/$(APP_NAME)"

# 运行目标
run: build
	@echo "Running $(APP_NAME) with default configuration..."
	@$(RUN_CMD)

# 运行目标（开发环境）
run-dev:
	@echo "Running $(APP_NAME) with development configuration..."
	@SOC_AGENT_ENV=dev go run $(MAIN_FILE)

# 运行目标（测试环境）
run-test:
	@echo "Running $(APP_NAME) with test configuration..."
	@SOC_AGENT_ENV=test go run $(MAIN_FILE)

# 运行目标（生产环境）
run-prod:
	@echo "Running $(APP_NAME) with production configuration..."
	@SOC_AGENT_ENV=prod go run $(MAIN_FILE)

# 测试目标
test:
	@echo "Testing $(APP_NAME)..."
	@$(TEST_CMD)



# 清理目标
clean:
	@echo "Cleaning up..."
	@$(CLEAN_CMD)
	@echo "Clean completed"

# 更新依赖
deps:
	@echo "Updating dependencies..."
	@$(DEPS_CMD)
	@echo "Dependencies updated"

# 帮助目标
help:
	@echo "Available targets:"
	@echo "  build        - Build the application"
	@echo "  run          - Run the application with default configuration"
	@echo "  run-dev      - Run the application with development configuration"
	@echo "  run-test     - Run the application with test configuration"
	@echo "  run-prod     - Run the application with production configuration"
	@echo "  test         - Run the test script"
	@echo "  clean        - Clean up build artifacts"
	@echo "  deps         - Update dependencies"
	@echo "  help         - Show this help message"
