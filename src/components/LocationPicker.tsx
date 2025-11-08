import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2 } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export const LocationPicker = ({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) => {
  const [address, setAddress] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamically import map components only on client side
    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const { MapContainer, TileLayer, Marker, useMapEvents } = await import("react-leaflet");
        
        // Fix default marker icon
        const icon = (await import('leaflet/dist/images/marker-icon.png')).default;
        const iconShadow = (await import('leaflet/dist/images/marker-shadow.png')).default;

        const DefaultIcon = L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        L.Marker.prototype.options.icon = DefaultIcon;

        // Create LocationMarker component
        function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
          const [position, setPosition] = useState<L.LatLng | null>(null);

          useMapEvents({
            click(e: any) {
              setPosition(e.latlng);
              onSelect(e.latlng.lat, e.latlng.lng);
            },
          });

          return position === null ? null : <Marker position={position} />;
        }

        const defaultCenter: [number, number] = [initialLat || 40.7128, initialLng || -74.0060];

        const handleLocationClick = async (lat: number, lng: number) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const locationAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(locationAddress);
            onLocationSelect(lat, lng, locationAddress);
          } catch (error) {
            console.error("Error fetching address:", error);
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(fallbackAddress);
            onLocationSelect(lat, lng, fallbackAddress);
          }
        };

        // Create the map component
        const Map = () => (
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker onSelect={handleLocationClick} />
          </MapContainer>
        );

        setMapComponent(() => Map);
        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };

    loadMap();
  }, [initialLat, initialLng, onLocationSelect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Delivery Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click on the map to select your delivery location
        </p>
        <div className="h-[400px] w-full rounded-lg overflow-hidden border">
          {mapLoaded && MapComponent ? (
            <MapComponent />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {address && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Selected Location:</p>
            <p className="text-sm text-muted-foreground">{address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
