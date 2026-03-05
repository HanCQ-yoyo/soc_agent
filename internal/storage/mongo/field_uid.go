package mongo

import (
	"fmt"
	"strings"

	"github.com/google/uuid"

	"soc_agent/internal/consts"
)

func GetFieldUID(prefix consts.FieldUIDPrefix) string {
	uuid := strings.ReplaceAll(uuid.New().String(), "-", "")
	return fmt.Sprintf("%s%s", prefix, uuid)
}
