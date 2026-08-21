export const XP_PER_CORRECT = 10;
export const POINTS_PER_LEVEL = 100;

export function computeNextStreakDays(
  lastPlayedAt: number | null | undefined,
  currentStreak: number | null | undefined,
  now = Date.now()
): number {
  const previousStreak = Math.max(1, currentStreak ?? 1);
  if (!lastPlayedAt) return previousStreak;

  const startOfDay = (timestamp: number): number => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const dayMs = 24 * 60 * 60 * 1000;
  const daysDiff = Math.round((startOfDay(now) - startOfDay(lastPlayedAt)) / dayMs);

  if (daysDiff <= 0) return previousStreak;
  if (daysDiff === 1) return previousStreak + 1;
  return 1;
}

export function computeLevelFromPoints(points: number): number {
  return Math.floor(Math.max(0, points) / POINTS_PER_LEVEL) + 1;
}
