import { createDimensionReducer, Embeddings } from '@xenova/transformers';

interface Document {
  id: number;
  articleId: number;
  chunkText: string;
  embedding: number[];
}

// In-memory vector store
const vectorStore: Document[] = [];

/**
 * Add an embedding to the vector store
 * 
 * @param id - The unique identifier for the embedding
 * @param articleId - The article ID this embedding is associated with
 * @param embedding - The embedding vector
 * @param text - The text chunk this embedding represents
 */
export async function addEmbeddingToVectorStore(
  id: number, 
  articleId: number, 
  embedding: number[], 
  text: string
): Promise<void> {
  vectorStore.push({
    id,
    articleId,
    chunkText: text,
    embedding,
  });
}

/**
 * Compute cosine similarity between two vectors
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity score (between -1 and 1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Search the vector store for documents similar to the query
 * 
 * @param query - The search query
 * @param k - Number of results to return
 * @returns Array of matching documents
 */
export async function searchVectorStore(
  query: string, 
  k: number = 3
): Promise<{ articleId: number; chunkText: string }[]> {
  try {
    // Import the embedding function dynamically
    const { generateEmbedding } = await import('./embedding');
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for query");
    }
    
    // Get similarity scores for all documents
    const results = vectorStore.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));
    
    // Sort by similarity score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Return top k results
    return results
      .slice(0, k)
      .filter(doc => doc.score > 0.5) // Only return reasonably similar documents
      .map(doc => ({
        articleId: doc.articleId,
        chunkText: doc.chunkText,
      }));
  } catch (error) {
    console.error("Error searching vector store:", error);
    return [];
  }
}
