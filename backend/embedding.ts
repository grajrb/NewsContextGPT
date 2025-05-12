import axios from 'axios';

/**
 * Generate embeddings for a given text using Jina Embeddings API
 * 
 * @param text - The text to embed
 * @returns A vector embedding as an array of numbers
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Add a small delay to ensure environment variables are loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get API key from environment variables with fallback
    const apiKey = process.env.JINA_API_KEY || process.env.EMBEDDING_API_KEY;
    
    if (!apiKey) {
      console.log('Environment variables available:', Object.keys(process.env).join(', '));
      throw new Error("JINA_API_KEY or EMBEDDING_API_KEY environment variable not set");
    }
    
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    
    // Call Jina Embeddings API
    const response = await axios.post(
      'https://api.jina.ai/v1/embeddings',
      {
        input: text,
        model: "jina-embeddings-v2-base-en",
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    if (!response.data.data || !response.data.data[0] || !response.data.data[0].embedding) {
      throw new Error("Invalid response from Jina Embeddings API");
    }
    
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    
    // Fallback to simple vector for development/testing
    if (process.env.NODE_ENV === 'development') {
      console.warn("Using fallback embedding generation");
      return generateFallbackEmbedding(text);
    }
    
    return null;
  }
}

/**
 * Generate a simple fallback embedding for development purposes
 * This is NOT suitable for production use
 * 
 * @param text - The text to embed
 * @returns A simple vector
 */
function generateFallbackEmbedding(text: string): number[] {
  // Create a simple embedding based on character frequencies
  const charFreq = new Map<string, number>();
  for (const char of text.toLowerCase()) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }
  
  // Convert to a fixed-size vector (use ASCII values as dimensions)
  const embedding: number[] = new Array(128).fill(0);
  charFreq.forEach((freq, char) => {
    const code = char.charCodeAt(0);
    if (code < 128) {
      embedding[code] = freq / text.length;
    }
  });
  
  return embedding;
}
