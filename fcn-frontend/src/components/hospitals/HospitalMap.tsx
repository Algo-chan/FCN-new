import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { clsx } from "clsx";
import { useTheme } from "@/hooks/useTheme";
import type { Hospital, OccupancyBand } from "@/types";

interface HospitalMapProps {
  hospitals: Hospital[];
  selectedId?: string | null;
  onSelect?: (hospital: Hospital) => void;
  height?: number;
  single?: boolean;
  className?: string;
}

const bandColors: Record<OccupancyBand, string> = {
  low: "#10B981",
  moderate: "#FBBF24",
  high: "#F87171"
};

const createCustomIcon = (band: OccupancyBand) => {
  const color = bandColors[band];
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;background:#0A7EA4;border:3px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const AnimatedMarkers = ({ hospitals, onSelect }: { hospitals: Hospital[]; onSelect?: (h: Hospital) => void }) => {
  const map = useMap();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {hospitals.map((h, i) => {
        if (!h.lat || !h.lng) {
          return null;
        }
        return (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={createCustomIcon(h.occupancy_band)}
            opacity={visible ? 1 : 0}
          >
            <Popup>
              <div className="text-sm">
                <strong>{h.name}</strong>
                <br />
                Occupancy: {h.occupancy_percent}% ({h.occupancy_band})
                <br />
                {onSelect && (
                  <button
                    onClick={() => onSelect(h)}
                    className="mt-1 text-fcn-primary hover:underline"
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const DarkModeFilter = () => {
  const { isDark } = useTheme();
  const map = useMap();

  useEffect(() => {
    const pane = map.getPane("tilePane");
    if (pane) {
      pane.style.filter = isDark
        ? "invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.85)"
        : "";
    }
  }, [isDark, map]);

  return null;
};

const FlyToSelected = ({ selectedId, hospitals }: { selectedId?: string | null; hospitals: Hospital[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const hospital = hospitals.find((h) => h.id === selectedId);
    if (hospital?.lat && hospital?.lng) {
      map.flyTo([hospital.lat, hospital.lng], 15, { duration: 0.8 });
    }
  }, [selectedId, hospitals, map]);

  return null;
};

const MapFallback = ({ height }: { height: number }) => (
  <div
    className="flex items-center justify-center rounded-2xl bg-fcn-primary/5"
    style={{ height }}
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-fcn-primary border-r-transparent" />
  </div>
);

export const HospitalMap = ({
  hospitals,
  selectedId,
  onSelect,
  height = 400,
  single = false,
  className
}: HospitalMapProps) => {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const center: [number, number] = single && hospitals.length === 1 && hospitals[0]?.lat && hospitals[0]?.lng
    ? [hospitals[0].lat, hospitals[0].lng]
    : [9.5931, 41.8661];

  const zoom = single ? 15 : 13;

  const validHospitals = useMemo(
    () => hospitals.filter((h) => h.lat != null && h.lng != null),
    [hospitals]
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <MapFallback height={height} />;
  }

  return (
    <div
      ref={containerRef}
      className={clsx("overflow-hidden rounded-2xl", className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <DarkModeFilter />
        <AnimatedMarkers hospitals={validHospitals} onSelect={onSelect} />
        <FlyToSelected selectedId={selectedId} hospitals={validHospitals} />
      </MapContainer>
    </div>
  );
};
