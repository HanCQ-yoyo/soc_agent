package consts

type DisposalStatusType string

const (
	DisposalStatusPending DisposalStatusType = "pending"
	DisposalStatusRunning DisposalStatusType = "running"
	DisposalStatusSuccess DisposalStatusType = "success"
	DisposalStatusFailed  DisposalStatusType = "failed"
)

// 反馈类型:
// ①研判正确
// ②误判（研判结果错误，如真告警标误报 / 误告警标真报）
// ③漏判（未研判出攻击）
// ④研判不精准（结论模糊 / 置信度错误）
type FeedbackType string

const (
	FeedbackAccurate    FeedbackType = "accurate"
	FeedbackMisjudgment FeedbackType = "misjudgment"
	FeedbackOmission    FeedbackType = "omission"
	FeedbackImprecision FeedbackType = "imprecision"
)

// 修正后研判结果:若反馈为「误判 / 漏判 / 不精准」，需选择修正结果：如「真实攻击」「误报」「可疑需人工复核」
type CorrectResultType string

const (
	CorrectResultTruePositive  CorrectResultType = "true_positive"  // 真实攻击：告警规则正确判断为攻击
	CorrectResultFalsePositive CorrectResultType = "false_positive" // 误报：告警规则误判
	CorrectResultInvalid       CorrectResultType = "invalid"        // 无效告警: 告警内容异常或缺失必须的特征
	CorrectResultSuspicious    CorrectResultType = "suspicious"     // 可疑需人工复核：告警规则判断为攻击，但需人工确认
)

// 提示词模板发布状态
type PromptPublishStatusType string

const (
	PromptPublishStatusDraft  PromptPublishStatusType = "draft"  // 草稿状态：未发布
	PromptPublishStatusActive PromptPublishStatusType = "active" // 已发布状态：已生效
)

// 提示词模板生效状态
type PromptEnableStatusType bool

const (
	PromptEnableStatusDraft  PromptEnableStatusType = false // 已禁用
	PromptEnableStatusActive PromptEnableStatusType = true  // 已启用
)
