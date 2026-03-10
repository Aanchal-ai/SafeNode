import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Mic, Shield, ScanFace } from "lucide-react";
import SafeRouteTab from "@/components/tabs/SafeRouteTab";
import AcousticTab from "@/components/tabs/AcousticTab";
import DigitalShieldTab from "@/components/tabs/DigitalShieldTab";
import IdentityVaultTab from "@/components/tabs/IdentityVaultTab";

type TabId = "route" | "acoustic" | "shield" | "identity";

const tabs = [
  { id: "route" as TabId, label: "SafeRoute", icon: Map },
  { id: "acoustic" as TabId, label: "Guardian", icon: Mic },
  { id: "shield" as TabId, label: "Shield", icon: Shield },
  { id: "identity" as TabId, label: "Identity", icon: ScanFace },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("route");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-20 px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-rubik text-xl font-semibold text-foreground tracking-tight">
            <span className="text-primary text-glow-cyan">Vigil</span> AI
          </h1>
          <p className="font-mono-data text-[10px] text-muted-foreground tracking-[0.25em] uppercase mt-0.5">
            Personal Safety Intelligence
          </p>
        </div>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse glow-cyan" />
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto pb-24 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "route" && <SafeRouteTab />}
            {activeTab === "acoustic" && <AcousticTab />}
            {activeTab === "shield" && <DigitalShieldTab />}
            {activeTab === "identity" && <IdentityVaultTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
                <span className="font-mono-data text-[9px] tracking-wider uppercase">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;
