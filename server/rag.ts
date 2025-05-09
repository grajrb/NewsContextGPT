import { storage } from "./storage";
import { searchVectorStore } from "./vectorStore";
import { generateGeminiResponse } from "./gemini";
import { addChatToHistory } from "./redis";

interface ProcessedQueryResult {
  message: string;
  sources: string[];
}

/**
 * Process a user query using RAG (Retrieval-Augmented Generation)
 * 
 * @param sessionId - The unique session identifier
 * @param query - The user's query
 * @returns The generated response with sources
 */
export async function processUserQuery(sessionId: string, query: string): Promise<ProcessedQueryResult> {
  try {
    // 1. Retrieve relevant documents from the vector store
    const relevantDocs = await searchVectorStore(query, 5);
    
    if (!relevantDocs || relevantDocs.length === 0) {
      return {
        message: "I'm sorry, but I couldn't find any relevant information to answer your question. Please try asking a different question about current news events.",
        sources: [],
      };
    }
    
    // 2. Collect article details for the sources list
    const articleIds = [...new Set(relevantDocs.map(doc => doc.articleId))];
    const sourceArticles = await Promise.all(
      articleIds.map(id => storage.getNewsArticleById(id))
    );
    
    // Filter out undefined articles
    const validArticles = sourceArticles.filter(article => article !== undefined);
    
    // 3. Prepare context for LLM
    const context = relevantDocs
      .map(doc => doc.chunkText)
      .join("\n\n");
    
    // 4. Construct the prompt for the LLM
    const prompt = `
    You are a helpful news assistant that answers questions based on the provided news articles.
    Be informative, accurate, and objective. Only respond with information that is supported by the provided context.
    If you don't know the answer, say so clearly rather than making something up.

    Context from news articles:
    ${context}

    User Question: ${query}
    
    Provide a comprehensive, factual response to the question above using only the information from the context. 
    Do not invent or add information that is not in the provided context.
    `;
    
    // 5. Generate response using Gemini
    const response = await generateGeminiResponse(prompt);
    
    // 6. Extract article titles for sources
    const sources = validArticles.map(article => article!.title);
    
    // 7. Store the interaction in Redis cache
    await addChatToHistory(sessionId, {
      query,
      response,
      sources,
      timestamp: new Date().toISOString(),
    });
    
    return {
      message: response,
      sources,
    };
  } catch (error) {
    console.error("Error processing RAG query:", error);
    return {
      message: "I encountered an error while trying to answer your question. Please try again later.",
      sources: [],
    };
  }
}
