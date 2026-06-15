import { useState, useCallback } from "react";
import { Wifi, WifiOff, Monitor } from "lucide-react";

type DevOnlineState = "auto" | "online" | "offline";

const STORAGE_KEY = "__dev_online";

function getInitialState(): DevOnlineState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "true") return "online";
  if (stored === "false") return "offline";
  return "auto";
}

function dispatchChange(value: string): void {
  window.dispatchEvent(
    new CustomEvent("__dev-online-change", { detail: value })
  );
}

const STATE_CYCLE: DevOnlineState[] = ["auto", "offline", "online"];

const STATE_CONFIG: Record<DevOnlineState, { className: string; label: string; icon: typeof Wifi }> = {
  auto: { className: "dev-toggle-auto", label: "Auto", icon: Monitor },
  online: { className: "dev-toggle-online", label: "Online (dev)", icon: Wifi },
  offline: { className: "dev-toggle-offline", label: "Offline (dev)", icon: WifiOff },
};

export function DevOnlineToggle() {
  const [state, setState] = useState<DevOnlineState>(getInitialState);

  const handleClick = useCallback(() => {
    const currentIndex = STATE_CYCLE.indexOf(state);
    const nextState = STATE_CYCLE[(currentIndex + 1) % STATE_CYCLE.length];
    setState(nextState);

    const value = nextState === "auto" ? "" : nextState === "online" ? "true" : "false";
    localStorage.setItem(STORAGE_KEY, value);
    dispatchChange(value);
  }, [state]);

  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Estado: ${config.label}. Click para cambiar.`}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{config.label}</span>
    </button>
  );
}
