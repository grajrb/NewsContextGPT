import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import NewsArticle from './NewsArticle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useConnection } from './ConnectionProvider';
import { useToast } from '@/hooks/use-toast';

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

// Cached news items for offline support
const CACHED_NEWS_KEY = 'cached_news_data';
const CACHE_TIMESTAMP_KEY = 'cached_news_timestamp';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const NewsGrid = ({ category, featured = false, limit }: NewsGridProps) => {
  const { status, offlineMode } = useConnection();
  const { toast } = useToast();
  const [cachedArticles, setCachedArticles] = useState<NewsArticleType[] | null>(null);
  const [usedCachedData, setUsedCachedData] = useState(false);
  
  let queryKey = '/api/news';
  
  if (featured) {
    queryKey = '/api/news/featured';
  } else if (category) {
    queryKey = `/api/news/category/${category}`;
  }
  
  // Only enable query if we're not in offline mode
  const { data: articles, isLoading, isError, refetch } = useQuery<NewsArticleType[]>({
    queryKey: [queryKey],
    enabled: !offlineMode
  });

  // Load cached data when component mounts
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHED_NEWS_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const parsedData = JSON.parse(cachedData) as NewsArticleType[];
        const timestamp = parseInt(cachedTimestamp, 10);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        
        // Only use non-expired cache data
        if (!isExpired) {
          setCachedArticles(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading cached news data:', error);
    }
  }, []);

  // Cache articles when they're successfully fetched
  useEffect(() => {
    if (articles && articles.length > 0) {
      try {
        localStorage.setItem(CACHED_NEWS_KEY, JSON.stringify(articles));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error('Error caching news data:', error);
      }
    }
  }, [articles]);

  // Determine if we should use cached data
  useEffect(() => {
    if ((isError || offlineMode) && cachedArticles) {
      if (!usedCachedData) {
        toast({
          title: 'Using cached content',
          description: 'Showing previously loaded articles while offline.',
          duration: 3000,
        });
        setUsedCachedData(true);
      }
    } else {
      setUsedCachedData(false);
    }
  }, [isError, offlineMode, cachedArticles, usedCachedData, toast]);

  // Default placeholder image if none is provided
  const getImageUrl = (article: NewsArticleType) => {
    return article.imageUrl || 
      `https://source.unsplash.com/random/600x300?${article.category}`;
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (offlineMode) {
      toast({
        title: 'Offline mode is enabled',
        description: 'Disable offline mode to refresh content.',
        variant: 'destructive',
      });
      return;
    }
    
    refetch();
  };

  // Show offline message with cached content option
  if ((isError || offlineMode) && !usedCachedData) {
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
          <path d="M18.36 6.64A9 9 0 0 1 20.77 15"></path>
          <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"></path>
          <path d="M12 2v2"></path>
          <path d="m2 2 20 20"></path>
        </svg>
        <p className="text-lg font-medium">Unable to load articles</p>
        <p className="mt-2">
          {offlineMode ? 'You are in offline mode.' : 'Unable to connect to the server.'}
        </p>
        
        <div className="mt-4 flex justify-center space-x-3">
          {cachedArticles && cachedArticles.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setUsedCachedData(true)}
            >
              Use Cached Content
            </Button>
          )}
          
          <Button 
            variant="default"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Empty state when no articles are found
  if (!isLoading && !usedCachedData && (!articles || articles.length === 0)) {
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
  if (isLoading && !usedCachedData) {
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

  // Use cached data if we're offline or there was an error
  const displayArticles = usedCachedData ? cachedArticles : articles;
  
  // Limit articles if specified
  const limitedArticles = displayArticles ? 
    (limit ? displayArticles.slice(0, limit) : displayArticles) : [];

  // Add notice for cached content
  return (
    <>
      {usedCachedData && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 flex justify-between items-center">
          <span>
            <span className="font-medium">Viewing cached content.</span> This content may not be the most recent.
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {limitedArticles.map((article) => (
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
    </>
  );
};

export default NewsGrid;