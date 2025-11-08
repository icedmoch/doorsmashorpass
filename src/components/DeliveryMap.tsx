import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryMapProps {
  lat: number;
  lng: number;
  address: string;
}

export const DeliveryMap = ({ lat, lng, address }: DeliveryMapProps) => {
  const position: [number, number] = [lat, lng];

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
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
    </div>
  );
};
