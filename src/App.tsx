import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Landing from "./pages/Landing";
import Chatbot from "./pages/Chatbot";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Nutrition from "./pages/Nutrition";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/student/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
            <Route path="/student/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
            <Route path="/student/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/student/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
