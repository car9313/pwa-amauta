import { useMemo } from "react";

interface StaggerOptions {
  count: number;
  baseDelay?: number;
  totalDuration?: number;
  order?: "forward" | "reverse";
}

const DEFAULT_BASE_DELAY = 50;
const DEFAULT_TOTAL_DURATION = 300;

export function useStagger({
  count,
  baseDelay = DEFAULT_BASE_DELAY,
  totalDuration = DEFAULT_TOTAL_DURATION,
  order = "forward",
}: StaggerOptions) {
  const delays = useMemo(() => {
    const step = count > 1 ? (totalDuration - baseDelay) / (count - 1) : 0;
    const items = Array.from({ length: count }, (_, i) => {
      const delay = baseDelay + step * i;
      return Math.round(delay);
    });
    return order === "reverse" ? items.reverse() : items;
  }, [count, baseDelay, totalDuration, order]);

  const getDelay = (index: number): number => delays[index] ?? delays[delays.length - 1] ?? 0;

  const getStyle = (index: number): React.CSSProperties => ({
    animationDelay: `${getDelay(index)}ms`,
  });

  return { delays, getDelay, getStyle };
}
