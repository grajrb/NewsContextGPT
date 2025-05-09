import Redis from "ioredis";
import { ChatMessage } from "@shared/schema";

// In-memory fallback when Redis is not available
const memoryCache = new Map<string, any>();

// TTL for chat history (1 hour in seconds)
const CHAT_HISTORY_TTL = 60 * 60;

// Redis client interface definition
interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<any>;
  lpush(key: string, value: string): Promise<any>;
  expire(key: string, seconds: number): Promise<any>;
  del(key: string): Promise<any>;
}

// Memory fallback implementation of RedisInterface
class MemoryRedis implements RedisInterface {
  async get(key: string): Promise<string | null> {
    return memoryCache.has(key) ? JSON.stringify(memoryCache.get(key)) : null;
  }
  
  async set(key: string, value: string): Promise<any> {
    memoryCache.set(key, JSON.parse(value));
    return "OK";
  }
  
  async lpush(key: string, value: string): Promise<any> {
    if (!memoryCache.has(key)) {
      memoryCache.set(key, []);
    }
    const list = memoryCache.get(key);
    list.unshift(JSON.parse(value));
    memoryCache.set(key, list);
    return list.length;
  }
  
  async expire(key: string, seconds: number): Promise<any> {
    // For memory implementation, we don't automatically expire
    // We could implement this with setTimeout if needed
    return 1;
  }
  
  async del(key: string): Promise<any> {
    return memoryCache.delete(key) ? 1 : 0;
  }
}

// Use memory fallback by default
const memoryRedis = new MemoryRedis();

// Set up a variable to hold our Redis client (or MemoryRedis fallback)
let redisClient: RedisInterface = memoryRedis;

// Initialize Redis if possible
if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  console.log("Attempting to connect to Redis...");
  try {
    const client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || "",
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    
    // Handle errors gracefully
    client.on('error', (err) => {
      console.log("Redis error, using in-memory storage:", err.message);
      redisClient = memoryRedis;
    });
    
    // Set up connection
    client.connect().then(() => {
      console.log("Connected to Redis successfully");
      redisClient = client as unknown as RedisInterface;
    }).catch(err => {
      console.log("Redis connection failed, using in-memory storage:", err.message);
      redisClient = memoryRedis;
    });
  } catch (error) {
    console.warn("Redis initialization error, using in-memory storage:", error);
    redisClient = memoryRedis;
  }
} else {
  console.log("No Redis configuration found, using in-memory storage");
}

/**
 * Add a chat interaction to the history
 * 
 * @param sessionId - The unique session identifier
 * @param chatData - The chat data to add
 */
export async function addChatToHistory(
  sessionId: string, 
  chatData: { query: string; response: string; sources: string[]; timestamp: string }
): Promise<void> {
  try {
    const key = `chat:${sessionId}`;
    await redisClient.lpush(key, JSON.stringify(chatData));
    await redisClient.expire(key, CHAT_HISTORY_TTL);
  } catch (error) {
    console.error("Error adding chat to history:", error);
  }
}

/**
 * Get chat messages for a session
 * 
 * @param sessionId - The unique session identifier
 * @returns Array of chat messages
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[] | null> {
  try {
    const key = `chat_messages:${sessionId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting session messages:", error);
    return null;
  }
}

/**
 * Store chat messages for a session
 * 
 * @param sessionId - The unique session identifier
 * @param messages - The chat messages to store
 */
export async function setSessionMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
  try {
    const key = `chat_messages:${sessionId}`;
    await redisClient.set(key, JSON.stringify(messages));
    await redisClient.expire(key, CHAT_HISTORY_TTL);
  } catch (error) {
    console.error("Error setting session messages:", error);
  }
}

/**
 * Delete chat messages for a session
 * 
 * @param sessionId - The unique session identifier
 */
export async function deleteSessionMessages(sessionId: string): Promise<void> {
  try {
    // Delete chat messages
    const key = `chat_messages:${sessionId}`;
    await redisClient.del(key);
    
    // Also delete chat history
    const historyKey = `chat:${sessionId}`;
    await redisClient.del(historyKey);
  } catch (error) {
    console.error("Error deleting session messages:", error);
  }
}
