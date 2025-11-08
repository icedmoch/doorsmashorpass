import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./ui/command";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export const LocationPicker = ({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) => {
  const [address, setAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search for suggestions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchAddress.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(data && data.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchAddress]);

  const handleSelectSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const displayAddress = suggestion.display_name;

    setAddress(displayAddress);
    setSearchAddress(displayAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(lat, lng, displayAddress);
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        const displayAddress = location.display_name;
        
        setAddress(displayAddress);
        onLocationSelect(lat, lng, displayAddress);
      } else {
        alert("Location not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Delivery Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 relative">
          <Label htmlFor="address">Campus Address or Building Name</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="address"
                placeholder="e.g., Main Library, Smith Hall Room 302, Student Center"
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value);
                  setAddress("");
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {suggestions.map((suggestion, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => handleSelectSuggestion(suggestion)}
                            className="cursor-pointer"
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            <span className="text-sm">{suggestion.display_name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </Card>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchAddress.trim()}
              size="icon"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Start typing to see suggestions, then click to select
          </p>
        </div>

        {address && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-1">Selected Delivery Location:</p>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {address}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
