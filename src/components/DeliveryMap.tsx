import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DeliveryMapProps {
  lat: number;
  lng: number;
  address: string;
}

export const DeliveryMap = ({ lat, lng, address }: DeliveryMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamically import map components only on client side
    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const { MapContainer, TileLayer, Marker, Popup } = await import("react-leaflet");
        
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

        const position: [number, number] = [lat, lng];

        // Create the map component
        const Map = () => (
          <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}>
              <Popup>{address}</Popup>
            </Marker>
          </MapContainer>
        );

        setMapComponent(() => Map);
        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading map:", error);
      }
    };

    loadMap();
  }, [lat, lng, address]);

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
      {mapLoaded && MapComponent ? (
        <MapComponent />
      ) : (
        <div className="flex items-center justify-center h-full bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
