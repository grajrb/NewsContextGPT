import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

type NewsArticleProps = {
  category: string;
  title: string;
  content: string;
  imageUrl: string;
  timestamp: string;
};

const NewsArticle = ({ category, title, content, imageUrl, timestamp }: NewsArticleProps) => {
  // Truncate content to a reasonable length
  const truncate = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Capitalize category for display
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-shadow duration-200 hover:shadow-md">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Link href={`/category/${category.toLowerCase()}`}>
          <div>
            <Badge className="absolute top-2 left-2 bg-primary-500 hover:bg-primary-600 cursor-pointer">
              {categoryDisplay}
            </Badge>
          </div>
        </Link>
      </div>
      
      <CardContent className="flex-grow p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-primary-500 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3">
          {truncate(content)}
        </p>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
        {timestamp}
      </CardFooter>
    </Card>
  );
};

export default NewsArticle;