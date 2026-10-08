import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Group,Vector3} from 'three';
import {citizens} from './citizens';
import {controls,useGame} from './game';
import {enterpriseOf} from './enterprise';
import {clearSegment} from '../shared/navigation';
import {worldFree} from './spatial';
import {safeZone} from '../shared/city';
import {Box} from './SceneParts';
export function Combat(){const camera=useThree(s=>s.camera),trace=useRef<Group>(null),life=useRef(0);useEffect(()=>{const shot=(event:Event)=>{const s=useGame.getState(),direction=camera.getWorldDirection(new Vector3()),targets=[...citizens.values()].filter(c=>!c.ride&&!safeZone(...c.position)&&enterpriseOf(s.game).npcHealth[c.id]!==0).map(c=>{const dx=c.position[0]-controls.position[0],dz=c.position[1]-controls.position[1],distance=Math.hypot(dx,dz),alignment=distance?(dx*direction.x+dz*direction.z)/distance:0;return {c,distance,alignment};}).filter(t=>t.distance<18&&(t.alignment>.9||t.c.id===(event as CustomEvent).detail)&&clearSegment(controls.position,t.c.position,worldFree(s.game))).sort((a,b)=>a.distance-b.distance),hit=targets[0];if(hit)s.enterpriseAction({action:'npc-hit',id:hit.c.id,receipt:`shot-${hit.c.id}-${Date.now()}`});if(trace.current){trace.current.position.set(controls.position[0],1,controls.position[1]);const target=hit?new Vector3(hit.c.position[0],1,hit.c.position[1]):new Vector3(controls.position[0]+direction.x*10,1,controls.position[1]+direction.z*10);trace.current.lookAt(target);trace.current.scale.z=hit?.distance??10;life.current=.1;}};window.addEventListener('9lives-shot',shot);return()=>window.removeEventListener('9lives-shot',shot);},[camera]);useFrame((_,dt)=>{life.current=Math.max(0,life.current-dt);if(trace.current)trace.current.visible=life.current>0;});return <group ref={trace} visible={false}><Box p={[0,0,.5]} s={[.025,.025,1]} color="#f5d38b"/></group>;}
