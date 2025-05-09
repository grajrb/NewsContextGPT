import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  author?: string;
};

const FeaturedNews = () => {
  const { data: articles, isLoading, error } = useQuery<NewsArticleType[]>({
    queryKey: ['/api/news/featured'],
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-64" />
            <div className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-7 w-full mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <div className="flex items-center">
                <Skeleton className="h-3 w-24" />
                <div className="mx-2">•</div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-40" />
            <div className="p-4">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-40" />
            <div className="p-4">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !articles || articles.length < 3) {
    return (
      <div className="mb-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading featured news. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Default placeholder images if none are provided
  const getImageUrl = (article: NewsArticleType) => {
    return article.imageUrl || 
      `https://source.unsplash.com/random/600x400?${article.category}`;
  };

  // Extract the main article and secondary articles
  const mainArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);

  // Format the time ago
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const publishedDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="md:col-span-2">
        {/* Main featured article */}
        <Card className="bg-white rounded-lg shadow overflow-hidden">
          <img 
            src={getImageUrl(mainArticle)} 
            alt={mainArticle.title}
            className="w-full h-64 object-cover"
          />
          <CardContent className="p-6">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              {mainArticle.category}
            </span>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">{mainArticle.title}</h2>
            <p className="mt-3 text-base text-gray-600">{mainArticle.summary || mainArticle.content}</p>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">{getTimeAgo(mainArticle.publishedAt)}</span>
              {mainArticle.author && (
                <>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">By {mainArticle.author}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        {/* Secondary featured articles */}
        {secondaryArticles.map((article) => (
          <Card key={article.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img 
              src={getImageUrl(article)} 
              alt={article.title}
              className="w-full h-40 object-cover"
            />
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                {article.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{article.title}</h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{article.summary || article.content}</p>
              <div className="mt-3 flex items-center">
                <span className="text-xs text-gray-500">{getTimeAgo(article.publishedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedNews;
