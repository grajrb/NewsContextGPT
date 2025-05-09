import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generate a response from Google's Gemini API
 * 
 * @param prompt - The prompt to send to Gemini
 * @returns The generated response text
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "I apologize, but I'm having trouble generating a response right now. Please try again later.";
  }
}
