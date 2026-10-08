import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group} from 'three';
import {controls,useGame} from './game';
import {usePeers} from './peer';
import {Person,Sign} from './SceneParts';
import {worldFree} from './spatial';
import {findRoute,type Point} from '../shared/navigation';
import {dynamicBodies,steerCrowd} from './crowd';
export function Bodyguards(){
 const count=useGame(s=>s.game.guards??0),mode=useGame(s=>s.game.sim?.guardMode??'protect'),refs=useRef<(Group|null)[]>([]),anchor=useRef<Point>([...controls.position]),routes=useRef<{points:Point[];next:number}[]>([]),time=useRef(0);
 useEffect(()=>{anchor.current=[...controls.position];routes.current=[];},[mode]);
 useFrame((_,dt)=>{
  const s=useGame.getState();if(s.modal||s.paused||document.hidden)return;
  time.current+=Math.min(dt,.05);const peers=usePeers.getState(),free=worldFree(s.game),threat=peers.players.find(p=>p.id!==peers.id&&p.wanted>0&&Math.hypot(p.x-controls.position[0],p.z-controls.position[1])<8);
  refs.current.forEach((g,i)=>{
   if(!g)return;g.visible=!s.game.interior&&!s.driving&&!s.ride&&s.game.lives>0;if(!g.visible)return;
   let x=(mode==='stay'?anchor.current[0]:controls.position[0])+(i%2?1.4:-1.4),z=(mode==='stay'?anchor.current[1]:controls.position[1])-1.2-i*.7;
   if(mode==='protect'&&threat){x=(threat.x+controls.position[0])/2+(i-1)*.8;z=(threat.z+controls.position[1])/2;}
   const route=routes.current[i]??={points:[],next:0};
   if(time.current>=route.next){route.points=findRoute([g.position.x,g.position.z],[x,z],free,2200)??[];route.next=time.current+1;}
   while(route.points.length&&Math.hypot(route.points[0][0]-g.position.x,route.points[0][1]-g.position.z)<.2)route.points.shift();
   const target=route.points[0];g.userData.walking=false;if(!target)return;
   const before:Point=[g.position.x,g.position.z],next=steerCrowd(before,target,free,dynamicBodies(),'guard-'+i,dt),dx=next[0]-before[0],dz=next[1]-before[1];
   g.position.x=next[0];g.position.z=next[1];g.userData.walking=Math.hypot(dx,dz)>.001;if(g.userData.walking)g.rotation.y=Math.atan2(dx,dz);
  });
 });
 return <>{Array.from({length:count},(_,i)=><group key={i} ref={g=>{refs.current[i]=g;}} userData={{walking:false}} position={[controls.position[0]+i,0,controls.position[1]-2]}><Person npc color="#3d5145"/><Sign text={mode==='stay'?'GUARD · HOLD':'BODYGUARD'} position={[0,2.2,0]} width={1.5}/></group>)}</>;
}
