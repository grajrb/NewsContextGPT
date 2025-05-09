import { useEffect } from 'react';

interface MetadataProps {
  title: string;
  description: string;
}

export function Metadata({ title, description }: MetadataProps) {
  useEffect(() => {
    // Update document title and meta description
    document.title = title;
    
    // Find existing description meta tag or create a new one
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'NewsIntelligence';
      if (metaDescription) {
        metaDescription.setAttribute('content', 'AI-powered news assistant');
      }
    };
  }, [title, description]);

  // This component doesn't render anything visually
  return null;
}