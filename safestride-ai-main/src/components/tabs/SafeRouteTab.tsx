import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Shield, AlertTriangle, Locate } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Zone {
  lat: number;
  lng: number;
  radius: number;
  type: "safe" | "danger";
  label: string;
}

const MOCK_ZONES: Zone[] = [
  { lat: 28.6139, lng: 77.2090, radius: 300, type: "safe", label: "Police Station" },
  { lat: 28.6200, lng: 77.2150, radius: 250, type: "safe", label: "24/7 Hospital" },
  { lat: 28.6180, lng: 77.2050, radius: 200, type: "safe", label: "Fire Station" },
  { lat: 28.6100, lng: 77.2120, radius: 350, type: "danger", label: "Low Lighting Area" },
  { lat: 28.6160, lng: 77.2000, radius: 280, type: "danger", label: "Crime Hotspot" },
  { lat: 28.6220, lng: 77.2200, radius: 220, type: "danger", label: "Isolated Zone" },
];

const SAFE_ROUTE = [
  [28.6139, 77.2090],
  [28.6150, 77.2100],
  [28.6170, 77.2120],
  [28.6190, 77.2140],
  [28.6200, 77.2150],
  [28.6215, 77.2165],
  [28.6230, 77.2180],
];

const FAST_ROUTE = [
  [28.6139, 77.2090],
  [28.6120, 77.2100],
  [28.6100, 77.2120],
  [28.6110, 77.2150],
  [28.6140, 77.2170],
  [28.6180, 77.2190],
  [28.6230, 77.2180],
];

const SafeRouteTab = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [routeMode, setRouteMode] = useState<"safest" | "fastest">("safest");
  const [userPos, setUserPos] = useState<[number, number]>([28.6139, 77.2090]);
  const [surroundingStatus, setSurroundingStatus] = useState("Safe Zone — Well Lit Area");

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: userPos,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Add zones
    MOCK_ZONES.forEach((zone) => {
      L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: zone.type === "safe" ? "hsl(140, 70%, 45%)" : "hsl(0, 70%, 50%)",
        fillColor: zone.type === "safe" ? "hsl(140, 70%, 45%)" : "hsl(0, 70%, 50%)",
        fillOpacity: 0.15,
        weight: 1,
        opacity: 0.4,
      }).addTo(map).bindPopup(`<b>${zone.label}</b><br/>${zone.type === "safe" ? "✅ Safe Zone" : "⚠️ Caution Zone"}`);
    });

    // User location - pulsing blue dot
    const pulseIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:hsl(180,100%,50%);opacity:0.3;animation:pulse-ring 2s infinite;"></div>
        <div style="position:absolute;top:5px;left:5px;width:10px;height:10px;border-radius:50%;background:hsl(180,100%,50%);box-shadow:0 0 10px hsl(180,100%,50%);"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker(userPos, { icon: pulseIcon }).addTo(map);

    // Destination marker
    const destIcon = L.divIcon({
      className: "",
      html: `<div style="width:12px;height:12px;border-radius:50%;background:hsl(180,100%,50%);border:2px solid white;box-shadow:0 0 15px hsl(180,100%,50%);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    L.marker([28.6230, 77.2180], { icon: destIcon }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw route based on mode
  useEffect(() => {
    if (!routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    const coords = routeMode === "safest" ? SAFE_ROUTE : FAST_ROUTE;
    const otherCoords = routeMode === "safest" ? FAST_ROUTE : SAFE_ROUTE;

    // Draw inactive route (gray)
    L.polyline(otherCoords as [number, number][], {
      color: "hsl(215, 15%, 40%)",
      weight: 3,
      opacity: 0.4,
      dashArray: "8, 8",
    }).addTo(routeLayerRef.current!);

    // Draw active route
    L.polyline(coords as [number, number][], {
      color: routeMode === "safest" ? "hsl(180, 100%, 50%)" : "hsl(45, 100%, 50%)",
      weight: 4,
      opacity: 0.9,
    }).addTo(routeLayerRef.current!);

    setSurroundingStatus(
      routeMode === "safest"
        ? "Safe Zone — Well Lit Area • Near Police Station"
        : "Caution — Passing Low Light Area"
    );
  }, [routeMode]);

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          mapInstanceRef.current?.setView(newPos, 15);
        },
        () => {
          // Use mock position
        }
      );
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Route mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setRouteMode("safest")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-rubik text-sm font-medium transition-all ${
            routeMode === "safest"
              ? "bg-primary/15 text-primary border border-primary/30 glow-cyan"
              : "bg-card border border-border text-muted-foreground"
          }`}
        >
          <Shield className="w-4 h-4" />
          Safest Route
        </button>
        <button
          onClick={() => setRouteMode("fastest")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-rubik text-sm font-medium transition-all ${
            routeMode === "fastest"
              ? "bg-accent/15 text-accent border border-accent/30"
              : "bg-card border border-border text-muted-foreground"
          }`}
        >
          <Navigation className="w-4 h-4" />
          Fastest Route
        </button>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: "55vh" }}>
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Locate button */}
        <button
          onClick={handleLocate}
          className="absolute top-3 right-3 z-[1000] w-10 h-10 rounded-xl glass flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(140, 70%, 45%)", opacity: 0.6 }} />
            <span className="font-mono-data text-[9px] text-foreground/70">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0, 70%, 50%)", opacity: 0.6 }} />
            <span className="font-mono-data text-[9px] text-foreground/70">Caution Zone</span>
          </div>
        </div>
      </div>

      {/* Live Surroundings Status */}
      <motion.div
        key={surroundingStatus}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-4 border ${
          routeMode === "safest"
            ? "bg-primary/5 border-primary/20"
            : "bg-accent/5 border-accent/20"
        }`}
      >
        <div className="flex items-center gap-3">
          {routeMode === "safest" ? (
            <MapPin className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-accent shrink-0" />
          )}
          <div>
            <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Live Surroundings
            </p>
            <p className="font-rubik text-sm text-foreground mt-0.5">{surroundingStatus}</p>
          </div>
        </div>
      </motion.div>

      {/* Route stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ETA", value: routeMode === "safest" ? "14 min" : "9 min" },
          { label: "Safety", value: routeMode === "safest" ? "96%" : "72%" },
          { label: "Lit Path", value: routeMode === "safest" ? "92%" : "54%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="font-mono-data text-lg text-primary font-medium">{stat.value}</p>
            <p className="font-mono-data text-[9px] text-muted-foreground tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafeRouteTab;
