import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mic, Volume2, Loader2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
};

const Chatbot = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey there! 👋 I'm your campus dining assistant. I can help you find meals that match your dietary needs, suggest healthy options, or just chat about food. What are you craving?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const suggestions = [
    "Show me vegetarian grab-and-go",
    "Under 500 calories",
    "High protein meals",
    "Gluten-free options",
  ];

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const generateAudio = async (messageId: string, text: string) => {
    setLoadingAudio(messageId);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, audioUrl } : msg
        ));
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAudio(null);
    }
  };

  const playAudio = async (messageId: string, audioUrl: string) => {
    if (playingMessageId === messageId) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlayingMessageId(null);
      await audioRef.current.play();
      setPlayingMessageId(messageId);
    }
  };
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setInput("");
    
    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Great choice! Let me find some options for you. I found 5 meals that match your preferences...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b border-border px-6 pt-4">
                  <TabsList className="w-full max-w-md">
                    <TabsTrigger value="text" className="flex-1">Text Chat</TabsTrigger>
                    <TabsTrigger value="audio" className="flex-1">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Audio Messages
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="text" className="flex-1 flex flex-col m-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-slide-in",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        AI
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                        U
                      </div>
                    )}
                  </div>
                    ))}
                  </div>
                  
                  {/* Suggestions */}
                  <div className="px-6 pb-4">
                <div className="flex gap-2 flex-wrap">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted transition-colors px-3 py-1.5"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                    ))}
                  </div>
                  </div>
                  
                  {/* Input Area */}
                  <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask me anything about campus dining..."
                      className="flex-1 bg-background"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="flex-1 flex flex-col m-0">
                  {/* Audio Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.filter(msg => msg.role === "assistant").map((message) => (
                      <div key={message.id} className="flex gap-3 animate-slide-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          AI
                        </div>
                        <div className="flex-1 rounded-2xl px-4 py-3 shadow-sm bg-card border border-border">
                          <p className="text-sm leading-relaxed mb-3">{message.content}</p>
                          <div className="flex items-center gap-2">
                            {!message.audioUrl && !loadingAudio && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateAudio(message.id, message.content)}
                                className="gap-2"
                              >
                                <Volume2 className="h-3 w-3" />
                                Generate Audio
                              </Button>
                            )}
                            {loadingAudio === message.id && (
                              <Button variant="outline" size="sm" disabled className="gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating...
                              </Button>
                            )}
                            {message.audioUrl && (
                              <Button
                                variant={playingMessageId === message.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => playAudio(message.id, message.audioUrl!)}
                                className="gap-2"
                              >
                                {playingMessageId === message.id ? (
                                  <>
                                    <Pause className="h-3 w-3" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3" />
                                    Play
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs opacity-60 mt-2">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <Card className="p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Your Preferences</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dietary Restrictions</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Vegetarian</Badge>
                    <Badge variant="secondary">Nut Allergy</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Goals</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-accent text-accent-foreground">2000 cal/day</Badge>
                    <Badge className="bg-accent text-accent-foreground">High Protein</Badge>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Clear conversation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View meal history
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
