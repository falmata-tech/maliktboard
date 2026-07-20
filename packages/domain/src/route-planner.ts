import type { RouteLegLike, RoutePlan } from "./types";

export function findBestRoute(companyId: string, originId: string, destinationId: string, allLegs: RouteLegLike[]): RoutePlan | null {
  if (originId === destinationId) return { legs: [], totalHours: 0 };
  const legs = allLegs.filter((leg) => leg.companyId === companyId && leg.active);
  const queue: Array<{ location: string; path: RouteLegLike[]; hours: number; score: number }> = [
    { location: originId, path: [], hours: 0, score: 0 },
  ];
  const best = new Map<string, number>([[originId, 0]]);

  while (queue.length) {
    queue.sort((a, b) => a.score - b.score);
    const current = queue.shift()!;
    if (current.location === destinationId) return { legs: current.path, totalHours: current.hours };
    for (const leg of legs.filter((item) => item.originLocationId === current.location)) {
      if (current.path.some((step) => step.id === leg.id)) continue;
      const hours = current.hours + Math.max(0, leg.estimatedHours);
      const score = current.path.length + 1 + hours / 100 + Math.max(0, leg.priority) / 1000;
      if ((best.get(leg.destinationLocationId) ?? Number.POSITIVE_INFINITY) <= score) continue;
      best.set(leg.destinationLocationId, score);
      queue.push({ location: leg.destinationLocationId, path: [...current.path, leg], hours, score });
    }
  }
  return null;
}
