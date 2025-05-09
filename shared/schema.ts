import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// News article schema
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  category: text("category"),
  source: text("source"),
  url: text("url"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
});

export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;

// Chat session schema
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Chat message schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  sources: text("sources"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Vector store schema
export const vectorEmbeddings = pgTable("vector_embeddings", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: text("embedding").notNull(),
});

export const insertVectorEmbeddingSchema = createInsertSchema(vectorEmbeddings).omit({
  id: true,
});

export type InsertVectorEmbedding = z.infer<typeof insertVectorEmbeddingSchema>;
export type VectorEmbedding = typeof vectorEmbeddings.$inferSelect;

// API Types
export type ChatCompletionRequest = {
  sessionId: string;
  message: string;
};

export type ChatCompletionResponse = {
  sessionId: string;
  message: string;
  sources?: string[];
};

export type ChatHistoryResponse = {
  sessionId: string;
  messages: ChatMessage[];
};

export type ClearChatResponse = {
  sessionId: string;
  success: boolean;
};
