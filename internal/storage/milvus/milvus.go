package milvus

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"soc_agent/internal/config"
	"soc_agent/internal/models"
	"time"

	"github.com/cloudwego/eino-ext/components/embedding/ollama"
	milvusindexer "github.com/cloudwego/eino-ext/components/indexer/milvus"
	milvusretriever "github.com/cloudwego/eino-ext/components/retriever/milvus"
	"github.com/cloudwego/eino/callbacks"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
	"github.com/milvus-io/milvus-sdk-go/v2/client"
	"github.com/milvus-io/milvus-sdk-go/v2/entity"
	"github.com/sirupsen/logrus"
)

type MilvusClient struct {
	cfg *config.Config

	client   client.Client
	embedder *ollama.Embedder
}

func NewClient(cfg *config.Config) (*MilvusClient, error) {
	if cfg == nil {
		return nil, errors.New("config is empty. ")
	}
	// 创建一个带有超时的上下文
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cli, err := client.NewClient(ctx, client.Config{
		Address:  cfg.Milvus.Addr,
		Username: cfg.Milvus.Username,
		Password: cfg.Milvus.Password,
	})
	if err != nil {
		return nil, err
	}
	embedder, err := GetEmbedder(cfg.Embedding)
	if err != nil {
		log.Printf("Failed to getEmbedder of ollama error: %v", err)
		return nil, err
	}
	return &MilvusClient{
		cfg: cfg,

		client:   cli,
		embedder: embedder,
	}, nil
}

func (m *MilvusClient) GetClient() client.Client {
	return m.client
}

// MilvusClient：创建数据库
// 1. 定义数据库配置
func (m *MilvusClient) CreateMilvusDb() {
	var err error
	schema := &entity.Schema{
		CollectionName: m.cfg.Milvus.Collection,
		Description:    "Test book search",
		Fields: []*entity.Field{
			{
				Name:        "id",
				Description: "主键ID",
				DataType:    entity.FieldTypeVarChar,
				TypeParams:  map[string]string{"max_length": "256"},
				PrimaryKey:  true,
			},
			{
				Name:        "analysis_id",
				Description: "分析ID",
				DataType:    entity.FieldTypeVarChar,
				TypeParams:  map[string]string{"max_length": "256"},
			},
			{
				Name:        "milvus_vector_id",
				Description: "Milvus向量ID",
				DataType:    entity.FieldTypeVarChar,
				TypeParams:  map[string]string{"max_length": "256"},
			},
			{
				Name:        "vector",
				Description: "特征向量",
				DataType:    entity.FieldTypeFloatVector,
				TypeParams:  map[string]string{"dim": "1024"},
				IndexParams: map[string]string{
					"index_type":  string(entity.HNSW),
					"metric_type": string(entity.COSINE),
				},
			},
			{
				Name:        "content",
				Description: "文本内容",
				DataType:    entity.FieldTypeVarChar,
				TypeParams:  map[string]string{"max_length": "10000"},
			},
			{
				Name:        "metadata",
				Description: "元数据",
				DataType:    entity.FieldTypeJSON,
				IsDynamic:   false,
			},
			{
				Name:        "create_timestamp",
				Description: "创建时间戳",
				DataType:    entity.FieldTypeInt64,
			},
		},
	}

	err = m.client.CreateCollection(
		context.Background(), // ctx
		schema,
		2, // shardNum
	)
	if err != nil {
		fmt.Println("创建数据库失败:", err)
		return
	}

	// defer m.client.Close()
}

// MilvusClient：创建索引
// 1. 定义索引配置
func (m *MilvusClient) CreateIndex() {
	// 创建 IndexIvfFlat 索引对象
	idx, err := entity.NewIndexIvfFlat(
		entity.COSINE,
		1024,
	)
	if err != nil {
		logrus.Errorf("fail to create ivf flat index parameter: %v", err)
	}
	// 在 Milvus 中创建索引
	err = m.client.CreateIndex(
		context.Background(),
		m.cfg.Milvus.Collection,
		m.cfg.Milvus.VectorField,
		idx,
		false,
	)
	if err != nil {
		logrus.Errorf("fail to create index: %v", err)
	}
}

// MilvusClient：插入数据
func (m *MilvusClient) InsertData(docs []*schema.Document) error {
	ctx, cancel := context.WithTimeout(context.Background(), 600*time.Second)
	defer cancel()

	collName := m.cfg.Milvus.Collection
	if collName == "" {
		return errors.New("collection name is empty.")
	}
	has, err := m.client.HasCollection(ctx, collName)
	if err != nil {
		return err
	}
	if !has {
		m.CreateMilvusDb()
		m.CreateIndex()
	}

	for _, doc := range docs {
		embed := &Embed{embedder: m.embedder}
		vector, err := embed.Embedding(ctx, doc.Content)
		if err != nil {
			break
		}
		metaJson, _ := json.Marshal(doc.MetaData)
		idColumn := entity.NewColumnVarChar("id", []string{doc.ID})
		analysisIDColumn := entity.NewColumnVarChar("analysis_id", []string{doc.MetaData["analysis_id"].(string)})
		milvusVectorIDColumn := entity.NewColumnVarChar("milvus_vector_id", []string{doc.MetaData["milvus_vector_id"].(string)})
		vectorColumn := entity.NewColumnFloatVector("vector", 1024, vector)
		contentColumn := entity.NewColumnVarChar("content", []string{doc.Content})
		metaDataColumn := entity.NewColumnJSONBytes("metadata", [][]byte{metaJson})
		createTimestamp := entity.NewColumnInt64("create_timestamp", []int64{doc.MetaData["timestamp"].(int64)})

		_, err = m.client.Insert(ctx, collName, "", idColumn, analysisIDColumn, milvusVectorIDColumn, vectorColumn, contentColumn, metaDataColumn, createTimestamp)
		if err != nil {
			fmt.Println("failed to insert data:", err.Error())
			break
		}
	}
	return nil
}

func (m *MilvusClient) QueryDataForPlatform(expr string, page, pageSize int64,
	query string, topK int, score float64, metricType entity.MetricType) ([]models.MilvusData, error) {
	// 计算偏移量
	offset := (page - 1) * pageSize
	data, err := m.SearchData(expr, pageSize, offset, query, topK, score, metricType)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// getTotalCount 获取总数据量
func (m *MilvusClient) GetTotalCount(expr string,
	query string, topK int, score float64, metricType entity.MetricType) (count int64, err error) {
	// 计算偏移量
	data, err := m.SearchData(expr, 1000, 0, query, topK, score, metricType)
	if err != nil {
		return 0, err
	}
	return int64(len(data)), nil
}

// MilvusClient：搜索数据
func (m *MilvusClient) SearchDataForWorkflow(query string, topK int, score float64) ([]models.MilvusData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	ctx = callbacks.OnStart(ctx, &retriever.CallbackInput{
		Query: query,
		Extra: map[string]any{
			"metric_type": entity.COSINE,
		},
	})
	data, err := m.SearchData("", 10, 0, query, topK, score, entity.COSINE)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			callbacks.OnError(ctx, err)
		}
	}()
	callbacks.OnEnd(ctx, data)
	return data, nil
}

func (m *MilvusClient) SearchData(expr string, limit, offset int64,
	query string, topK int, score float64, metricType entity.MetricType) ([]models.MilvusData, error) {
	sp, _ := entity.NewIndexIvfFlatSearchParam( // NewIndex*SearchParam func
		2, // searchParam
	)
	sp.AddRadius(score)

	var queryVectors []entity.Vector
	if query != "" {
		embed := &Embed{embedder: m.embedder}
		vectors, err := embed.Embedding(context.Background(), query)
		if err != nil {
			return nil, err
		}
		if len(vectors) > 0 {
			queryVectors = []entity.Vector{entity.FloatVector(vectors[0])}
		}
	}

	var documents []models.MilvusData
	if len(queryVectors) > 0 {
		// 使用 Search 方法进行向量相似度搜索
		searchResult, err := m.client.Search(
			context.Background(),    // ctx
			m.cfg.Milvus.Collection, // CollectionName
			nil,
			expr,
			[]string{"id", "milvus_vector_id", "analysis_id", "metadata", "content", "create_timestamp"},
			queryVectors,
			m.cfg.Milvus.VectorField,
			metricType,
			topK,
			sp,
			client.WithLimit(limit),
			client.WithOffset(offset),
		)
		if err != nil {
			fmt.Println("failed search data:", err.Error())
			return nil, err
		}

		documents = make([]models.MilvusData, 0, len(searchResult))
		for _, sr := range searchResult {
			for i := 0; i < sr.ResultCount; i++ {
				var m models.MilvusData
				m.Score = sr.Scores[i]
				for _, field := range sr.Fields {
					if field.Name() == "id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
						m.ID = field.FieldData().GetScalars().GetStringData().GetData()[i]
					}
					if field.Name() == "milvus_vector_id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
						m.MilvusVectorID = field.FieldData().GetScalars().GetStringData().GetData()[i]
					}
					if field.Name() == "analysis_id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
						m.AnalysisID = field.FieldData().GetScalars().GetStringData().GetData()[i]
					}
					if field.Name() == "content" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
						m.Content = field.FieldData().GetScalars().GetStringData().GetData()[i]
					}
					if field.Name() == "metadata" {
						metadataRaw := field.FieldData().GetScalars().GetJsonData().GetData()
						var metadata map[string]interface{}
						if len(metadataRaw) > i {
							if err := json.Unmarshal(metadataRaw[i], &metadata); err != nil {
								fmt.Println("failed to unmarshal metadata:", err.Error())
								continue
							}
							m.Metadata = metadata
						}
					}
					if field.Name() == "create_timestamp" && len(field.FieldData().GetScalars().GetIntData().GetData()) > i {
						fmt.Println("field.FieldData().GetScalars().GetIntData().GetData()[i]::", field.FieldData().GetScalars().GetIntData().GetData()[i])
						m.CreateTimestamp = int64(field.FieldData().GetScalars().GetIntData().GetData()[i])
					}
				}
				documents = append(documents, m)
			}
		}
	} else {
		// 使用 Query 方法进行纯标量查询
		resultSet, err := m.client.Query(
			context.Background(),
			m.cfg.Milvus.Collection,
			nil,
			expr,
			[]string{"id", "milvus_vector_id", "analysis_id", "metadata", "content", "create_timestamp"},
			client.WithLimit(limit),
			client.WithOffset(offset),
		)
		if err != nil {
			fmt.Println("failed query data:", err.Error())
			return nil, err
		}

		documents = make([]models.MilvusData, 0, resultSet.Len())
		for i := 0; i < resultSet.Len(); i++ {
			var m models.MilvusData
			for _, field := range resultSet {
				if field.Name() == "id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
					m.ID = field.FieldData().GetScalars().GetStringData().GetData()[i]
				}
				if field.Name() == "milvus_vector_id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
					m.MilvusVectorID = field.FieldData().GetScalars().GetStringData().GetData()[i]
				}
				if field.Name() == "analysis_id" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
					m.AnalysisID = field.FieldData().GetScalars().GetStringData().GetData()[i]
				}
				if field.Name() == "content" && len(field.FieldData().GetScalars().GetStringData().GetData()) > i {
					m.Content = field.FieldData().GetScalars().GetStringData().GetData()[i]
				}
				if field.Name() == "metadata" {
					metadataRaw := field.FieldData().GetScalars().GetJsonData().GetData()
					var metadata map[string]interface{}
					if len(metadataRaw) > i {
						if err := json.Unmarshal(metadataRaw[i], &metadata); err != nil {
							fmt.Println("failed to unmarshal metadata:", err.Error())
							continue
						}
						m.Metadata = metadata
					}
				}

				if field.Name() == "create_timestamp" && len(field.FieldData().GetScalars().GetLongData().GetData()) > i {
					m.CreateTimestamp = int64(field.FieldData().GetScalars().GetLongData().GetData()[i])
				}
			}
			documents = append(documents, m)
		}
	}

	return documents, nil
}

// MilvusClient：释放集合数据
// func (m *MilvusClient) ReleaseCollectionData() {
// 	err := m.client.ReleaseCollection(
// 		context.Background(),
// 		m.cfg.Milvus.Collection,
// 	)
// 	if err != nil {
// 		fmt.Println("failed to release collection:", err.Error())
// 	}
// }

// // MilvusClient：集合加载到内存中
// func (m *MilvusClient) LoadCollectionData() {
// 	err := m.client.LoadCollection(
// 		context.Background(),
// 		m.cfg.Milvus.Collection,
// 		false,
// 	)
// 	if err != nil {
// 		fmt.Println("failed to load collection:", err.Error())
// 	}
// 	fmt.Println("loading ok")
// }

// Eino扩展：索引文档
// 1. 定义字段配置，严格匹配Milvus Collection的Schema
func (m *MilvusClient) Indexer(docs []*schema.Document) error {

	// 1. 定义字段配置，严格匹配Milvus Collection的Schema
	fieldConfigs := []*entity.Field{
		{
			Name:        "id",
			Description: "主键ID",
			DataType:    entity.FieldTypeVarChar,
			TypeParams:  map[string]string{"max_length": "256"},
			PrimaryKey:  true,
		},
		{
			Name:        "vector",
			Description: "特征向量",
			DataType:    entity.FieldTypeFloatVector,
			TypeParams:  map[string]string{"dim": "1024"},
			IndexParams: map[string]string{
				"index_type":  string(entity.HNSW),
				"metric_type": string(entity.COSINE),
			},
		},
		{
			Name:        "content",
			Description: "文本内容",
			DataType:    entity.FieldTypeVarChar,
			TypeParams:  map[string]string{"max_length": "50000"},
		},
		{
			Name:        "metadata",
			Description: "元数据",
			DataType:    entity.FieldTypeJSON,
			IsDynamic:   false,
		},
	}

	indexer, err := milvusindexer.NewIndexer(
		context.Background(),
		&milvusindexer.IndexerConfig{
			Client:    m.client,
			Embedding: m.embedder,
			Fields:    fieldConfigs,
			// Collection: m.cfg.Milvus.Collection,
		})
	if err != nil {
		log.Printf("Failed to create indexer: %v", err)
		return err
	}
	log.Printf("Indexer created success")

	errCh := make(chan error, 1)
	go func() {
		defer close(errCh)
		ctx, cancel := context.WithTimeout(context.Background(), 600*time.Second)
		defer cancel()
		ids, err := indexer.Store(ctx, docs)
		if err != nil {
			errCh <- fmt.Errorf("store docs failed: %w", err)
		}
		log.Printf("Store success, ids: %v", ids)
		errCh <- nil
	}()

	return nil
}

// Eino扩展：获取检索器
func (m *MilvusClient) GetRetriever() (*milvusretriever.Retriever, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 600*time.Second)
	defer cancel()
	collName := m.cfg.Milvus.Collection
	if collName == "" {
		return nil, errors.New("collection name is empty.")
	}
	has, err := m.client.HasCollection(ctx, collName)
	if err != nil {
		return nil, err
	}
	if !has {
		m.CreateMilvusDb()
		m.CreateIndex()
	}

	// 转换MetricType字符串为entity.MetricType
	getMetricTypeFromString := func(metricType string) entity.MetricType {
		switch metricType {
		case "IP":
			return entity.IP
		case "L2":
			return entity.L2
		case "COSINE":
			return entity.COSINE
		default:
			return entity.IP // 默认使用IP
		}
	}
	// Create a retriever
	retriever, err := milvusretriever.NewRetriever(context.Background(), &milvusretriever.RetrieverConfig{
		Client:      m.client,
		Collection:  m.cfg.Milvus.Collection,
		Partition:   nil,
		VectorField: m.cfg.Milvus.VectorField,
		OutputFields: []string{
			"id",
			"content",
			"metadata",
		},
		DocumentConverter: nil,
		MetricType:        getMetricTypeFromString(m.cfg.Milvus.MetricType),
		TopK:              m.cfg.Milvus.TopK,
		ScoreThreshold:    m.cfg.Milvus.ScoreThreshold,
		Sp:                nil,
		Embedding:         m.embedder,
	})
	if err != nil {
		log.Printf("Failed to create retriever: %v", err)
		return nil, err
	}
	return retriever, nil

	// // Retrieve documents
	// documents, err := retriever.Retrieve(ctx, query)
	// if err != nil {
	// 	log.Printf("Failed to retrieve: %v", err)
	// 	return nil, err
	// }

	// return documents, nil
}
