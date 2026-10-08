import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group} from 'three';
import {useGame,controls} from './game';
import {districts,canMove} from '../shared/city';
import {Person} from './SceneParts';
export function Crowds(){const refs=useRef<(Group|null)[]>([]);useFrame(({clock},dt)=>{const s=useGame.getState(),hour=s.game.minutes/60;refs.current.forEach((g,i)=>{if(!g)return;const d=districts[Math.floor(i/4)];g.visible=!s.game.interior&&hour>=6&&hour<23&&Math.hypot(d.x-controls.position[0],d.z-controls.position[1])<65;if(!g.visible||s.modal||s.paused)return;const side=i%2?1:-1,target=d.z+Math.sin(clock.elapsedTime*.035+i)*9,x=d.x+side*4.6;const dz=target-g.position.z,next=g.position.z+Math.sign(dz)*Math.min(Math.abs(dz),dt*.8);if(canMove(x,next)){g.position.x=x;g.position.z=next;}g.rotation.y=dz>0?0:Math.PI;if(Math.hypot(g.position.x-controls.position[0],g.position.z-controls.position[1])<1.4)g.rotation.y=Math.atan2(controls.position[0]-g.position.x,controls.position[1]-g.position.z);});});return <>{districts.flatMap((d,j)=>Array.from({length:4},(_,i)=><group key={d.id+i} position={[d.x+(i%2?4.6:-4.6),0,d.z+i*3-6]} ref={g=>{refs.current[j*4+i]=g;}}><Person npc walking color={['#af7751','#748ca1','#a8aa77','#975f83'][i]}/></group>))}</>;}
