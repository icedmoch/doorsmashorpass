import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from "react";

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryMapProps {
  lat: number;
  lng: number;
  address: string;
}

export const DeliveryMap = ({ lat, lng, address }: DeliveryMapProps) => {
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  const position: [number, number] = [lat, lng];

  useEffect(() => {
    // Force a resize event after the map is rendered
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className="space-y-3 relative z-0">
      <div className="p-4 bg-muted/50 border rounded-lg">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm mb-1">Delivery Location</p>
            <p className="text-sm text-muted-foreground">{address}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        </div>
        
        <div className="h-[300px] w-full rounded-lg overflow-hidden mb-3 relative z-0">
          <MapContainer 
            center={position} 
            zoom={15} 
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                {address}
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <MapPin className="h-4 w-4" />
          View on OpenStreetMap
        </a>
      </div>
    </div>
  );
};