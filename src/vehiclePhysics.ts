import type {CarStats} from './empire';
// Arcade-plausible car model: engine force with a power curve, rolling + aerodynamic drag,
// braking, speed-sensitive steering limited by tyre grip, and body roll/pitch from load transfer.
export type CarState = { speed: number; angle: number; roll: number; pitch: number; slip: number; rpm: number };
export type CarInput = { throttle: number; steer: number; brake: boolean; boost: boolean };
export const idleCar = (angle = Math.PI): CarState => ({ speed: 0, angle, roll: 0, pitch: 0, slip: 0, rpm: 0 });
const approach = (value: number, target: number, rate: number, dt: number) => value + (target - value) * (1 - Math.exp(-rate * dt));
export function stepCar(state: CarState, input: CarInput, dt: number, stats: CarStats, wet = false) {
  const h = Math.min(Math.max(dt, 0), .05), grip = stats.grip * (wet ? .72 : 1), top = stats.topSpeed * (input.boost ? 1.3 : 1);
  const throttle = Math.max(-1, Math.min(1, input.throttle)), steer = Math.max(-1, Math.min(1, input.steer));
  let speed = state.speed, accel = 0;
  const opposing = throttle !== 0 && speed !== 0 && Math.sign(throttle) !== Math.sign(speed) && Math.abs(speed) > .3;
  if (input.brake || opposing) {
    const decel = stats.brake * (wet ? .7 : 1) * (input.brake ? 1 : .8);
    accel = -Math.sign(speed) * Math.min(Math.abs(speed) / h, decel);
  } else if (throttle) {
    const limit = throttle > 0 ? top : top * .35, ratio = Math.min(1, Math.abs(speed) / limit);
    accel = throttle * stats.accel * (input.boost ? 1.25 : 1) * (1 - ratio * ratio);
  }
  const drag = .6 * Math.sign(speed) + .012 * speed * Math.abs(speed);
  const next = speed + (accel - (throttle || input.brake ? drag * .5 : drag * 1.6)) * h;
  speed = Math.sign(next) !== Math.sign(speed) && speed !== 0 && !throttle ? 0 : next;
  if (Math.abs(speed) < .05 && !throttle) speed = 0;
  // Steering: wheel angle shrinks with speed; yaw rate is capped by lateral grip (understeer).
  const wheel = steer * .55 / (1 + Math.abs(speed) / 14), wanted = speed * Math.tan(wheel) / 2.6;
  const maxYaw = grip / Math.max(1.5, Math.abs(speed)), yaw = Math.max(-maxYaw, Math.min(maxYaw, wanted));
  const slip = Math.min(1, Math.abs(wanted - yaw) * Math.abs(speed) / 6 + (input.brake && Math.abs(speed) > 9 ? .4 : 0));
  const angle = state.angle - yaw * h;
  const lateral = yaw * speed, longitudinal = (speed - state.speed) / Math.max(h, 1e-4);
  return {
    state: {
      speed, angle, slip,
      roll: approach(state.roll, Math.max(-.12, Math.min(.12, lateral * stats.roll * .02)), 6, h),
      pitch: approach(state.pitch, Math.max(-.06, Math.min(.06, -longitudinal * .004)), 6, h),
      rpm: approach(state.rpm, .15 + Math.abs(speed) / Math.max(1, top) * .85 + (throttle ? .1 : 0), 5, h),
    },
    dx: Math.sin(angle) * speed * h,
    dz: Math.cos(angle) * speed * h,
  };
}
/** Collision response: low-speed contact stops the car; harder hits bounce back and cause damage reduced by armour. */
export function impact(speed: number, stats: CarStats) {
  const v = Math.abs(speed);
  if (v < 2) return { speed: 0, damage: 0, severity: 'none' as const };
  const damage = Math.min(60, (v - 2) * 4 * (1 - stats.armor * .2) * Math.sqrt(stats.mass / 1200));
  return { speed: -speed * .3, damage: Math.round(damage), severity: v > 7 ? 'crash' as const : 'bump' as const };
}
