import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Metadata } from '../components/ui/metadata';
import Navbar from '@/components/Navbar';
import NewsGrid from '@/components/NewsGrid';
import ChatWidget from '@/components/ChatWidget';
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

const CategoryPage = () => {
  const { name } = useParams();
  const categoryName = name ? name.charAt(0).toUpperCase() + name.slice(1) : '';

  const { data: articles, isLoading, error } = useQuery<NewsArticleType[]>({
    queryKey: [`/api/news/category/${name}`],
    enabled: !!name,
  });

  return (
    <>
      <Metadata 
        title={`${categoryName} News - NewsIntelligence`}
        description={`Read the latest ${name} news and ask our AI assistant about current ${name} events.`}
      />
      
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName} News</h1>
          <p className="text-gray-600">Stay informed with the latest {name} news and insights.</p>
        </div>
        
        <div className="mb-12">
          <NewsGrid category={name} />
        </div>
      </main>
      
      <ChatWidget />
    </>
  );
};

export default CategoryPage;