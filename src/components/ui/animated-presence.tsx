import { useReducer, useEffect, type ReactNode } from "react";

type Phase = "enter" | "idle" | "exit" | "exited";
type Action =
  | { type: "show" }
  | { type: "hide" }
  | { type: "timeout" };

function phaseReducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case "show":
      return state === "exited" ? "enter" : state;
    case "hide":
      return state === "idle" || state === "enter" ? "exit" : state;
    case "timeout":
      if (state === "enter") return "idle";
      if (state === "exit") return "exited";
      return state;
  }
}

interface AnimatedPresenceProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  enterDuration?: number;
  exitDuration?: number;
}

export function AnimatedPresence({
  show,
  children,
  className = "",
  enterDuration = 300,
  exitDuration = 200,
}: AnimatedPresenceProps) {
  const [phase, dispatch] = useReducer(phaseReducer, show ? "idle" : "exited");

  useEffect(() => {
    if (show) {
      dispatch({ type: "show" });
    } else {
      dispatch({ type: "hide" });
    }
  }, [show]);

  useEffect(() => {
    if (phase === "exited" || phase === "idle") return;

    const duration = phase === "enter" ? enterDuration : exitDuration;
    const timer = setTimeout(() => {
      dispatch({ type: "timeout" });
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, enterDuration, exitDuration]);

  if (phase === "exited") return null;

  const isEntering = phase === "enter";
  const isExiting = phase === "exit";

  return (
    <div
      className={`${
        isEntering
          ? "animate-in fade-in slide-in-from-top-2 duration-300"
          : isExiting
          ? "animate-out fade-out slide-out-to-top-2 duration-200"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
