import {useGame,controls} from './game';
import {citizens} from './citizens';
import {enterpriseOf} from './enterprise';
import {safeZone} from '../shared/city';
let lastPunch=0;
export function CombatHUD(){const g=useGame(s=>s.game),modal=useGame(s=>s.modal);if(!g.created||modal||g.interior)return null;const armed=g.inventory.includes('Pistol');const punch=()=>{const s=useGame.getState();if(s.paused||Date.now()-lastPunch<900)return;lastPunch=Date.now();const near=[...citizens.values()].filter(c=>!c.ride&&!safeZone(...c.position)&&enterpriseOf(s.game).npcHealth[c.id]!==0&&Math.hypot(c.position[0]-controls.position[0],c.position[1]-controls.position[1])<1.8)[0];if(!near)return s.notify('Approach a target; safe zones are protected.');s.enterpriseAction({action:'npc-hit',id:near.id,amount:20,receipt:`punch-${near.id}-${Date.now()}`});};return <><div className="combat-tools"><button onClick={punch}>Fists</button>{armed&&<><button onClick={()=>useGame.getState().shoot()}>Shoot · {g.ammo??0}</button><button onClick={()=>useGame.getState().reload()}>Reload</button></>}</div>{armed&&<span className="aim-crosshair" aria-label="Aiming crosshair">+</span>}</>;}
