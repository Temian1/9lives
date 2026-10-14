// Live raider bodies, shared by the 3D raid scene and the combat controls.
export type Raider = { id: string; index: number; position: [number, number]; hp: number; down: boolean; cooldown: number; reported: boolean };
export const raiders = new Map<string, Raider>();
export const raidRuntime = { id: '', breach: 0, reported: false };
/** Applies damage to a raider; returns true when this hit takes them down. */
export function hurtRaider(r: Raider, amount: number) {
  if (r.down) return false;
  r.hp -= amount;
  if (r.hp > 0) return false;
  r.down = true;
  return true;
}
