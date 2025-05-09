import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertChatMessageSchema, insertChatSessionSchema, ChatCompletionRequest } from "@shared/schema";
import { processUserQuery } from "./rag";
import { setupWebSocket } from "./websocket";
import { getSessionMessages, deleteSessionMessages } from "./redis";
import { ingestNewsArticles } from "./ingestion";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up specific route for WebSockets
  app.get('/ws', (req, res) => {
    res.send('WebSocket endpoint is running. Connect to this URL with a WebSocket client.');
  });

  // Set up websocket for chat
  setupWebSocket(httpServer);

  // Initialize the RAG system - this will ingest news articles if not already done
  await ingestNewsArticles();

  // API Routes
  // 1. News Routes
  app.get("/api/news", async (req, res) => {
    try {
      const articles = await storage.getNewsArticles();
      res.json(articles);
    } catch (error) {
      console.error("Failed to fetch news articles:", error);
      res.status(500).json({ message: "Failed to fetch news articles" });
    }
  });

  app.get("/api/news/featured", async (req, res) => {
    try {
      const articles = await storage.getFeaturedNewsArticles();
      res.json(articles);
    } catch (error) {
      console.error("Failed to fetch featured news articles:", error);
      res.status(500).json({ message: "Failed to fetch featured news articles" });
    }
  });

  app.get("/api/news/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await storage.getNewsByCategory(category);
      res.json(articles);
    } catch (error) {
      console.error(`Failed to fetch news articles for category ${req.params.category}:`, error);
      res.status(500).json({ message: `Failed to fetch news articles for category ${req.params.category}` });
    }
  });

  // 2. Chat Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const chatRequestSchema = z.object({
        sessionId: z.string(),
        message: z.string(),
      });

      const validatedData = chatRequestSchema.parse(req.body) as ChatCompletionRequest;
      const { sessionId, message } = validatedData;

      // Create session if it doesn't exist
      const existingSession = await storage.getChatSessionBySessionId(sessionId);
      if (!existingSession) {
        await storage.createChatSession({
          sessionId,
        });
      }

      // Save user message
      await storage.createChatMessage({
        sessionId,
        content: message,
        isUser: true,
      });

      // Process message using RAG pipeline
      const result = await processUserQuery(sessionId, message);

      // Save assistant response
      await storage.createChatMessage({
        sessionId,
        content: result.message,
        isUser: false,
        sources: JSON.stringify(result.sources),
      });

      res.json({
        sessionId,
        message: result.message,
        sources: result.sources,
      });
    } catch (error) {
      console.error("Failed to process chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Try to get messages from Redis first (for faster response)
      const cachedMessages = await getSessionMessages(sessionId);
      
      if (cachedMessages && cachedMessages.length > 0) {
        return res.json({
          sessionId,
          messages: cachedMessages,
        });
      }
      
      // If not in Redis, fetch from database
      const messages = await storage.getChatMessagesBySessionId(sessionId);
      
      res.json({
        sessionId,
        messages,
      });
    } catch (error) {
      console.error(`Failed to fetch chat history for session ${req.params.sessionId}:`, error);
      res.status(500).json({ message: `Failed to fetch chat history for session ${req.params.sessionId}` });
    }
  });

  app.delete("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Delete messages from Redis
      await deleteSessionMessages(sessionId);
      
      // Delete messages from storage
      await storage.deleteChatMessagesBySessionId(sessionId);
      
      res.json({
        sessionId,
        success: true,
      });
    } catch (error) {
      console.error(`Failed to clear chat history for session ${req.params.sessionId}:`, error);
      res.status(500).json({ message: `Failed to clear chat history for session ${req.params.sessionId}` });
    }
  });

  return httpServer;
}
