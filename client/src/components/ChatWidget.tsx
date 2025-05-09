import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { sendMessage, clearChat, getChatHistory } from "@/lib/chat";

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  sources?: string[];
  timestamp: Date;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(nanoid(8));
    }
  }, [sessionId]);

  // Initialize welcome message
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      setMessages([
        {
          id: nanoid(),
          content: "Hello! I'm your news assistant powered by AI. I can answer questions about current news events. What would you like to know?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [sessionId, messages.length]);

  // Fetch chat history when session changes
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat', sessionId],
    queryFn: () => getChatHistory(sessionId),
    enabled: !!sessionId && isOpen,
  });

  // Update messages when chat history changes
  useEffect(() => {
    if (chatHistory?.messages && chatHistory.messages.length > 0) {
      const formattedMessages = chatHistory.messages.map((msg: any) => ({
        id: nanoid(),
        content: msg.content,
        isUser: msg.isUser,
        sources: msg.sources ? JSON.parse(msg.sources) : undefined,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    }
  }, [chatHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return sendMessage(sessionId, message);
    },
    onSuccess: (data) => {
      // Add bot message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          content: data.message,
          isUser: false,
          sources: data.sources,
          timestamp: new Date(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return clearChat(sessionId);
    },
    onSuccess: () => {
      // Reset to only welcome message
      setMessages([
        {
          id: nanoid(),
          content: "Hello! I'm your news assistant powered by AI. I can answer questions about current news events. What would you like to know?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId] });
      
      toast({
        title: "Chat cleared",
        description: "Your chat history has been cleared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to clear chat: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: nanoid(),
        content: inputValue,
        isUser: true,
        timestamp: new Date(),
      },
    ]);

    // Send message to API
    sendMessageMutation.mutate(inputValue);

    // Clear input
    setInputValue("");
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleClearChat = () => {
    clearChatMutation.mutate();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {isOpen && (
        <Card className="bg-white rounded-lg shadow-lg w-96 max-w-full mb-4 flex flex-col overflow-hidden h-[500px]">
          <CardHeader className="bg-primary-500 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M7 16.3c0-1 .8-2.1 2.2-2.7C10.5 13 11.3 13 12 13c.7 0 1.5 0 2.8.6 1.4.6 2.2 1.7 2.2 2.7"></path>
              </svg>
              <h3 className="font-semibold">News Assistant</h3>
            </div>
            <div className="flex">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClearChat} 
                disabled={clearChatMutation.isPending}
                className="text-white hover:text-neutral-200 mr-3 h-7 w-7"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                <span className="sr-only">Clear chat</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleChat} 
                className="text-white hover:text-neutral-200 h-7 w-7"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
                <span className="sr-only">Close chat</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div 
                key={message.id}
                className={`animate-in fade-in-50 duration-300 ${index > 0 ? 'mt-4' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {message.isUser ? (
                  <div className="flex items-start justify-end">
                    <div className="bg-primary-50 rounded-lg py-2 px-3 max-w-[85%]">
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <div className="flex-shrink-0 bg-gray-400 rounded-full w-8 h-8 flex items-center justify-center text-white ml-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-primary-500 rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="10" r="3"></circle>
                        <path d="M7 16.3c0-1 .8-2.1 2.2-2.7C10.5 13 11.3 13 12 13c.7 0 1.5 0 2.8.6 1.4.6 2.2 1.7 2.2 2.7"></path>
                      </svg>
                    </div>
                    <div className="bg-neutral-100 rounded-lg py-2 px-3 max-w-[85%]">
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Sources: {message.sources.length} articles</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <ul className="text-xs list-disc pl-4">
                                  {message.sources.map((source, i) => (
                                    <li key={i}>{source}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sendMessageMutation.isPending && (
              <div className="mt-4 flex items-start">
                <div className="flex-shrink-0 bg-primary-500 rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M7 16.3c0-1 .8-2.1 2.2-2.7C10.5 13 11.3 13 12 13c.7 0 1.5 0 2.8.6 1.4.6 2.2 1.7 2.2 2.7"></path>
                  </svg>
                </div>
                <div className="bg-neutral-100 rounded-lg py-2 px-3">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    <div className="h-2 w-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "400ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="border-t border-gray-200 p-3">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex">
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Ask about any news topic..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  className="bg-primary-500 text-white px-4 py-2 rounded-r-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  disabled={sendMessageMutation.isPending || !inputValue.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  Powered by RAG with Gemini. Session ID: <span className="font-mono ml-1">{sessionId}</span>
                </span>
              </div>
            </form>
          </CardFooter>
        </Card>
      )}
      
      {/* Chat toggle button */}
      <Button
        onClick={toggleChat}
        className="bg-primary-500 hover:bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </Button>
    </div>
  );
};

export default ChatWidget;
