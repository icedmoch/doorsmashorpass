import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, UtensilsCrossed, Apple, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    navigate("/");
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/student/nutrition" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Campus Eats
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/student/nutrition"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                isActive("/student/nutrition")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Apple className="h-4 w-4" />
              <span>Nutrition</span>
            </Link>
            <Link
              to="/student/menu"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                isActive("/student/menu")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>Menu</span>
            </Link>
            <Link
              to="/student/chatbot"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                isActive("/student/chatbot")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </Link>
          </div>
          
          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Student" alt="Student" />
              <AvatarFallback className="bg-primary text-primary-foreground">ST</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-around border-t border-border py-2">
          <Link
            to="/student/nutrition"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive("/student/nutrition")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Apple className="h-5 w-5" />
            <span className="text-xs font-medium">Nutrition</span>
          </Link>
          <Link
            to="/student/menu"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive("/student/menu")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-xs font-medium">Menu</span>
          </Link>
          <Link
            to="/student/chatbot"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              isActive("/student/chatbot")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs font-medium">Chat</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
