import { MapPin } from "lucide-react";

interface DeliveryMapProps {
  lat: number;
  lng: number;
  address: string;
}

export const DeliveryMap = ({ lat, lng, address }: DeliveryMapProps) => {
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

  return (
    <div className="space-y-3">
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
