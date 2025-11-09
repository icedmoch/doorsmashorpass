import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Mic, Volume2, VolumeX, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useSpeech } from "@/hooks/useSpeech";
import { supabase } from "@/integrations/supabase/client";
import { chatbotApi } from "@/lib/api";
import { User } from "@supabase/supabase-js";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type UserProfile = {
  dietary_preferences: string[];
  goals: string;
  goal_calories: number | null;
  goal_protein: number | null;
  goal_carbs: number | null;
  goal_fat: number | null;
};

const Chatbot = () => {
  const { toast } = useToast();
  const { isRecording, isPlaying, isProcessing, startRecording, stopRecording, playText, stopPlaying } = useSpeech();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // Fetch user profile if authenticated
      if (user) {
        supabase
          .from('profiles')
          .select('dietary_preferences, goals, goal_calories, goal_protein, goal_carbs, goal_fat')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setUserProfile(data);
            }
          });
      }
    });
  }, []);
  
  const suggestions = [
    "What's for lunch today?",
    "Show my nutrition totals",
    "Log a meal",
    "Show my recent orders",
    "Find high protein meals",
    "Track my meal history",
  ];
  
  const handleSend = async () => {
    if (!input.trim() || !user) {
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to use the chatbot",
          variant: "destructive",
        });
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Get user's location (optional)
      let userLocation;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        // Location is optional, continue without it
        userLocation = undefined;
      }

      // Call chatbot API
      const response = await chatbotApi.sendMessage({
        message: input,
        user_id: user.id,
        user_location: userLocation,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleVoiceRecording = async () => {
    try {
      const transcription = await startRecording((interimText) => {
        setInput(interimText);
      });
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
    if (playingMessageId === messageId) {
      stopPlaying();
      setPlayingMessageId(null);
      return;
    }

    stopPlaying();
    setPlayingMessageId(messageId);
    
    try {
      await playText(text);
      setPlayingMessageId(null);
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingMessageId(null);
      toast({
        title: "Error",
        description: "Failed to play audio. Please check your ElevenLabs API key.",
        variant: "destructive",
      });
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
                    onKeyPress={(e) => e.key === "Enter" && !isSending && handleSend()}
                    placeholder="Ask me anything about campus dining..."
                    className="flex-1 bg-background"
                    disabled={isSending || !user}
                  />
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className="flex-shrink-0"
                    onClick={isRecording ? stopRecording : handleVoiceRecording}
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
                    disabled={isSending || !user}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <Card className="p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-4 text-foreground">Your Preferences</h3>
              {userProfile ? (
                <div className="space-y-3">
                  {userProfile.dietary_preferences && userProfile.dietary_preferences.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Dietary Restrictions</p>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.dietary_preferences.map((pref, index) => (
                          <Badge key={index} variant="secondary">{pref}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(userProfile.goal_calories || userProfile.goals || userProfile.goal_protein) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Goals</p>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.goal_calories && (
                          <Badge className="bg-accent text-accent-foreground">
                            {userProfile.goal_calories} cal/day
                          </Badge>
                        )}
                        {userProfile.goal_protein && (
                          <Badge className="bg-accent text-accent-foreground">
                            {userProfile.goal_protein}g protein
                          </Badge>
                        )}
                        {userProfile.goals && (
                          <Badge className="bg-accent text-accent-foreground">
                            {userProfile.goals}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(!userProfile.dietary_preferences || userProfile.dietary_preferences.length === 0) && 
                   !userProfile.goal_calories && 
                   !userProfile.goals && (
                    <p className="text-sm text-muted-foreground">
                      No preferences set yet. Complete your profile to get personalized recommendations!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading preferences...</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
