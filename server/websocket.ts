import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';
import { processUserQuery } from './rag';
import { nanoid } from 'nanoid';

interface ChatMessage {
  type: 'user' | 'bot';
  sessionId: string;
  message: string;
  sources?: string[];
}

// Map of session IDs to WebSocket connections
const sessions = new Map<string, WebSocket>();

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ 
    server,
    // Add error handling for WebSocket
    verifyClient: (info, cb) => {
      // Accept all WebSocket connections
      cb(true);
    }
  });

  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  wss.on('connection', (ws: WebSocket) => {
    // Generate a session ID for new connections
    const sessionId = nanoid();
    sessions.set(sessionId, ws);

    // Setup error handler for this connection
    ws.on('error', (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
    });

    // Send initial connection message with session ID
    ws.send(JSON.stringify({
      type: 'connection',
      sessionId,
      message: 'Connected to chat server'
    }));

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'bot',
      sessionId,
      message: "Hello! I'm your news assistant powered by AI. I can answer questions about current news events. What would you like to know?"
    }));

    // Handle incoming messages
    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        
        // Validate incoming message
        if (!message.sessionId || !message.message) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
          return;
        }

        // Check if sessionId exists and matches
        if (message.sessionId !== sessionId) {
          // Create new session if needed
          const existingSession = await storage.getChatSessionBySessionId(message.sessionId);
          if (!existingSession) {
            await storage.createChatSession({ sessionId: message.sessionId });
          }
        }

        // Store user message
        await storage.createChatMessage({
          sessionId: message.sessionId,
          content: message.message,
          isUser: true
        });

        // Send typing indicator
        ws.send(JSON.stringify({
          type: 'typing',
          sessionId: message.sessionId
        }));

        // Process the message
        const response = await processUserQuery(message.sessionId, message.message);

        // Store bot response
        await storage.createChatMessage({
          sessionId: message.sessionId,
          content: response.message,
          isUser: false,
          sources: JSON.stringify(response.sources)
        });

        // Send the response back
        ws.send(JSON.stringify({
          type: 'bot',
          sessionId: message.sessionId,
          message: response.message,
          sources: response.sources
        }));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing your message'
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      sessions.delete(sessionId);
    });
  });
}

/**
 * Send a message to a specific session
 * 
 * @param sessionId - The target session ID
 * @param message - The message to send
 */
export function sendToSession(sessionId: string, message: ChatMessage): void {
  const ws = sessions.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}