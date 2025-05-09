import { apiRequest } from "./queryClient";
import type { ChatCompletionResponse, ClearChatResponse } from "@shared/schema";

/**
 * Send a message to the chatbot.
 * @param sessionId - The unique session identifier
 * @param message - The user's message
 * @returns A promise that resolves to the bot's response
 */
export async function sendMessage(sessionId: string, message: string): Promise<ChatCompletionResponse> {
  const response = await apiRequest("POST", "/api/chat", { sessionId, message });
  const data = await response.json();
  return data;
}

/**
 * Clear the chat history for a session.
 * @param sessionId - The unique session identifier
 * @returns A promise that resolves to a success message
 */
export async function clearChat(sessionId: string): Promise<ClearChatResponse> {
  const response = await apiRequest("DELETE", `/api/chat/${sessionId}`);
  const data = await response.json();
  return data;
}

/**
 * Fetch chat history for a session.
 * @param sessionId - The unique session identifier
 * @returns A promise that resolves to the chat history
 */
export async function getChatHistory(sessionId: string) {
  const response = await apiRequest("GET", `/api/chat/${sessionId}`);
  const data = await response.json();
  return data;
}
