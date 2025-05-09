import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatus = 'connected' | 'degraded' | 'disconnected' | 'connecting';

interface ConnectionContextType {
  status: ConnectionStatus;
  checkConnection: () => Promise<boolean>;
  isReachable: boolean;
  lastChecked: Date | null;
  offlineMode: boolean;
  setOfflineMode: (mode: boolean) => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  status: 'connecting',
  checkConnection: async () => false,
  isReachable: false,
  lastChecked: null,
  offlineMode: false,
  setOfflineMode: () => {}
});

export const useConnection = () => useContext(ConnectionContext);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isReachable, setIsReachable] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const [offlineMode, setOfflineMode] = useState(() => {
    // Use the window.startInOfflineMode flag set in index.html if available
    return typeof window !== 'undefined' && (window as any).startInOfflineMode === true;
  });
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  // Check API connectivity
  const checkApiConnection = async (): Promise<boolean> => {
    try {
      // Try a simple API request to check if the server is reachable
      const response = await fetch('/api/news', { 
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        },
        // Set a timeout to avoid hanging requests
        signal: AbortSignal.timeout(5000) 
      });
      
      return response.ok;
    } catch (error) {
      console.error('API connection check failed:', error);
      return false;
    }
  };

  // Check static file connectivity
  const checkStaticConnection = async (): Promise<boolean> => {
    try {
      // Try fetching a static file to check if at least the static content is reachable
      const response = await fetch('/favicon.ico', { 
        method: 'GET',
        cache: 'no-cache',
        // Set a timeout to avoid hanging requests
        signal: AbortSignal.timeout(3000) 
      });
      
      return response.ok;
    } catch (error) {
      console.error('Static connection check failed:', error);
      return false;
    }
  };

  const checkConnection = async (): Promise<boolean> => {
    if (offlineMode) {
      setStatus('disconnected');
      setIsReachable(false);
      setLastChecked(new Date());
      return false;
    }

    try {
      // First check API connectivity
      const apiConnected = await checkApiConnection();
      
      if (apiConnected) {
        setStatus('connected');
        setIsReachable(true);
        setLastChecked(new Date());
        setConnectionAttempts(0);
        return true;
      }
      
      // If API isn't connected, check if at least static content is available
      const staticConnected = await checkStaticConnection();
      
      if (staticConnected) {
        setStatus('degraded');
        setIsReachable(true);
        setLastChecked(new Date());
        return true;
      }
      
      // If neither is connected, we're fully disconnected
      setStatus('disconnected');
      setIsReachable(false);
      setLastChecked(new Date());
      
      // Increment connection attempts
      setConnectionAttempts(prev => prev + 1);
      
      // If we've had too many failed attempts, automatically enable offline mode
      if (connectionAttempts >= 5) {
        setOfflineMode(true);
        toast({
          title: 'Offline mode activated',
          description: 'After multiple failed connection attempts, the app has switched to offline mode.',
          duration: 5000,
        });
      }
      
      return false;
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
      setIsReachable(false);
      setLastChecked(new Date());
      setConnectionAttempts(prev => prev + 1);
      return false;
    }
  };

  // Handle toggling offline mode
  const handleSetOfflineMode = (mode: boolean) => {
    setOfflineMode(mode);
    if (mode) {
      setStatus('disconnected');
      toast({
        title: 'Offline mode enabled',
        description: 'The app will not attempt to connect to the server.',
        duration: 3000,
      });
    } else {
      setStatus('connecting');
      setConnectionAttempts(0);
      checkConnection();
      toast({
        title: 'Checking connection',
        description: 'Attempting to reconnect to the server...',
        duration: 3000,
      });
    }
  };

  // Initial connection check
  useEffect(() => {
    // Perform immediate check
    checkConnection();
    
    // Automatically enable offline mode if the URL contains an offline parameter
    if (window.location.search.includes('offline=true')) {
      handleSetOfflineMode(true);
    }
  }, []);

  // Periodic connection check
  useEffect(() => {
    if (offlineMode) return;

    // First check more frequently to determine status quickly
    const quickCheck = setTimeout(() => {
      checkConnection();
      setCheckCount(prev => prev + 1);
    }, 5000); // First check after 5 seconds

    // Then do regular periodic checks
    const interval = setInterval(() => {
      checkConnection();
      setCheckCount(prev => prev + 1);
    }, 30000); // Check every 30 seconds after that

    return () => {
      clearTimeout(quickCheck);
      clearInterval(interval);
    };
  }, [offlineMode]);

  // Show toast on disconnection
  useEffect(() => {
    if (status === 'disconnected' && checkCount > 0 && !offlineMode) {
      toast({
        title: 'Connection issue',
        description: 'You appear to be offline. Some features may be limited.',
        variant: 'destructive',
      });
    } else if (status === 'degraded' && checkCount > 0) {
      toast({
        title: 'Limited connectivity',
        description: 'The API server is unavailable. Using cached content only.',
        // Use default variant instead of warning
        variant: 'default',
      });
    }
  }, [status, checkCount, toast, offlineMode]);

  return (
    <ConnectionContext.Provider value={{ 
      status, 
      checkConnection, 
      isReachable,
      lastChecked, 
      offlineMode,
      setOfflineMode: handleSetOfflineMode 
    }}>
      {children}
    </ConnectionContext.Provider>
  );
}