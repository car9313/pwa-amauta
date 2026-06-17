/*
 * tokens.ts — Tokens de diseño como constantes JS tipadas.
 *
 * PROPÓSITO:
 *   Provee los mismos valores que tokens.css pero como constantes
 *   TypeScript para usar cuando NO puedes emplear clases Tailwind:
 *   gráficas (Chart.js), animaciones dinámicas, cálculos en hooks,
 *   props de estilo inline justificadas, etc.
 *
 * USO:
 *   Importar solo en archivos .ts/.tsx que necesiten el valor en runtime:
 *       ✅ import { colors, breakpoints } from "@/lib/design-system/tokens"
 *       ✅ if (width > breakpoints.md) { ... }
 *       ❌ No importar en componentes que puedan usar clases Tailwind
 *
 * RELACIÓN CON tokens.css:
 *   tokens.css es la fuente de verdad para CSS/Tailwind.
 *   Este archivo es un espejo para JS y DEBE mantenerse sincronizado.
 *   Si agregas un token aquí, agrégalo también en tokens.css y viceversa.
 */

export const spacing = {
  pageX: "1rem",
  section: "1.5rem",
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const touchTarget = {
  min: "44px",
} as const;

export const radii = {
  sm: "calc(0.9rem - 4px)",
  md: "calc(0.9rem - 2px)",
  lg: "0.9rem",
  xl: "calc(0.9rem + 4px)",
} as const;

export const colors = {
  amautaBlue: "#1f4fa3",
  amautaBlueLight: "#e7eefb",
  amautaBlueDark: "#17306d",
  amautaOrange: "#f4701f",
  amautaOrangeLight: "#fccca1",
  amautaOrangeDark: "#ea601b",
  amautaWarmWhite: "#f6f3ee",
  amautaSurface: "#ffffff",
  amautaSurfaceAlt: "#f8f9fc",
  success: "#10b981",
  warning: "#f59e0b",
  primary: "#1f4fa3",
  accent: "#f2994a",
  foreground: "#1f3c78",
  mutedForeground: "#6b7280",
} as const;

export const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(31, 79, 163, 0.08)",
  md: "0 6px 18px rgba(31, 79, 163, 0.10)",
  lg: "0 12px 32px rgba(31, 79, 163, 0.14)",
  xl: "0 20px 48px rgba(31, 79, 163, 0.16)",
  "2xl": "0 32px 64px rgba(31, 79, 163, 0.18)",
  glowBlue: "0 0 24px rgba(31, 79, 163, 0.18)",
  glowOrange: "0 0 24px rgba(244, 112, 31, 0.20)",
} as const;

export const animationDelays = {
  500: "500ms",
  1000: "1000ms",
  1500: "1500ms",
  2000: "2000ms",
} as const;
