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
    },
    // Increase timeout values to prevent premature disconnections
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below is the important part for our application
      serverNoContextTakeover: false,
      clientNoContextTakeover: false, 
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024 // Size in bytes below which messages should not be compressed
    }
  });

  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Track connection attempts for each IP to prevent overloading
  const connectionAttempts = new Map<string, number>();
  const MAX_ATTEMPTS = 5;
  const RESET_TIME = 60000; // 1 minute
  
  wss.on('connection', (ws: WebSocket, req) => {
    // Get IP address for connection tracking
    const ip = req.socket.remoteAddress || 'unknown';
    
    // Check if this IP has had too many reconnection attempts
    const attempts = connectionAttempts.get(ip) || 0;
    if (attempts > MAX_ATTEMPTS) {
      console.warn(`Too many connection attempts from ${ip}, blocking temporarily`);
      ws.close(1008, 'Too many connection attempts');
      return;
    }
    
    // Increment connection attempts
    connectionAttempts.set(ip, attempts + 1);
    
    // Reset connection attempts after some time
    setTimeout(() => {
      connectionAttempts.set(ip, Math.max(0, (connectionAttempts.get(ip) || 0) - 1));
    }, RESET_TIME);
    
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

    // Add heartbeat mechanism to detect connection issues
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // Send ping every 30 seconds
    
    // Handle pong responses
    ws.on('pong', () => {
      // Connection is still alive
    });
    
    // Handle incoming messages with better error handling
    ws.on('message', async (data: any) => {
      try {
        let message;
        
        try {
          // Handle both string and Buffer data types
          const messageStr = data instanceof Buffer ? data.toString() : data;
          message = JSON.parse(messageStr);
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to parse message format'
          }));
          return;
        }
        
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
      // Clean up the connection from the sessions map
      sessions.delete(sessionId);
      
      // Clear the ping interval to prevent memory leaks
      clearInterval(pingInterval);
      
      console.log(`WebSocket connection closed for session ${sessionId}`);
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