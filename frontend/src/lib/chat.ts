import { apiRequest } from "./queryClient";
import type { ChatCompletionResponse, ClearChatResponse } from "@shared/schema";

/**
 * Send a message to the chatbot.
 * @param sessionId - The unique session identifier
 * @param message - The user's message
 * @returns A promise that resolves to the bot's response
 */
export async function sendMessage(sessionId: string, message: string): Promise<ChatCompletionResponse> {
  try {
    // Create an abort controller to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const options: RequestInit = { signal: controller.signal };
    const response = await apiRequest("POST", "/api/chat", { sessionId, message }, options);
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in sendMessage:", error);
    // Create a standardized error response
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. The server took too long to respond.");
    }
    throw error;
  }
}

/**
 * Clear the chat history for a session.
 * @param sessionId - The unique session identifier
 * @returns A promise that resolves to a success message
 */
export async function clearChat(sessionId: string): Promise<ClearChatResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const options: RequestInit = { signal: controller.signal };
    const response = await apiRequest("DELETE", `/api/chat/${sessionId}`, null, options);
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in clearChat:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. The server took too long to respond.");
    }
    throw error;
  }
}

/**
 * Fetch chat history for a session.
 * @param sessionId - The unique session identifier
 * @returns A promise that resolves to the chat history
 */
export async function getChatHistory(sessionId: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const options: RequestInit = { signal: controller.signal };
    const response = await apiRequest("GET", `/api/chat/${sessionId}`, null, options);
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. The server took too long to respond.");
    }
    throw error;
  }
}
