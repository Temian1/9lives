// Tiny event bus so game logic can request sounds without importing the audio engine.
export type Sfx = 'crash' | 'bump' | 'hit' | 'enemy-shot' | 'build' | 'cash' | 'confirm' | 'deny' | 'alarm' | 'dog' | 'raid' | 'victory' | 'defeat' | 'horn' | 'skid';
export const sfx = (name: Sfx, volume = 1) => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('9lives-sfx', { detail: { name, volume } })); };
// Live values the audio engine reads every frame (engine pitch, tyre squeal).
export const telemetry = { speed: 0, rpm: 0, slip: 0, throttle: 0 };
