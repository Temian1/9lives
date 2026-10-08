import {avoidsBodies,type Body,type Point} from '../shared/navigation';
import {locations,controls,useGame} from './game';
export const crowdBodies=new Map<string,Body>();
export function stationaryBodies():Body[]{return locations.filter(l=>['tunde','shop','work','story','police','efcc','security','hawker'].includes(l.type)).map(l=>({id:l.id,x:l.x,z:l.z,radius:.36}));}
export function dynamicBodies(){return [...stationaryBodies(),...crowdBodies.values()];}
export function steerCrowd(from:Point,target:Point,free:(x:number,z:number)=>boolean,bodies:Body[],id:string,dt:number):Point{
 const dx=target[0]-from[0],dz=target[1]-from[1],r=Math.hypot(dx,dz);if(r<.08)return [...from];const step=Math.min(r,Math.min(dt,.05)*.9),ux=dx/r,uz=dz/r;
 for(const angle of [0,.75,-.75,1.3,-1.3,1.7,-1.7]){const c=Math.cos(angle),s=Math.sin(angle),p:Point=[from[0]+(ux*c-uz*s)*step,from[1]+(uz*c+ux*s)*step];if(free(...p)&&avoidsBodies(from,p,bodies,.36,id))return p;}return [...from];
}
export function publishPlayerBody():Body{const s=useGame.getState();return {id:'player',x:controls.position[0],z:controls.position[1],radius:s.driving?1:.32};}
