import { useQuery } from '@tanstack/react-query';
import NewsArticle from './NewsArticle';
import { Skeleton } from '@/components/ui/skeleton';

type NewsArticleType = {
  id: number;
  title: string;
  content: string;
  summary?: string;
  category: string;
  source?: string;
  url?: string;
  imageUrl?: string;
  publishedAt: string;
};

interface NewsGridProps {
  category?: string;
  featured?: boolean;
  limit?: number;
}

const NewsGrid = ({ category, featured = false, limit }: NewsGridProps) => {
  let queryKey = '/api/news';
  
  if (featured) {
    queryKey = '/api/news/featured';
  } else if (category) {
    queryKey = `/api/news/category/${category}`;
  }
  
  const { data: articles, isLoading, isError } = useQuery<NewsArticleType[]>({
    queryKey: [queryKey]
  });

  // Default placeholder image if none is provided
  const getImageUrl = (article: NewsArticleType) => {
    return article.imageUrl || 
      `https://source.unsplash.com/random/600x300?${article.category}`;
  };

  // Empty state when no articles are found
  if (!isLoading && (!articles || articles.length === 0)) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="mx-auto mb-4 text-gray-400"
        >
          <path d="M16 16h.01"></path>
          <path d="M8 16h.01"></path>
          <path d="M12 20h.01"></path>
          <path d="M12 2a8.1 8.1 0 0 0-8 8.6 9 9 0 0 0 2 5.7 10 10 0 0 0 2.3 2.1A10 10 0 0 0 12 20a10 10 0 0 0 3.7-1.6 10 10 0 0 0 2.3-2.1 9 9 0 0 0 2-5.7 8.1 8.1 0 0 0-8-8.6Z"></path>
        </svg>
        <p className="text-lg font-medium">No articles found</p>
        <p className="mt-2">Try another category or check back later for updates.</p>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-3">
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Limit articles if specified
  const displayArticles = articles ? (limit ? articles.slice(0, limit) : articles) : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayArticles.map((article) => (
        <NewsArticle
          key={article.id}
          category={article.category}
          title={article.title}
          content={article.summary || article.content}
          imageUrl={getImageUrl(article)}
          timestamp={new Date(article.publishedAt).toLocaleDateString()}
        />
      ))}
    </div>
  );
};

export default NewsGrid;