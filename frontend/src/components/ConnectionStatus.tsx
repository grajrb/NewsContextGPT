import { useEffect, useState } from 'react';
import { useConnection } from './ConnectionProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ConnectionStatus = () => {
  const { status, checkConnection, lastChecked, offlineMode, setOfflineMode } = useConnection();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Always show when disconnected or in degraded mode
    if (status === 'disconnected' || status === 'degraded' || offlineMode) {
      setVisible(true);
    } else if (status === 'connected') {
      // Hide after a delay when connected
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status, offlineMode]);

  // Make sure the indicator is visible on hover
  const handleMouseEnter = () => {
    setVisible(true);
  };

  // Don't hide immediately when mouse leaves
  const handleMouseLeave = () => {
    if (status === 'connected' && !offlineMode) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  };

  const handleRetry = async () => {
    await checkConnection();
  };

  // Effect to force visibility when disconnected
  useEffect(() => {
    if (status === 'disconnected') {
      setVisible(true);
    }
  }, [status]);

  // Return a minimized version when not visible
  if (!visible && !offlineMode && status === 'connected') {
    return (
      <div 
        className="fixed bottom-6 left-6 z-40 opacity-50 hover:opacity-100 transition-opacity"
        onMouseEnter={handleMouseEnter}
      >
        <Badge variant="success" className="w-4 h-4 p-0 rounded-full" />
      </div>
    );
  }

  const getStatusDetails = () => {
    switch (status) {
      case 'connected':
        return {
          variant: 'success',
          icon: <span className="h-2 w-2 rounded-full bg-green-500"></span>,
          text: 'Connected',
          tooltip: 'Your application is fully connected'
        };
      case 'degraded':
        return {
          variant: 'default',
          icon: <span className="h-2 w-2 rounded-full bg-yellow-500"></span>,
          text: 'Limited Connectivity',
          tooltip: 'API server unavailable. Some features may not work.'
        };
      case 'connecting':
        return {
          variant: 'default',
          icon: <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>,
          text: 'Connecting...',
          tooltip: 'Checking connection status...'
        };
      case 'disconnected':
      default:
        return {
          variant: 'destructive',
          icon: <span className="h-2 w-2 rounded-full bg-red-500"></span>,
          text: offlineMode ? 'Offline Mode' : 'Offline · Click to retry',
          tooltip: offlineMode 
            ? 'You have enabled offline mode' 
            : 'Your application is disconnected'
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div 
      className="fixed bottom-6 left-6 z-40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col space-y-2">
              <Badge 
                variant={statusDetails.variant as any}
                className={`cursor-pointer ${offlineMode ? 'opacity-80' : ''}`}
                onClick={offlineMode ? undefined : handleRetry}
              >
                <span className="flex items-center space-x-1">
                  {statusDetails.icon}
                  <span>{statusDetails.text}</span>
                </span>
              </Badge>
              
              {(status === 'disconnected' || offlineMode) && (
                <div className="bg-card p-2 rounded-md shadow-sm flex items-center justify-between space-x-2">
                  <Label htmlFor="offline-mode" className="text-xs cursor-pointer">
                    Offline Mode
                  </Label>
                  <Switch
                    id="offline-mode"
                    checked={offlineMode}
                    onCheckedChange={setOfflineMode}
                  />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs">
              <p>{statusDetails.tooltip}</p>
              {lastChecked && (
                <p className="text-gray-400 mt-1">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ConnectionStatus;