import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "./storage";
import { insertNewsArticleSchema, type InsertNewsArticle } from "@shared/schema";
import { generateEmbedding } from "./embedding";
import { addEmbeddingToVectorStore } from "./vectorStore";

// Categories for news articles
const NEWS_CATEGORIES = [
  "politics",
  "business",
  "technology",
  "health",
  "science",
  "world",
  "sports",
  "entertainment",
];

// Function to fetch RSS feeds from Reuters
async function fetchReutersArticles() {
  try {
    // Fetch the sitemap index
    const sitemapResponse = await axios.get("https://www.reuters.com/arc/outboundfeeds/sitemap-index/?outputType=xml");
    const $ = cheerio.load(sitemapResponse.data, { xmlMode: true });
    
    // Extract news sitemaps
    const newsSitemaps = $("sitemap loc")
      .map((_, element) => $(element).text())
      .get()
      .filter(url => url.includes("news-sitemap"))
      .slice(0, 2); // Just take the first 2 news sitemaps to limit articles
    
    const articles: InsertNewsArticle[] = [];
    
    for (const sitemapUrl of newsSitemaps) {
      const response = await axios.get(sitemapUrl);
      const sitemap$ = cheerio.load(response.data, { xmlMode: true });
      
      // Extract article urls and metadata
      sitemap$("url").each((_, element) => {
        const url = sitemap$("loc", element).text();
        const title = sitemap$("news\\:title", element).text();
        const publishedAt = sitemap$("news\\:publication_date", element).text();
        const source = sitemap$("news\\:name", element).text();
        
        // Skip if missing essential data
        if (!url || !title) return;
        
        // Randomly assign a category for demo purposes
        const category = NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)];
        
        articles.push({
          title,
          content: "", // Will be fetched in the next step
          summary: "",
          category,
          source,
          url,
          publishedAt: new Date(publishedAt),
        });
        
        // Limit to ~50 articles
        if (articles.length >= 50) return false;
      });
      
      if (articles.length >= 50) break;
    }
    
    return articles;
  } catch (error) {
    console.error("Error fetching Reuters articles:", error);
    return [];
  }
}

// Function to scrape article content
async function scrapeArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Reuters article content is typically in paragraph tags within a main element
    const paragraphs = $("main p").map((_, el) => $(el).text()).get();
    return paragraphs.join("\n\n");
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error);
    return "";
  }
}

// Function to chunk text for embedding
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  if (!text) return [];
  
  // Split by paragraphs
  const paragraphs = text.split("\n\n");
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    
    currentChunk += paragraph + "\n\n";
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate sample news data for development
async function generateSampleNewsData(count = 5) {
  const categories = ["politics", "business", "technology", "health", "science", "sports"];
  const articles = [];
  
  const sampleTitles = [
    "Global Markets Rally as Trade Tensions Ease",
    "New AI Technology Revolutionizes Healthcare Diagnosis",
    "Climate Summit Concludes with Historic Carbon Agreement",
    "Tech Giants Face New Regulations in European Union",
    "Researchers Discover Breakthrough in Renewable Energy Storage",
    "Space Mission Successfully Lands on Mars"
  ];
  
  const sampleContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam feugiat justo ut lacus feugiat, vel finibus eros tincidunt. 
  Praesent at auctor metus, eu tincidunt nunc. Suspendisse egestas quam sed arcu sollicitudin, vel tempor odio feugiat.
  
  Vivamus faucibus libero et felis finibus, et vehicula augue ornare. Duis tempor sapien id neque feugiat tincidunt. 
  Integer molestie ipsum non ex finibus, ut pellentesque quam tristique. Praesent gravida metus et rutrum elementum.
  
  Fusce sed dolor at magna lacinia lobortis. Integer ac aliquet urna, a rutrum tellus.`;
  
  // Generate articles with unique content (limited number for faster startup)
  const maxArticles = Math.min(count, sampleTitles.length);
  for (let i = 0; i < maxArticles; i++) {
    const title = sampleTitles[i];
    const category = categories[i % categories.length];
    
    // Create simplified content
    const paragraphs = sampleContent.split('\n\n');
    // Select 2 paragraphs max
    const contentParagraphs = [paragraphs[0], paragraphs[1]];
    const content = contentParagraphs.join('\n\n');
    
    // Generate a date within the past week
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    articles.push({
      title,
      content,
      summary: contentParagraphs[0].substring(0, 120) + '...',
      category,
      source: 'News Intelligence',
      url: `https://example.com/news/${category}/${i}`,
      imageUrl: `https://source.unsplash.com/random/600x300?${category}`,
      publishedAt: date
    });
  }
  
  return articles;
}

// Main ingestion function
export async function ingestNewsArticles() {
  try {
    // Check if articles are already ingested
    const existingArticles = await storage.getNewsArticles();
    if (existingArticles.length > 0) {
      console.log(`${existingArticles.length} articles already ingested, skipping ingestion.`);
      return;
    }
    
    console.log("Starting news article ingestion...");
    
    // Use sample data for development or attempt to fetch from Reuters
    let articles;
    const isDev = process.env.NODE_ENV === 'development';
    
    // In development mode, use a smaller dataset
    if (isDev) {
      console.log("Using small sample dataset for development");
      articles = await generateSampleNewsData(5);
    } else {
      try {
        articles = await fetchReutersArticles();
        if (!articles || articles.length === 0) {
          console.log("Failed to fetch articles from Reuters, using sample data instead");
          articles = await generateSampleNewsData(10);
        }
      } catch (error) {
        console.log("Error fetching from Reuters, using sample data instead:", error);
        articles = await generateSampleNewsData(10);
      }
    }
    
    console.log(`Processing ${articles.length} articles...`);
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      try {
        // Validate article
        const validatedArticle = insertNewsArticleSchema.parse(article);
        
        // Fetch content if not already present
        if (!validatedArticle.content && validatedArticle.url) {
          console.log(`Scraping content for article ${i + 1}/${articles.length}: ${validatedArticle.title}`);
          validatedArticle.content = await scrapeArticleContent(validatedArticle.url);
          
          // Generate summary (first paragraph or first 200 chars)
          if (validatedArticle.content) {
            const firstParagraph = validatedArticle.content.split("\n\n")[0];
            validatedArticle.summary = firstParagraph.length > 200 
              ? firstParagraph.substring(0, 197) + "..."
              : firstParagraph;
          }
          
          // Add a random image URL from Unsplash based on category
          validatedArticle.imageUrl = `https://source.unsplash.com/random/600x300?${validatedArticle.category}`;
        }
        
        // Store article
        const savedArticle = await storage.createNewsArticle(validatedArticle);
        console.log(`Saved article ${savedArticle.id}: ${savedArticle.title}`);
        
        // Generate embeddings for article content
        if (savedArticle.content) {
          const chunks = chunkText(savedArticle.content);
          console.log(`Generated ${chunks.length} chunks for article ${savedArticle.id}`);
          
          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            
            // Generate embedding for chunk
            const embedding = await generateEmbedding(chunk);
            
            // Store embedding
            if (embedding) {
              const vectorEmbedding = await storage.createVectorEmbedding({
                articleId: savedArticle.id,
                chunkText: chunk,
                chunkIndex,
                embedding: JSON.stringify(embedding),
              });
              
              // Add to vector store
              await addEmbeddingToVectorStore(
                vectorEmbedding.id,
                vectorEmbedding.articleId,
                embedding,
                chunk
              );
              
              console.log(`Added embedding ${vectorEmbedding.id} for article ${savedArticle.id}, chunk ${chunkIndex + 1}/${chunks.length}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`Error processing article: ${article.title}`, error);
      }
    }
    
    console.log("News article ingestion complete!");
    
  } catch (error) {
    console.error("Error during news article ingestion:", error);
  }
}
