import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Mic, Volume2, VolumeX, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useSpeech } from "@/hooks/useSpeech";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const Chatbot = () => {
  const { toast } = useToast();
  const { isRecording, isPlaying, isProcessing, startRecording, stopRecording, playText, stopPlaying } = useSpeech();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey there! 👋 I'm your campus dining assistant. I can help you find meals that match your dietary needs, suggest healthy options, or just chat about food. What are you craving?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const suggestions = [
    "Show me vegetarian grab-and-go",
    "Under 500 calories",
    "High protein meals",
    "Gluten-free options",
  ];
  
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

  const handleVoiceRecording = async () => {
    try {
      const transcription = await startRecording();
      if (transcription) {
        setInput(transcription);
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone or process speech. Please ensure microphone permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const playAudio = async (text: string, messageId: string) => {
    try {
      if (playingMessageId === messageId) {
        stopPlaying();
        setPlayingMessageId(null);
        return;
      }

      setPlayingMessageId(messageId);
      await playText(text);
      setPlayingMessageId(null);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio. Please check your ElevenLabs API key.",
        variant: "destructive",
      });
      setPlayingMessageId(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
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
                    <div className="flex items-start gap-2">
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
                      {message.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => playAudio(message.content, message.id)}
                        >
                          {playingMessageId === message.id ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
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
                {isRecording && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Listening... Speak now
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    disabled
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything about campus dining..."
                    className="flex-1 bg-background"
                  />
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className="flex-shrink-0"
                    onClick={handleVoiceRecording}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
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
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => playAudio("Testing ElevenLabs text to speech functionality.", "test")}
                >
                  Test TTS
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
