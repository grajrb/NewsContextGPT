import { 
  users, type User, type InsertUser, 
  newsArticles, type NewsArticle, type InsertNewsArticle,
  chatSessions, type ChatSession, type InsertChatSession,
  chatMessages, type ChatMessage, type InsertChatMessage,
  vectorEmbeddings, type VectorEmbedding, type InsertVectorEmbedding
} from "@shared/schema";
import { setSessionMessages } from "./redis";
import { nanoid } from "nanoid";

// Storage interface for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // News article methods
  getNewsArticles(): Promise<NewsArticle[]>;
  getFeaturedNewsArticles(): Promise<NewsArticle[]>;
  getNewsByCategory(category: string): Promise<NewsArticle[]>;
  getNewsArticleById(id: number): Promise<NewsArticle | undefined>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: number, article: Partial<NewsArticle>): Promise<NewsArticle | undefined>;
  deleteNewsArticle(id: number): Promise<boolean>;

  // Chat session methods
  getChatSessions(): Promise<ChatSession[]>;
  getChatSessionBySessionId(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  deleteChatSession(id: number): Promise<boolean>;

  // Chat message methods
  getChatMessages(): Promise<ChatMessage[]>;
  getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessagesBySessionId(sessionId: string): Promise<boolean>;

  // Vector embedding methods
  getVectorEmbeddings(): Promise<VectorEmbedding[]>;
  getVectorEmbeddingsByArticleId(articleId: number): Promise<VectorEmbedding[]>;
  createVectorEmbedding(embedding: InsertVectorEmbedding): Promise<VectorEmbedding>;
  deleteVectorEmbeddingsByArticleId(articleId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private newsArticles: Map<number, NewsArticle>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  private vectorEmbeddings: Map<number, VectorEmbedding>;
  
  private userId: number;
  private newsArticleId: number;
  private chatSessionId: number;
  private chatMessageId: number;
  private vectorEmbeddingId: number;

  constructor() {
    this.users = new Map();
    this.newsArticles = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.vectorEmbeddings = new Map();
    
    this.userId = 1;
    this.newsArticleId = 1;
    this.chatSessionId = 1;
    this.chatMessageId = 1;
    this.vectorEmbeddingId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // News article methods
  async getNewsArticles(): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values());
  }

  async getFeaturedNewsArticles(): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 3);
  }

  async getNewsByCategory(category: string): Promise<NewsArticle[]> {
    return Array.from(this.newsArticles.values())
      .filter((article) => article.category === category);
  }

  async getNewsArticleById(id: number): Promise<NewsArticle | undefined> {
    return this.newsArticles.get(id);
  }

  async createNewsArticle(insertArticle: InsertNewsArticle): Promise<NewsArticle> {
    const id = this.newsArticleId++;
    const article: NewsArticle = { 
      ...insertArticle, 
      id,
      createdAt: new Date() 
    };
    this.newsArticles.set(id, article);
    return article;
  }

  async updateNewsArticle(id: number, updates: Partial<NewsArticle>): Promise<NewsArticle | undefined> {
    const article = this.newsArticles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, ...updates };
    this.newsArticles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    return this.newsArticles.delete(id);
  }

  // Chat session methods
  async getChatSessions(): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values());
  }

  async getChatSessionBySessionId(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values())
      .find((session) => session.sessionId === sessionId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.chatSessionId++;
    const session: ChatSession = { 
      ...insertSession, 
      id,
      createdAt: new Date() 
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async deleteChatSession(id: number): Promise<boolean> {
    return this.chatSessions.delete(id);
  }

  // Chat message methods
  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  async getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id,
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    
    // Update Redis cache
    const sessionMessages = await this.getChatMessagesBySessionId(insertMessage.sessionId);
    await setSessionMessages(insertMessage.sessionId, sessionMessages);
    
    return message;
  }

  async deleteChatMessagesBySessionId(sessionId: string): Promise<boolean> {
    const messageIds = Array.from(this.chatMessages.entries())
      .filter(([_, message]) => message.sessionId === sessionId)
      .map(([id]) => id);
    
    let success = true;
    for (const id of messageIds) {
      if (!this.chatMessages.delete(id)) {
        success = false;
      }
    }
    
    return success;
  }

  // Vector embedding methods
  async getVectorEmbeddings(): Promise<VectorEmbedding[]> {
    return Array.from(this.vectorEmbeddings.values());
  }

  async getVectorEmbeddingsByArticleId(articleId: number): Promise<VectorEmbedding[]> {
    return Array.from(this.vectorEmbeddings.values())
      .filter((embedding) => embedding.articleId === articleId);
  }

  async createVectorEmbedding(insertEmbedding: InsertVectorEmbedding): Promise<VectorEmbedding> {
    const id = this.vectorEmbeddingId++;
    const embedding: VectorEmbedding = { ...insertEmbedding, id };
    this.vectorEmbeddings.set(id, embedding);
    return embedding;
  }

  async deleteVectorEmbeddingsByArticleId(articleId: number): Promise<boolean> {
    const embeddingIds = Array.from(this.vectorEmbeddings.entries())
      .filter(([_, embedding]) => embedding.articleId === articleId)
      .map(([id]) => id);
    
    let success = true;
    for (const id of embeddingIds) {
      if (!this.vectorEmbeddings.delete(id)) {
        success = false;
      }
    }
    
    return success;
  }
}

export const storage = new MemStorage();
