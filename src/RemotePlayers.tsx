import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group} from 'three';
import {usePeers,type PublicPlayer} from './peer';
import {useGame,defaultCharacter} from './game';
import {Person,Sign} from './SceneParts';
function Remote({player:p}:{player:PublicPlayer}){const ref=useRef<Group>(null);useFrame((_,dt)=>{if(!ref.current)return;const n=usePeers.getState().players.find(n=>n.id===p.id);if(!n)return;const dx=n.x-ref.current.position.x,dz=n.z-ref.current.position.z;ref.current.position.x+=dx*(1-Math.exp(-dt*12));ref.current.position.z+=dz*(1-Math.exp(-dt*12));if(Math.hypot(dx,dz)>.05)ref.current.rotation.y=Math.atan2(dx,dz);});return <group ref={ref} position={[p.x,0,p.z]}><Person character={{...defaultCharacter,name:p.name,gender:p.gender,model:p.gender==='female'?'character-b':'character-a',shirt:p.shirt,skin:p.skin}} npc/><Sign text={p.name+' · '+p.lives+' lives'} position={[0,2.4,0]} width={2}/></group>;}
export function RemotePlayers(){const players=usePeers(s=>s.players),id=usePeers(s=>s.id),inside=useGame(s=>s.game.interior);return inside?null:<>{players.filter(p=>p.id!==id&&p.lives>0).map(p=><Remote key={p.id} player={p}/>)}</>;}
