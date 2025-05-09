import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface ConnectionContextType {
  status: ConnectionStatus;
  checkConnection: () => Promise<boolean>;
  lastChecked: Date | null;
}

const ConnectionContext = createContext<ConnectionContextType>({
  status: 'connecting',
  checkConnection: async () => false,
  lastChecked: null
});

export const useConnection = () => useContext(ConnectionContext);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const { toast } = useToast();

  const checkConnection = async (): Promise<boolean> => {
    try {
      // Try a simple API request to check if the server is reachable
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        },
        // Set a timeout to avoid hanging requests
        signal: AbortSignal.timeout(5000) 
      });
      
      const connected = response.ok;
      setStatus(connected ? 'connected' : 'disconnected');
      setLastChecked(new Date());
      return connected;
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
      setLastChecked(new Date());
      return false;
    }
  };

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, []);

  // Periodic connection check
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
      setCheckCount(prev => prev + 1);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Show toast on disconnection
  useEffect(() => {
    if (status === 'disconnected' && checkCount > 0) {
      toast({
        title: 'Connection issue',
        description: 'You appear to be offline. Some features may be limited.',
        variant: 'destructive',
      });
    }
  }, [status, checkCount, toast]);

  return (
    <ConnectionContext.Provider value={{ status, checkConnection, lastChecked }}>
      {children}
    </ConnectionContext.Provider>
  );
}