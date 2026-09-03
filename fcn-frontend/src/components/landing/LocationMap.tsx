import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Building2, HeartPulse, Stethoscope } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface Hub {
  name: string;
  short: string;
  coords: [number, number];
  icon: typeof Building2;
  hue: number;
  address: string;
  wait: string;
  doctors: number;
  specialties: string;
}

// Verified coordinates for real healthcare facilities in Dire Dawa (OpenStreetMap / Mapcarta).
const hubs: Hub[] = [
  {
    name: "Dil Chora Referral Hospital",
    short: "Referral",
    coords: [9.58808, 41.85952],
    icon: HeartPulse,
    hue: 170,
    address: "Kezira, Dire Dawa",
    wait: "~6 min",
    doctors: 38,
    specialties: "Referral · Maternity · ER",
  },
  {
    name: "Delt General Hospital",
    short: "Private · General",
    coords: [9.59952, 41.84032],
    icon: Building2,
    hue: 190,
    address: "Sabian, Goro · near New Bus Station",
    wait: "~4 min",
    doctors: 42,
    specialties: "General · Surgery · 24/7",
  },
  {
    name: "Yemariam Work Hospital",
    short: "Public · General",
    coords: [9.59953, 41.84027],
    icon: Stethoscope,
    hue: 200,
    address: "Sabian, Goro · Dire Dawa",
    wait: "~5 min",
    doctors: 31,
    specialties: "General · Outpatient · 24/7",
  },
  {
    name: "Sabian General Hospital",
    short: "Public · General",
    coords: [9.60017, 41.84542],
    icon: Stethoscope,
    hue: 180,
    address: "University area, Dire Dawa",
    wait: "~7 min",
    doctors: 29,
    specialties: "General · Public",
  },
];

const createHubIcon = (hub: Hub) =>
  L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:#0A7EA4;border:3px solid hsl(${hub.hue},72%,52%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px 2px hsla(${hub.hue},72%,55%,0.55);cursor:pointer"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

const HubMarkers = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {hubs.map((hub) => (
        <Marker key={hub.name} position={hub.coords} icon={createHubIcon(hub)} opacity={visible ? 1 : 0}>
          <Popup>
            <div
              className="text-sm"
              style={{ minWidth: "150px", fontFamily: "inherit" }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md"
                  style={{ backgroundColor: `hsla(${hub.hue}, 72%, 50%, 0.15)`, color: `hsl(${hub.hue}, 72%, 42%)` }}
                >
                  {hub.icon === HeartPulse && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  )}
                  {hub.icon === Building2 && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                  )}
                  {hub.icon === Stethoscope && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                  )}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-xs">{hub.name}</strong>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: `hsl(${hub.hue}, 72%, 42%)` }}>
                    {hub.short}
                  </span>
                </div>
              </div>
              <div className="mt-1 truncate text-[10px] text-gray-500">{hub.address}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-y-1 text-[10px] text-gray-500">
                <span>
                  <span className="font-semibold text-gray-700">{hub.doctors}</span> doctors
                </span>
                <span>
                  <span className="mr-0.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {hub.wait}
                </span>
                <span className="col-span-2 truncate text-gray-400">{hub.specialties}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
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

export const LocationMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const center: [number, number] = [9.594, 41.852];
  const zoom = 13;

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-fcn-primary/5 sm:h-80 lg:h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fcn-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-fcn-primary/10"
    >
      <div className="h-64 sm:h-80 lg:h-96">
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
          <HubMarkers />
        </MapContainer>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white/90 px-3 py-1.5 text-center text-xs font-medium text-fcn-text-light shadow backdrop-blur">
        {hubs.length} partner hospitals across{" "}
        <span className="text-fcn-primary">Dire Dawa</span> — tap a pin for details
      </div>
    </div>
  );
};
