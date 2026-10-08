import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {controls,defaultCharacter,useGame,type Character} from './game';
export function Box({ p, s, color, ...props }: { p: [number, number, number]; s: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s} /><meshStandardMaterial color={color} roughness={.86} /></mesh>;
}
export function Sign({ text, position, width = 3.8, bg = '#234536', ink = '#eee7c9' }: { text: string; position: [number, number, number]; width?: number; bg?: string; ink?: string }) {
  const texture = useMemo(() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(8, 8, 496, 112); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 40px sans-serif'; ctx.fillText(text, 256, 64, 475); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, [text, bg, ink]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position}><planeGeometry args={[width, width / 4]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>;
}
export function Person({ color = '#e2bd75', npc = false, character, walking=false, seated=false }: { color?: string; npc?: boolean; character?:Character; walking?:boolean; seated?:boolean }) {
  const c=character??{...defaultCharacter,shirt:color};const legs=useRef<(THREE.Group|null)[]>([]);
  useFrame(({clock})=>{if(!walking)return;const s=useGame.getState();const moving=!s.paused&&!s.modal&&(Math.abs(controls.x)+Math.abs(controls.z)>0||['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(k=>controls.keys.has(k)));legs.current.forEach((l,i)=>{if(l)l.rotation.x=moving?Math.sin(clock.elapsedTime*(controls.running?13:9)+i*Math.PI)*.45:0;});});
  return <group><mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[.22, 10, 8]} /><meshStandardMaterial color={c.skin} /></mesh><mesh position={[0, 1.81, -.03]} scale={c.hairstyle==='afro'?[1.5,1.3,1.4]:[1,1,1]}><sphereGeometry args={[.2, 10, 8]} /><meshStandardMaterial color={c.hair} /></mesh>{c.hairstyle==='braids'&&<Box p={[0,1.57,-.15]} s={[.4,.5,.16]} color={c.hair}/>}<Box p={[0, 1.18, 0]} s={[c.gender==='female'?.43:.5, .65, .28]} color={c.shirt} />{[-.17, .17].map((x,i) => <group key={x}><group ref={el=>{legs.current[i]=el;}} position={[x,.9,0]} rotation={seated?[-Math.PI/2,0,0]:[0,0,0]}><Box p={[0, -.34, 0]} s={[.2, .62, .22]} color={npc ? '#515947' : '#394a43'} /><Box p={[0, -.74, .07]} s={[.23, .16, .4]} color="#e2dfc5" /></group><Box p={[x * 1.9, 1.12, 0]} s={[.15, .6, .18]} color={c.skin} /></group>)}{c.gender==='female'&&<mesh position={[0,.92,0]}><cylinderGeometry args={[.24,.34,.35,8]} /><meshStandardMaterial color={c.shirt}/></mesh>}{!npc && <Box p={[0, 1.22, -.22]} s={[.36, .45, .22]} color="#cda460" />}</group>;
}
