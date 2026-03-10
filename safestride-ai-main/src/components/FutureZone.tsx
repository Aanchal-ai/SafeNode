import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, ChevronRight, Route, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface RouteOption {
  id: number;
  name: string;
  safety: number;
  time: string;
  distance: string;
  lit: string;
}

interface FutureZoneProps {
  onStartWalk: (route: RouteOption) => void;
  activeRoute: RouteOption | null;
  onStopWalk: () => void;
}

const generateRoutes = (destination: string): RouteOption[] => {
  // Generate pseudo-random but deterministic routes based on destination
  const hash = destination.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return [
    {
      id: 1,
      name: `Via ${["Main St", "Broadway", "1st Ave", "Oak Blvd"][hash % 4]}`,
      safety: 85 + (hash % 15),
      time: `${8 + (hash % 10)} min`,
      distance: `${(0.4 + (hash % 12) * 0.1).toFixed(1)} mi`,
      lit: `${70 + (hash % 25)}%`,
    },
    {
      id: 2,
      name: `Via ${["Park Ave", "Elm St", "2nd Ave", "River Rd"][hash % 4]}`,
      safety: 65 + (hash % 20),
      time: `${6 + (hash % 8)} min`,
      distance: `${(0.3 + (hash % 8) * 0.1).toFixed(1)} mi`,
      lit: `${50 + (hash % 30)}%`,
    },
    {
      id: 3,
      name: `Via ${["Harbor Walk", "Lake Path", "Garden Way", "Canal St"][(hash + 1) % 4]}`,
      safety: 90 + (hash % 10),
      time: `${12 + (hash % 6)} min`,
      distance: `${(0.8 + (hash % 6) * 0.1).toFixed(1)} mi`,
      lit: `${85 + (hash % 15)}%`,
    },
  ];
};

const FutureZone = ({ onStartWalk, activeRoute, onStopWalk }: FutureZoneProps) => {
  const [expanded, setExpanded] = useState(false);
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  const handleSearch = useCallback(() => {
    if (destination.trim().length < 2) return;
    const generated = generateRoutes(destination);
    setRoutes(generated);
    setSelectedRoute(null);
    if (!expanded) setExpanded(true);
  }, [destination, expanded]);

  const handleSelectRoute = (route: RouteOption) => {
    setSelectedRoute(route);
  };

  const handleStartWalk = () => {
    if (!selectedRoute) {
      toast.error("Select a route first");
      return;
    }
    onStartWalk(selectedRoute);
    toast.success(`Walk started via ${selectedRoute.name}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="px-6 py-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4 text-muted-foreground" />
        <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.3em] uppercase">
          Safe Route Planning
        </p>
      </div>

      {/* Active walk indicator */}
      <AnimatePresence>
        {activeRoute && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-rubik text-sm text-foreground font-medium">
                  Walking: {activeRoute.name}
                </p>
                <p className="font-mono-data text-xs text-primary mt-1">
                  Safety: {activeRoute.safety}% • {activeRoute.time} remaining
                </p>
              </div>
              <button
                onClick={onStopWalk}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary"
              >
                <Square className="w-3 h-3" />
                <span className="font-mono-data text-xs">Stop</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <MapPin className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent font-rubik text-foreground placeholder:text-muted-foreground outline-none text-lg"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSearch();
            }}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono-data text-xs hover:bg-primary/20 transition-colors"
          >
            Search
          </button>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>

        <AnimatePresence>
          {expanded && routes.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Map */}
              <div className="mx-5 mb-4 h-40 rounded-lg bg-navy-mid border border-border relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-6 h-6 text-primary mx-auto mb-2 opacity-40" />
                    <p className="font-mono-data text-xs text-muted-foreground">
                      {destination}
                    </p>
                  </div>
                </div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 160">
                  <motion.path
                    d="M 40 130 Q 80 60, 150 80 T 260 30"
                    fill="none"
                    stroke="hsl(180 100% 50%)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    filter="drop-shadow(0 0 6px hsl(180 100% 50% / 0.5))"
                  />
                  <circle cx="40" cy="130" r="4" fill="hsl(180 100% 50%)" opacity="0.8" />
                  <circle cx="260" cy="30" r="4" fill="hsl(180 100% 50%)" opacity="0.8" />
                </svg>
              </div>

              {/* Routes */}
              <div className="px-5 pb-3 space-y-3">
                {routes
                  .sort((a, b) => b.safety - a.safety)
                  .map((route, i) => (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSelectRoute(route)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedRoute?.id === route.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : route.safety >= 90
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-rubik text-sm text-foreground font-medium">
                          {route.name}
                        </span>
                        <span
                          className={`font-mono-data text-sm font-semibold ${
                            route.safety >= 90 ? "text-primary text-glow-cyan" : "text-accent"
                          }`}
                        >
                          {route.safety}%
                        </span>
                      </div>
                      <div className="flex gap-4">
                        {[
                          { label: "TIME", value: route.time },
                          { label: "DIST", value: route.distance },
                          { label: "LIT", value: route.lit },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <p className="font-mono-data text-[9px] text-muted-foreground tracking-widest">
                              {stat.label}
                            </p>
                            <p className="font-mono-data text-xs text-foreground/80">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      {route.safety >= 90 && (
                        <p className="font-mono-data text-[10px] text-primary/60 mt-2 tracking-wider">
                          ● RECOMMENDED
                        </p>
                      )}
                    </motion.div>
                  ))}
              </div>

              {/* Start walk button */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleStartWalk}
                  disabled={!selectedRoute}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-rubik text-sm font-medium transition-all ${
                    selectedRoute
                      ? "bg-primary text-primary-foreground hover:opacity-90 glow-cyan"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {selectedRoute ? `Start Walk — ${selectedRoute.name}` : "Select a Route"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
};

export default FutureZone;
