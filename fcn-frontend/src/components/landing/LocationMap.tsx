import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "@/hooks/useTheme";

interface Hub {
  name: string;
  short: string;
  kind: "hospital" | "pharmacy";
  coords: [number, number];
  hue: number;
  doctors: number;
  wait: string;
  address: string;
  specialties: string;
}

const IconMark = ({ kind, hue, size }: { kind: Hub["kind"]; hue: number; size: number }) => (
  <span
    className="flex items-center justify-center rounded-md"
    style={{ backgroundColor: `hsla(${hue}, 72%, 50%, 0.15)`, color: `hsl(${hue}, 72%, 42%)`, width: size, height: size }}
  >
    {kind === "hospital" ? (
      <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
    )}
  </span>
);

// Verified coordinates for real healthcare facilities in Dire Dawa (OpenStreetMap / Mapcarta).
const hubs: Hub[] = [
  {
    name: "Dil Chora Referral Hospital",
    short: "Referral",
    kind: "hospital",
    coords: [9.58808, 41.85952],
    hue: 170,
    address: "Kezira, Dire Dawa",
    wait: "~6 min",
    doctors: 38,
    specialties: "Referral · Maternity · ER",
  },
  {
    name: "Delt General Hospital",
    short: "Private · General",
    kind: "hospital",
    coords: [9.59952, 41.84032],
    hue: 190,
    address: "Sabian, Goro · near New Bus Station",
    wait: "~4 min",
    doctors: 42,
    specialties: "General · Surgery · 24/7",
  },
  {
    name: "Yemariam Work Hospital",
    short: "Public · General",
    kind: "hospital",
    coords: [9.59953, 41.84027],
    hue: 200,
    address: "Sabian, Goro · Dire Dawa",
    wait: "~5 min",
    doctors: 31,
    specialties: "General · Outpatient · 24/7",
  },
  {
    name: "Art Hospital",
    short: "Private · General",
    kind: "hospital",
    coords: [9.5995, 41.84942],
    hue: 160,
    address: "near Dire Mall · Dire Dawa",
    wait: "~5 min",
    doctors: 26,
    specialties: "General · Clinic",
  },
  {
    name: "Number One Health Center",
    short: "Public · Clinic",
    kind: "hospital",
    coords: [9.60452, 41.86506],
    hue: 210,
    address: "near Millennium Park · Dire Dawa",
    wait: "~7 min",
    doctors: 22,
    specialties: "Primary care · Clinic",
  },
  {
    name: "Sabian General Hospital",
    short: "Public · General",
    kind: "hospital",
    coords: [9.6, 41.84667],
    hue: 180,
    address: "University area · Dire Dawa",
    wait: "~7 min",
    doctors: 29,
    specialties: "General · Public",
  },
  {
    name: "Abera Pharmacy",
    short: "Pharmacy",
    kind: "pharmacy",
    coords: [9.58876, 41.85979],
    hue: 140,
    address: "near Dil Chora · Dire Dawa",
    wait: "~0 min",
    doctors: 0,
    specialties: "Medicines · Prescriptions",
  },
  {
    name: "HIKMA Pharmacy",
    short: "Pharmacy · 24/7",
    kind: "pharmacy",
    coords: [9.60501, 41.83939],
    hue: 145,
    address: "near Seido Market Center · Dire Dawa",
    wait: "~0 min",
    doctors: 0,
    specialties: "Medicines · Prescriptions",
  },
  {
    name: "Alfa Pharmacy",
    short: "Pharmacy",
    kind: "pharmacy",
    coords: [9.59853, 41.87032],
    hue: 150,
    address: "Dire Dawa city",
    wait: "~0 min",
    doctors: 0,
    specialties: "Medicines · Prescriptions",
  },
];

const createHubIcon = (hub: Hub) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${hub.kind === "pharmacy" ? 26 : 32}px;height:${hub.kind === "pharmacy" ? 26 : 32}px;background:#0A7EA4;border:3px solid hsl(${hub.hue},72%,52%);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px 2px hsla(${hub.hue},72%,55%,0.55);cursor:pointer">${
      hub.kind === "pharmacy"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>`
    }</div>`,
    iconSize: hub.kind === "pharmacy" ? [26, 26] : [32, 32],
    iconAnchor: hub.kind === "pharmacy" ? [13, 13] : [16, 16],
    popupAnchor: [0, hub.kind === "pharmacy" ? -16 : -18],
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
            <div className="text-sm" style={{ minWidth: "150px", fontFamily: "inherit" }}>
              <div className="mb-1 flex items-center gap-1.5">
                <IconMark kind={hub.kind} hue={hub.hue} size={18} />
                <div className="min-w-0">
                  <strong className="block truncate text-xs">{hub.name}</strong>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: `hsl(${hub.hue}, 72%, 42%)` }}>
                    {hub.short}
                  </span>
                </div>
              </div>
              <div className="mt-1 truncate text-[10px] text-gray-500">{hub.address}</div>
              {hub.kind === "hospital" ? (
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
              ) : (
                <div className="mt-1.5 text-[10px] text-gray-400">{hub.specialties}</div>
              )}
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

const FitBounds = () => {
  const map = useMap();

  useEffect(() => {
    const coords = hubs.map((h) => [h.coords[0], h.coords[1]] as [number, number]);
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [15, 15], maxZoom: 18 });
  }, [map]);

  return null;
};

const byName = (name: string) => hubs.find((h) => h.name === name)?.coords;
const DI = "#2DD4BF";

// Connect every hospital/pharmacy to Dil Chora as the referral hub, plus a ring
// between the public hospitals so the network reads clearly.
const networkLines: Array<{ from: string; to: string }> = [
  { from: "Dil Chora Referral Hospital", to: "Delt General Hospital" },
  { from: "Dil Chora Referral Hospital", to: "Yemariam Work Hospital" },
  { from: "Dil Chora Referral Hospital", to: "Art Hospital" },
  { from: "Dil Chora Referral Hospital", to: "Number One Health Center" },
  { from: "Dil Chora Referral Hospital", to: "Sabian General Hospital" },
  { from: "Dil Chora Referral Hospital", to: "Abera Pharmacy" },
  { from: "Dil Chora Referral Hospital", to: "HIKMA Pharmacy" },
  { from: "Dil Chora Referral Hospital", to: "Alfa Pharmacy" },
  { from: "Delt General Hospital", to: "Yemariam Work Hospital" },
  { from: "Delt General Hospital", to: "HIKMA Pharmacy" },
  { from: "Art Hospital", to: "Sabian General Hospital" },
  { from: "Sabian General Hospital", to: "Alfa Pharmacy" },
  { from: "Number One Health Center", to: "Alfa Pharmacy" },
];

// Quadratic bezier so each connection arcs in a chosen direction (relative to
// the map: north, east or west), reading like the network is live with the
// connection moving through the air. The dot follows the exact same curve.
const quadraticPoint = (from: [number, number], to: [number, number], control: [number, number], t: number): [number, number] => {
  const u = 1 - t;
  return [
    u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
    u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
  ];
};

const lineGeometry = (from: [number, number], to: [number, number], factor: number, outward: [number, number]) => {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  // Bulge the control point outward, away from the network centroid, so lines
  // bow around the outside of the cluster instead of cutting through it.
  const dist = len * 0.4 * factor;
  const control: [number, number] = [midLat + outward[0] * dist, midLng + outward[1] * dist];
  const steps = 48;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    points.push(quadraticPoint(from, to, control, i / steps));
  }
  return { control, points };
};

interface CurvedLine {
  from: [number, number];
  to: [number, number];
  control: [number, number];
  points: Array<[number, number]>;
}

// Network centroid (latitude-scaled for even longitude spacing), used so lines
// bow outward away from the middle of the map.
const netMidLat = hubs.reduce((sum, h) => sum + h.coords[0], 0) / hubs.length;
const netMidLng = hubs.reduce((sum, h) => sum + h.coords[1], 0) / hubs.length;
const netCos = Math.cos((netMidLat * Math.PI) / 180) || 1;

const curvedLines: CurvedLine[] = (() => {
  const out: Array<CurvedLine | null> = [];
  networkLines.forEach((line, i) => {
    const from = byName(line.from);
    const to = byName(line.to);
    if (!from || !to) {
      out.push(null);
      return;
    }
    let factor = 0.9 + (i % 4) * 0.15;
    // Outward unit direction pointing from the network center to this line's
    // midpoint, so every line bulges away from the cluster (cuts cross the
    // outside). Added a tiny lateral bias so neighboring lines fan apart.
    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    let rx = midLat - netMidLat;
    let ry = (midLng - netMidLng) * netCos;
    const rLen = Math.hypot(rx, ry) || 1;
    rx /= rLen;
    ry /= rLen;
    const lateral = i % 2 === 0 ? 1 : -1;
    const outward: [number, number] = [
      rx * 0.85 + -ry * 0.15 * lateral,
      (ry * 0.85 + rx * 0.15 * lateral) / netCos,
    ];
    out.push({ from, to, ...lineGeometry(from, to, factor, outward) });
  });
  return out.filter((l): l is CurvedLine => l !== null);
})();

const NetworkLines = () => (
  <>
    {curvedLines.map((line, i) => (
      <Polyline
        key={i}
        positions={line.points}
        pathOptions={{
          color: DI,
          weight: 2.6,
          opacity: 0.7,
          interactive: false,
        }}
      />
    ))}
  </>
);

const dotIcon = L.divIcon({
  className: "",
  html: `<div style="width:9px;height:9px;background:#FFFFFF;border:2px solid ${DI};border-radius:50%;box-shadow:0 0 8px 2px hsla(171,72%,55%,0.8);"></div>`,
  iconSize: [9, 9],
  iconAnchor: [4, 4],
});

const TravelingDots = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const duration = 4000;
    const loop = (now: number) => {
      const t = ((now - start) % duration) / duration;
      setProgress(t);
      raf = requestAnimationFrame(loop);
    };
    if (!reduceMotion) {
      raf = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {curvedLines.map((line, i) => {
        // Stagger each line and alternate direction so packets flow both ways.
        const offset = (i * 0.13) % 1;
        const dir = i % 2 === 0 ? 1 : -1;
        const raw = (progress * dir + offset) % 1;
        const t = raw < 0 ? raw + 1 : raw;
        const position = quadraticPoint(line.from, line.to, line.control, t);
        return <Marker key={i} position={position} icon={dotIcon} interactive={false} keyboard={false} zIndexOffset={500} />;
      })}
    </>
  );
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
      <div className="flex h-72 items-center justify-center rounded-2xl bg-fcn-primary/5 sm:h-96 lg:h-[440px] xl:h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fcn-primary border-r-transparent" />
      </div>
    );
  }

  const hospitals = hubs.filter((h) => h.kind === "hospital").length;
  const pharmacies = hubs.length - hospitals;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-fcn-primary/10"
    >
      <div className="h-72 sm:h-96 lg:h-[440px] xl:h-[500px]">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds />
          <DarkModeFilter />
          <NetworkLines />
          <TravelingDots />
          <HubMarkers />
        </MapContainer>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-center text-xs font-medium text-fcn-text-light shadow backdrop-blur">
        {hospitals} hospitals + {pharmacies} pharmacies across{" "}
        <span className="text-fcn-primary">Dire Dawa</span> — tap a pin for details
      </div>
    </div>
  );
};
