import { cn } from "@/lib/utils";

type ConstellationVariant = "hero" | "decorative" | "mini";

interface ConstellationProps {
  variant?: ConstellationVariant;
  className?: string;
}

const paths: Record<ConstellationVariant, string> = {
  hero:
    "M50 20 C50 20 65 10 85 25 C105 40 120 55 120 55 M85 25 C85 25 95 40 90 55 C85 70 70 75 70 75 M70 75 C70 75 55 85 40 80 C25 75 20 65 20 65 M20 65 C20 65 10 50 15 35 C20 20 35 20 50 20 M40 80 C40 80 30 95 15 100 C0 105 5 90 5 90",
  decorative:
    "M30 15 C30 15 50 5 70 20 C90 35 100 50 100 50 M70 20 C70 20 75 35 65 50 C55 65 45 70 45 70 M45 70 C45 70 25 80 15 65 C5 50 10 40 30 15 M65 50 C65 50 80 55 90 45 C100 35 95 20 95 20",
  mini:
    "M20 10 C20 10 35 5 50 15 C65 25 70 35 70 35 M50 15 C50 15 55 25 45 35 C35 45 25 40 25 40 M25 40 C25 40 15 50 10 45 C5 40 10 30 10 30",
};

const nodePositions: Record<ConstellationVariant, Array<[number, number]>> = {
  hero: [
    [50, 20],
    [85, 25],
    [70, 75],
    [20, 65],
    [40, 80],
    [15, 100],
  ],
  decorative: [
    [30, 15],
    [70, 20],
    [45, 70],
    [15, 65],
    [90, 45],
  ],
  mini: [
    [20, 10],
    [50, 15],
    [25, 40],
    [10, 45],
  ],
};

const viewBoxes: Record<ConstellationVariant, string> = {
  hero: "0 0 130 110",
  decorative: "0 0 110 85",
  mini: "0 0 80 55",
};

function Constellation({ variant = "decorative", className }: ConstellationProps) {
  return (
    <svg
      viewBox={viewBoxes[variant]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-amauta-blue/15", className)}
      aria-hidden="true"
    >
      <path
        d={paths[variant]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {nodePositions[variant].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="2.5"
          fill="currentColor"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

export { Constellation };
export type { ConstellationProps, ConstellationVariant };
