import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { MapPin, Search } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export const LocationPicker = ({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) => {
  const [address, setAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      // Use OpenStreetMap Nominatim API for geocoding
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

  const handleManualCoordinates = () => {
    // Default to a campus location (you can adjust these coordinates)
    const defaultLat = initialLat || 40.7128;
    const defaultLng = initialLng || -74.0060;
    const manualAddress = searchAddress || "Campus Location";
    
    setAddress(manualAddress);
    onLocationSelect(defaultLat, defaultLng, manualAddress);
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
        <div className="space-y-2">
          <Label htmlFor="address">Campus Address or Building Name</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              placeholder="e.g., Main Library, Smith Hall Room 302, Student Center"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchAddress.trim()}
              size="icon"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a building name or campus address and click search
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

        {!address && (
          <Button 
            onClick={handleManualCoordinates}
            variant="outline"
            className="w-full"
          >
            Use Current Location Input as Address
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
