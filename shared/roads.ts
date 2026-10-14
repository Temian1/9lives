// Road layout shared by rendering, entrances and construction rules.
// Models face +Z by default; a yaw of θ points the front along (sin θ, cos θ).
export const verticalRoads = [-100, 0, 100];
export const horizontalRoads = [-86, 14];
export type Facing = { yaw: number; dir: [number, number]; distance: number };
const facings = (x: number, z: number): Facing[] => [
  ...verticalRoads.map(r => ({ yaw: r > x ? Math.PI / 2 : -Math.PI / 2, dir: [r > x ? 1 : -1, 0] as [number, number], distance: Math.abs(r - x) })),
  ...horizontalRoads.map(r => ({ yaw: r > z ? 0 : Math.PI, dir: [0, r > z ? 1 : -1] as [number, number], distance: Math.abs(r - z) })),
].sort((a, b) => a.distance - b.distance);
/** The orientation that makes a building at (x,z) face its nearest road. */
export const roadFacing = (x: number, z: number): Facing => facings(x, z)[0];
/** Nearest-road orientation whose door point is usable; falls back to facing +Z. */
export function usableFacing(x: number, z: number, reach: number, usable: (x: number, z: number) => boolean): Facing {
  return facings(x, z).find(f => usable(x + f.dir[0] * reach, z + f.dir[1] * reach)) ?? { yaw: 0, dir: [0, 1], distance: Infinity };
}
/** Converts a world-aligned offset into (forward, lateral) relative to a facing. */
export const toFront = (f: Facing, x: number, z: number): [number, number] => [x * f.dir[0] + z * f.dir[1], x * f.dir[1] - z * f.dir[0]];
