import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const categories = [
    { name: 'Technology', url: '/category/technology' },
    { name: 'Business', url: '/category/business' },
    { name: 'Politics', url: '/category/politics' },
    { name: 'Science', url: '/category/science' },
    { name: 'Health', url: '/category/health' },
    { name: 'Sports', url: '/category/sports' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and site name */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-8 w-8 text-primary-500 mr-2"
                  >
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path>
                    <path d="M4 12h16"></path>
                    <path d="M9 22V4"></path>
                  </svg>
                  <span className="font-bold text-xl text-gray-900">NewsIntelligence</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          {!isMobile && (
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
              {categories.map((category) => (
                <Link key={category.name} href={category.url}>
                  <div className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    location === category.url 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    {category.name}
                  </div>
                </Link>
              ))}
            </nav>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                aria-expanded={isMenuOpen}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18"></path>
                    <path d="M6 6l12 12"></path>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobile && isMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            {categories.map((category) => (
              <Link key={category.name} href={category.url}>
                <div 
                  className={`block px-3 py-2 text-base font-medium cursor-pointer ${
                    location === category.url
                      ? 'bg-gray-50 border-l-4 border-primary-500 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300 hover:text-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;