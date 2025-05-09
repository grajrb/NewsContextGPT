import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Metadata } from '../components/ui/metadata';
import Navbar from '@/components/Navbar';
import NewsArticle from '@/components/NewsArticle';
import NewsGrid from '@/components/NewsGrid';
import ChatWidget from '@/components/ChatWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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

const Home = () => {
  // Fetch featured news
  const { data: featuredArticles, isLoading: isFeaturedLoading, isError } = useQuery<NewsArticleType[]>({
    queryKey: ['/api/news/featured']
  });

  // Default placeholder image if none is provided
  const getImageUrl = (article: NewsArticleType) => {
    return article.imageUrl || 
      `https://source.unsplash.com/random/600x300?${article.category}`;
  };

  // Categories for the category grid
  const categories = [
    { name: 'Technology', icon: '🖥️', url: '/category/technology', color: 'bg-blue-500' },
    { name: 'Business', icon: '📊', url: '/category/business', color: 'bg-green-500' },
    { name: 'Politics', icon: '🏛️', url: '/category/politics', color: 'bg-orange-500' },
    { name: 'Science', icon: '🧪', url: '/category/science', color: 'bg-purple-500' },
    { name: 'Health', icon: '🩺', url: '/category/health', color: 'bg-red-500' },
    { name: 'Sports', icon: '⚽', url: '/category/sports', color: 'bg-yellow-500' },
  ];

  return (
    <>
      <Metadata 
        title="NewsIntelligence - AI-Powered News Assistant"
        description="Stay informed with our AI-powered news assistant. Ask questions about any news topic and get intelligent, contextual answers."
      />
      
      <Navbar />
      
      <main className="pb-24">
        {/* Hero section */}
        <section className="bg-gradient-to-r from-primary-500 to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block">Stay Informed With</span>
                <span className="block text-blue-200">AI-Powered News</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-xl">
                Get the latest news and ask questions about current events with our intelligent news assistant.
              </p>
              <div className="mt-8 flex justify-center">
                <div className="rounded-md shadow">
                  <Button
                    className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    onClick={() => document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Browse Categories
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured news section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured News</h2>
            <NewsGrid featured={true} limit={6} />
          </div>
        </section>

        {/* Category browsing section */}
        <section id="categories" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link key={category.name} href={category.url}>
                  <div className="flex flex-col items-center justify-center p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <span className="text-3xl mb-3">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* About RAG section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">powered by RAG</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
                Intelligent News Understanding
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our news assistant uses Retrieval Augmented Generation (RAG) to provide accurate, contextual answers about current events.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 17 10 11 4 5"></polyline>
                        <line x1="12" y1="19" x2="20" y2="19"></line>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Semantic Understanding</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Our technology understands the meaning behind your questions, not just keywords, to provide more accurate answers.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
                        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Real-time News Retrieval</h3>
                    <p className="mt-2 text-base text-gray-500">
                      We retrieve and analyze the most relevant news content to answer your questions with up-to-date information.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Source Attribution</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Our assistant provides sources for its answers, allowing you to verify information and explore topics further.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Natural Conversations</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Talk to our assistant naturally and get conversational responses that help you understand complex news topics more easily.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <ChatWidget />
    </>
  );
};

export default Home;