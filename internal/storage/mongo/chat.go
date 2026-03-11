package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"soc_agent/internal/consts"
	"soc_agent/internal/models"
)

const (
	CollectionChatSession = "chat_sessions"
	CollectionChatMessage = "chat_messages"
)

type ChatRepo struct {
	client *Client
}

func NewChatRepo(client *Client) *ChatRepo {
	return &ChatRepo{
		client: client,
	}
}

func (r *ChatRepo) CreateSession(ctx context.Context, session *models.ChatSession) error {
	if session == nil {
		return fmt.Errorf("session is nil")
	}

	now := time.Now()
	session.CreateTimestamp = now.UnixMilli()
	session.UpdateTimestamp = now.UnixMilli()

	session.ID = primitive.NewObjectID().Hex()
	if session.SessionUID == "" {
		session.SessionUID = GetFieldUID(consts.ChatSessionFieldUIDPrefix)
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionChatSession)
	_, err := col.InsertOne(ctx, session)
	if err != nil {
		return fmt.Errorf("failed to create session: %v", err)
	}

	return nil
}

func (r *ChatRepo) GetSessionByID(ctx context.Context, sessionID string) (*models.ChatSession, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	var session models.ChatSession
	filter := bson.M{"session_uid": sessionID}
	col := r.client.GetCollection(CollectionChatSession)
	err := col.FindOne(ctx, filter).Decode(&session)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get session: %v", err)
	}

	return &session, nil
}

func (r *ChatRepo) ListSessions(ctx context.Context, page, pageSize int) ([]models.ChatSession, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	count, err := r.client.GetCollection(CollectionChatSession).CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count sessions: %v", err)
	}

	findOptions := options.Find().
		SetSkip(int64(offset)).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "create_timestamp", Value: -1}})

	col := r.client.GetCollection(CollectionChatSession)
	cursor, err := col.Find(ctx, bson.M{}, findOptions)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list sessions: %v", err)
	}
	defer cursor.Close(ctx)

	var sessions []models.ChatSession
	if err := cursor.All(ctx, &sessions); err != nil {
		return nil, 0, fmt.Errorf("failed to decode sessions: %v", err)
	}

	return sessions, count, nil
}

func (r *ChatRepo) UpdateSession(ctx context.Context, session *models.ChatSession) error {
	if session == nil {
		return fmt.Errorf("session is nil")
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	session.UpdateTimestamp = time.Now().UnixMilli()

	filter := bson.M{"session_uid": session.ID}
	update := bson.M{"$set": session}

	col := r.client.GetCollection(CollectionChatSession)
	_, err := col.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update session: %v", err)
	}

	return nil
}

func (r *ChatRepo) DeleteSession(ctx context.Context, sessionID string) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	col := r.client.GetCollection(CollectionChatSession)
	_, err := col.DeleteOne(ctx, bson.M{"session_uid": sessionID})
	if err != nil {
		return fmt.Errorf("failed to delete session: %v", err)
	}

	_, err = r.client.GetCollection(CollectionChatMessage).DeleteMany(ctx, bson.M{"session_uid": sessionID})
	if err != nil {
		return fmt.Errorf("failed to delete session messages: %v", err)
	}

	return nil
}

func (r *ChatRepo) AddMessage(ctx context.Context, message *models.ChatMessage) error {
	if message == nil {
		return fmt.Errorf("message is nil")
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if message.MessageUID == "" {
		message.ID = primitive.NewObjectID().Hex()
		message.MessageUID = GetFieldUID(consts.ChatMessageFieldUIDPrefix)
	}

	col := r.client.GetCollection(CollectionChatMessage)
	_, err := col.InsertOne(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to add message: %v", err)
	}

	return nil
}

func (r *ChatRepo) GetSessionMessages(ctx context.Context, sessionID string) ([]models.ChatMessage, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	findOptions := options.Find().SetSort(bson.D{{Key: "submit_timestamp", Value: 1}})
	col := r.client.GetCollection(CollectionChatMessage)
	cursor, err := col.Find(ctx, bson.M{"session_uid": sessionID}, findOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get session messages: %v", err)
	}
	defer cursor.Close(ctx)

	var messages []models.ChatMessage
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, fmt.Errorf("failed to decode messages: %v", err)
	}

	return messages, nil
}
