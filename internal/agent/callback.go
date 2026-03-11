package agent

import (
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/callbacks"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"

	"soc_agent/internal/storage/mongo"
)

type loggerCallbacks struct {
	analysisID        string
	mongoClient       *mongo.Client
	alertAnalysisRepo *mongo.AlertAnalysisRepo
}

func (l *loggerCallbacks) OnStart(ctx context.Context, info *callbacks.RunInfo, input callbacks.CallbackInput) context.Context {
	// fmt.Printf("name: %v, type: %v, component: %v, input: %v", info.Name, info.Type, info.Component, input)
	inputStr, err := sonic.MarshalString(input)
	if err != nil {
		return ctx
	}

	// 使用alertAnalysisRepo
	if l.alertAnalysisRepo != nil {
		err = l.alertAnalysisRepo.RecordWorkflowLog(l.analysisID, info.Name,
			info.Type, string(info.Component), inputStr, "", "")
	}

	if err != nil {
		return ctx
	}

	return ctx
}

func (l *loggerCallbacks) OnEnd(ctx context.Context, info *callbacks.RunInfo, output callbacks.CallbackOutput) context.Context {
	go func() {
		// fmt.Printf("name: %v, type: %v, component: %v, output: %v", info.Name, info.Type, info.Component, output)
		outputStr, err := sonic.MarshalString(output)
		if err != nil {
			logrus.Errorf("Failed to marshal output: %v", err)
			return
		}

		// 使用alertAnalysisRepo
		if l.alertAnalysisRepo != nil {
			err = l.alertAnalysisRepo.RecordWorkflowLog(l.analysisID, info.Name,
				info.Type, string(info.Component), "", outputStr, "")
		}

		if err != nil {
			logrus.Errorf("Failed to record workflow log: %v", err)
			return
		}
	}()
	return ctx
}

func (l *loggerCallbacks) OnError(ctx context.Context, info *callbacks.RunInfo, err error) context.Context {
	// fmt.Printf("name: %v, type: %v, component: %v, error: %v", info.Name, info.Type, info.Component, err)
	errMsg := fmt.Sprintf("error: %v", err)

	// 使用alertAnalysisRepo记录工作流日志
	if l.alertAnalysisRepo != nil {
		err = l.alertAnalysisRepo.RecordWorkflowLog(l.analysisID, info.Name, info.Type, string(info.Component), "", "", errMsg)
	}

	if err != nil {
		return ctx
	}
	return ctx
}

func (l *loggerCallbacks) OnStartWithStreamInput(ctx context.Context, info *callbacks.RunInfo, input *schema.StreamReader[callbacks.CallbackInput]) context.Context {
	return ctx
}

func (l *loggerCallbacks) OnEndWithStreamOutput(ctx context.Context, info *callbacks.RunInfo, output *schema.StreamReader[callbacks.CallbackOutput]) context.Context {
	return ctx
}
