package utils

import (
	"crypto/md5"
	"fmt"
	"soc_agent/internal/models"
	"strings"
)

// 安全地获取字符串字段
func GetStrField(field interface{}) string {
	if str, ok := field.(string); ok {
		return str
	}
	if field != nil {
		return fmt.Sprintf("%v", field)
	}
	return ""
}

// GetCoreFeatureMd5 生成特征集合md5值
func GetCoreFeatureMd5(features []models.StructFeature) (string, error) {
	// 对特征进行排序，确保一致的md5值

	featureStrs := []string{}
	for _, i := range features {
		featureStrs = append(featureStrs, fmt.Sprintf("%s:%v", i.Key, i.Value))
	}
	return fmt.Sprintf("%x", md5.Sum([]byte(strings.Join(featureStrs, "\n")))), nil
}

func GenMilvusContent(features []models.StructFeature) string {
	content := ""
	for _, i := range features {
		content += fmt.Sprintf("%s: %s\n", i.Key, i.Value)
	}
	return content
}
