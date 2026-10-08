import { memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blockers, canMove, controls, defaultCharacter, locations, useGame, type Character } from './game';
import { districts, trafficAt, vehicles, type VehicleKind, type DistrictId } from '../shared/city';

function Box({ p, s, color, ...props }: { p: [number, number, number]; s: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s} /><meshStandardMaterial color={color} roughness={.86} /></mesh>;
}
function Sign({ text, position, width = 3.8, bg = '#234536', ink = '#eee7c9' }: { text: string; position: [number, number, number]; width?: number; bg?: string; ink?: string }) {
  const texture = useMemo(() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(8, 8, 496, 112); ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 40px sans-serif'; ctx.fillText(text, 256, 64, 475); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, [text, bg, ink]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position}><planeGeometry args={[width, width / 4]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>;
}
function Building({ x, z, color, h, label, index }: { x: number; z: number; color: string; h: number; label: string; index: number }) {
  const front = z + (index % 3 === 1 ? 2.5 : 3);
  return <group>
    <Box p={[x, h / 2, z]} s={[5, h, index % 3 === 1 ? 5 : 6]} color={color} />
    <Box p={[x, .22, z]} s={[5.4, .44, 6.4]} color="#797d69" />
    <Box p={[x, h + .12, z]} s={[5.3, .25, 6.2]} color="#626755" />
    <Box p={[x, h + .5, z - 1.5]} s={[2, .65, 1.6]} color="#73756a" />
    <mesh position={[x + 1.3, h + .7, z - 1]}><cylinderGeometry args={[.6, .6, 1.2, 12]} /><meshStandardMaterial color="#2c3939" /></mesh>
    <Box p={[x, 1, front + .02]} s={[1.1, 2, .12]} color="#334139" />
    <Box p={[x + .36, 1, front + .1]} s={[.06, .13, .08]} color="#dbbc71" />
    {[1.5, 4.2, 6.9].filter(y => y < h - .8).flatMap(y => [-1.65, 1.65].map(xx => <group key={`${xx}-${y}`}>
      <Box p={[x + xx, y, front + .04]} s={[1.05, 1.35, .12]} color="#e3d7ac" />
      <Box p={[x + xx, y, front + .12]} s={[.85, 1.15, .08]} color={index % 2 ? '#44534b' : '#6d7863'} />
      <Box p={[x + xx, y, front + .18]} s={[.05, 1.2, .06]} color="#d3c49d" />
      <Box p={[x + xx, y + .02, front + .19]} s={[.9, .05, .06]} color="#d3c49d" />
      {y > 2 && <><Box p={[x + xx, y - .8, front + .45]} s={[1.6, .16, .9]} color="#8c8b73" /><Box p={[x + xx, y - .4, front + .85]} s={[1.6, .06, .06]} color="#3b4942" />{[-.7, 0, .7].map(a => <Box key={a} p={[x + xx + a, y - .6, front + .85]} s={[.05, .45, .05]} color="#3b4942" />)}</>}
    </group>))}
    <Sign text={label} position={[x, 2.9, front + .25]} bg={index === 1 ? '#a06639' : '#344c40'} width={4.2} />
    {index === 1 && <group><Box p={[x, 2.3, front + 1]} s={[5.3, .13, 1.8]} color="#bc8250" />{[-2.5, 2.5].map(a => <Box key={a} p={[x + a, 1.15, front + 1.7]} s={[.08, 2.3, .08]} color="#443f31" />)}<Box p={[x, .65, front + 1.3]} s={[3.4, 1.1, .8]} color="#847147" />{[-1, -.5, 0, .5, 1].map((a, i) => <mesh key={a} position={[x + a, 1.3, front + 1.3]}><sphereGeometry args={[.25, 8, 8]} /><meshStandardMaterial color={i % 2 ? '#c96e37' : '#b4b75b'} /></mesh>)}</group>}
    {Array.from({ length: 4 }, (_, i) => <Box key={i} p={[x + 2.54, 1.5 + i * 1.4, z]} s={[.1, .9, 1.1]} color="#445349" />)}
  </group>;
}
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return <group position={[x, 0, z]} scale={scale}><mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[.13, .24, 3, 7]} /><meshStandardMaterial color="#64533a" /></mesh>{[[0, 3.7, 0], [.7, 3.25, .3], [-.7, 3.3, -.3]].map((p, i) => <mesh key={i} position={p as [number, number, number]} castShadow><icosahedronGeometry args={[1.45, 1]} /><meshStandardMaterial color={['#536e47', '#607c4d', '#748451'][i]} roughness={1} /></mesh>)}<Box p={[0, .12, 0]} s={[1.4, .25, 1.4]} color="#8b8d74" /></group>;
}
function Bus({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return <group position={[x, 0, z]} rotation={[0, rotation, 0]}><Box p={[0, .9, 0]} s={[1.8, 1.35, 3.8]} color="#dbb844" /><Box p={[0, 1.6, -.05]} s={[1.78, .6, 3.2]} color="#d1b459" /><Box p={[0, 1.55, 1.59]} s={[1.5, .56, .05]} color="#354842" /><Box p={[0, 1.02, 1.93]} s={[1.82, .12, .03]} color="#332f25" />{[-.92, .92].flatMap(xx => [-1, 0, 1].map(zz => <Box key={`${xx}-${zz}`} p={[xx, 1.55, zz]} s={[.03, .5, .8]} color="#41534c" />))}{[-.92, .92].flatMap(xx => [-1.2, 1.2].map(zz => <mesh key={`${xx}-${zz}`} position={[xx, .4, zz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.4, .4, .23, 12]} /><meshStandardMaterial color="#272e29" /></mesh>))}{[-.63, .63].map(xx => <Box key={xx} p={[xx, .85, 1.96]} s={[.33, .24, .06]} color="#f5e2a5" />)}<Sign text="LAGOS • YABA" position={[0, 1.95, 1.6]} width={1.5} /></group>;
}
export function Person({ color = '#e2bd75', npc = false, character, walking=false }: { color?: string; npc?: boolean; character?:Character; walking?:boolean }) {
  const c=character??{...defaultCharacter,shirt:color};const legs=useRef<(THREE.Group|null)[]>([]);
  useFrame(({clock})=>{if(!walking)return;const s=useGame.getState();const moving=!s.paused&&!s.modal&&(Math.abs(controls.x)+Math.abs(controls.z)>0||['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(k=>controls.keys.has(k)));legs.current.forEach((l,i)=>{if(l)l.rotation.x=moving?Math.sin(clock.elapsedTime*(controls.running?13:9)+i*Math.PI)*.45:0;});});
  return <group><mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[.22, 10, 8]} /><meshStandardMaterial color={c.skin} /></mesh><mesh position={[0, 1.81, -.03]} scale={c.hairstyle==='afro'?[1.5,1.3,1.4]:[1,1,1]}><sphereGeometry args={[.2, 10, 8]} /><meshStandardMaterial color={c.hair} /></mesh>{c.hairstyle==='braids'&&<Box p={[0,1.57,-.15]} s={[.4,.5,.16]} color={c.hair}/>}<Box p={[0, 1.18, 0]} s={[c.gender==='female'?.43:.5, .65, .28]} color={c.shirt} />{[-.17, .17].map((x,i) => <group key={x}><group ref={el=>{legs.current[i]=el;}} position={[x,.9,0]}><Box p={[0, -.34, 0]} s={[.2, .62, .22]} color={npc ? '#515947' : '#394a43'} /><Box p={[0, -.74, .07]} s={[.23, .16, .4]} color="#e2dfc5" /></group><Box p={[x * 1.9, 1.12, 0]} s={[.15, .6, .18]} color={c.skin} /></group>)}{c.gender==='female'&&<mesh position={[0,.92,0]}><cylinderGeometry args={[.24,.34,.35,8]} /><meshStandardMaterial color={c.shirt}/></mesh>}{!npc && <Box p={[0, 1.22, -.22]} s={[.36, .45, .22]} color="#cda460" />}</group>;
}
function Wheel({x,z,r=.36}:{x:number;z:number;r?:number}){return <mesh position={[x,r,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[r,r,.17,12]}/><meshStandardMaterial color="#24312c"/></mesh>;}
export function Vehicle({kind,color='#b9c6b3'}:{kind:VehicleKind;color?:string}){if(kind==='bus')return <Bus x={0} z={0}/>;if(kind==='car')return <group><Box p={[0,.66,0]} s={[1.7,.6,3.4]} color={color}/><Box p={[0,1.12,-.18]} s={[1.45,.62,1.75]} color={color}/><Box p={[0,1.24,.7]} s={[1.35,.45,.04]} color="#355450"/><Box p={[0,1.24,-1.07]} s={[1.35,.4,.04]} color="#355450"/>{[-.74,.74].map(x=><Box key={x} p={[x,1.2,-.2]} s={[.04,.43,1.35]} color="#3e5a52"/>)}{[-.87,.87].flatMap(x=>[-1.07,1.07].map(z=><Wheel key={`${x}-${z}`} x={x} z={z}/>))}{[-.55,.55].map(x=><group key={x}><Box p={[x,.74,1.72]} s={[.38,.18,.05]} color="#f8e9b6"/><Box p={[x,.74,-1.72]} s={[.38,.18,.05]} color="#a95446"/></group>)}<Box p={[0,.4,1.75]} s={[1.6,.12,.07]} color="#737f73"/></group>;if(kind==='bike')return <group><Wheel x={0} z={-.85} r={.42}/><Wheel x={0} z={.85} r={.42}/><Box p={[0,.6,0]} s={[.22,.3,1.3]} color="#3e5547"/><Box p={[0,.97,-.22]} s={[.45,.15,.75]} color="#29372d"/><Box p={[0,.87,.3]} s={[.4,.3,.5]} color="#be8061"/><Box p={[0,1.3,.7]} s={[.9,.07,.08]} color="#bdc7b3"/><Box p={[0,.96,.87]} s={[.12,.8,.12]} color="#6c806c"/><group position={[0,.63,-.2]} scale={.8}><Person color="#788ba7" npc/></group></group>;return <group><Box p={[0,.65,-.25]} s={[1.4,.7,1.65]} color="#d5b548"/><Box p={[0,1.65,-.18]} s={[1.5,.14,1.8]} color="#3e5541"/>{[-.66,.66].map(x=><Box key={x} p={[x,1.22,-.2]} s={[.07,.8,1.4]} color="#5b704f"/>)}<Box p={[0,1.25,.66]} s={[1.3,.62,.04]} color="#4c6658"/><Wheel x={0} z={1.1}/><Wheel x={-.73} z={-.65}/><Wheel x={.73} z={-.65}/><Box p={[0,.65,1.07]} s={[.35,.5,.45]} color="#d5b548"/></group>;}
function Player() {
  const group = useRef<THREE.Group>(null!); const body = useRef<THREE.Group>(null!); const last = useRef(0); const aim = useMemo(() => new THREE.Vector3(), []); const cam = useMemo(() => new THREE.Vector3(), []);const angle=useRef(Math.PI);const elapsed=useRef(0);
  const driving=useGame(s=>s.driving),rideKind=useGame(s=>s.ride?.kind),character=useGame(s=>s.game.character),guards=useGame(s=>s.game.guards??0);
  useEffect(()=>{const ride=useGame.getState().ride;elapsed.current=ride?ride.progress*ride.duration:0;},[rideKind]);
  const position = useGame(s => s.game.position);
  useEffect(() => { controls.position = [...position]; if (group.current) group.current.position.set(position[0], 0, position[1]); }, [position]);
  useFrame(({ camera, clock }, dt) => {
    const state = useGame.getState(); if (!state.ready) return;
    const keys = controls.keys;
    const active = !state.paused && !state.modal && state.game.created && state.game.lives > 0 && !document.hidden;
    let sx = active ? controls.x + (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) : 0;
    let sz = active ? controls.z + (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) : 0;
    const length = Math.hypot(sx, sz); if (length > 1) { sx /= length; sz /= length; }
    const running = (controls.running || keys.has('shift')) && state.game.stats.energy > 10;
    const speed = (state.driving?vehicles[state.driving].speed*(running?1.35:.7):running ? 5 : 2.7) * Math.min(dt, .05);
    if(state.driving&&active)angle.current-=sx*Math.min(dt,.05)*1.9;
    const dx = state.driving?Math.sin(angle.current)*-sz*speed:(sx + sz) * .7071 * speed, dz = state.driving?Math.cos(angle.current)*-sz*speed:(sz - sx) * .7071 * speed;
    const p = controls.position;
    if(state.ride){if(active)elapsed.current+=Math.min(dt,1);const ride=state.ride,progress=Math.min(1,elapsed.current/ride.duration);const lengths=ride.route.slice(1).map((v,i)=>Math.hypot(v[0]-ride.route[i][0],v[1]-ride.route[i][1]));let distance=lengths.reduce((a,b)=>a+b,0)*progress;let i=0;while(i<lengths.length-1&&distance>lengths[i]){distance-=lengths[i];i++;}const ratio=lengths[i]?distance/lengths[i]:1;const a=ride.route[i],b=ride.route[i+1];p[0]=a[0]+(b[0]-a[0])*ratio;p[1]=a[1]+(b[1]-a[1])*ratio;angle.current=Math.atan2(b[0]-a[0],b[1]-a[1]);if(clock.elapsedTime-last.current>.2){useGame.setState({ride:{...ride,progress}});last.current=clock.elapsedTime;}if(progress>=1)state.arrive();}
    else {if (canMove(p[0] + dx, p[1])) p[0] += dx;if (canMove(p[0], p[1] + dz)) p[1] += dz;}
    group.current.position.set(p[0], 0, p[1]);
    if (state.driving||state.ride)body.current.rotation.y=angle.current;else if (length > .05) body.current.rotation.y = Math.atan2(dx, dz);
    body.current.position.y = !state.driving&&!state.ride&&length > .05 ? Math.abs(Math.sin(clock.elapsedTime * (running ? 13 : 9))) * .07 : 0;
    if (clock.elapsedTime - last.current > .4 && active && length > .05&&!state.ride) { state.update(g => ({ ...g, position: [...p] })); last.current = clock.elapsedTime; }
    aim.set(p[0],state.driving||state.ride?1.2:0,p[1]);
    if(state.driving||state.ride){cam.set(p[0]-Math.sin(angle.current)*7,4.6,p[1]-Math.cos(angle.current)*7);aim.x+=Math.sin(angle.current)*4;aim.z+=Math.cos(angle.current)*4;}else cam.set(aim.x + 18, 22, aim.z + 23);
    camera.position.lerp(cam, 1 - Math.exp(-dt * 3)); camera.lookAt(aim);
  });
  return <group ref={group}><group ref={body}>{driving||rideKind?<Vehicle kind={driving??rideKind!} color={character?.shirt}/>:<Person character={character} walking/>}</group>{!driving&&!rideKind&&Array.from({length:guards},(_,i)=><group key={i} position={[i%2?1.4:-1.4,0,-1.2-i*.7]}><Person color="#3d5145" npc/><Box p={[.36,.94,.08]} s={[.1,.14,.5]} color="#28362b"/></group>)}<mesh position={[0, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.42, .5, 32]} /><meshBasicMaterial color="#f2d391" transparent opacity={.85} /></mesh></group>;
}
const District = memo(function District({id}:{id:DistrictId}) {
  const d=districts.find(d=>d.id===id)!;const names:Record<DistrictId,string[]>={yaba:['ADE RESIDENCES','AMARA’S PROVISIONS','FEMI AUTO WORKS','OLUWASEUN HOUSE','IBILE STORES','YABA COMMUNITY'],ikorodu:['RIVER VIEW HOUSE','IKORODU MARKET','GENERAL HOSPITAL','SADE RESIDENCES','RIVERFRONT DEPOT','IKORODU TRADERS'],ikeja:['POLICE STATION','COMPUTER VILLAGE','EFCC FIELD OFFICE','DISPATCH OFFICE','IKEJA STORES','STATE ARCHIVES'],vi:['ISLAND CLINIC','ISLAND PROVISIONS','ISLAND LOGISTICS','EKO RESIDENCES','ATLANTIC HOUSE','VI BUSINESS HUB'],mainland:['COMMUNITY CENTER','NEIGHBORHOOD STORES','MAINLAND MOTORS','REPAIR YARD','MAINLAND TRADERS','COMMUNITY HOMES'],lekki:['GUEST HOUSE','WATERFRONT MARKET','LEKKI SECURITY','PALM ESTATE','LEKKI STORES','WATERFRONT HOMES']};
  const buildings = names[id].map((label,i)=>({label,color:i%2?d.color:'#a7ad91',h:(id==='vi'?9:id==='ikorodu'?4.5:6)+i%3}));
  return <group position={[d.x,0,d.z]}>{[-6, 6].map(x => <Box key={x} p={[x, .12, -4]} s={[1.2, .25, 28]} color="#a29d85" />)}{blockers.filter(b=>b.district===id).map((b, i) => <Building key={i} {...b} x={b.x-d.x} z={b.z-d.z} {...buildings[i]} index={i} />)}
    <Bus x={-4} z={14} rotation={Math.PI/2}/><Sign text={`${d.name.toUpperCase()} MOTOR PARK`} position={[-4,2.5,14]} width={4}/>
    {[[-5, -9], [5.5, 8], [-13, 0], [13, -10], [-11, 11], [10, 12], [-14, -15], [15, 3]].map(([x, z], i) => <Tree key={i} x={x} z={z} scale={i % 2 ? 1.1 : .9} />)}
    {[-5.4, 5.4].flatMap(x => [-10, 1, 10].map(z => <group key={`${x}-${z}`}><Box p={[x, 2.4, z]} s={[.1, 4.8, .1]} color="#465349" /><Box p={[x + (x > 0 ? -.5 : .5), 4.7, z]} s={[1, .1, .12]} color="#465349" /><Box p={[x + (x > 0 ? -1 : 1), 4.65, z]} s={[.5, .13, .3]} color="#e8d6a2" /></group>))}
    {locations.filter(l => l.district===id&&['tunde', 'shop', 'work','story','police','efcc','security'].includes(l.type)).map((l, i) => <group key={l.id} position={[l.x-d.x, 0, l.z-d.z]} rotation={[0, -.6, 0]}><Person color={['#738f79', '#b97950', '#9aa8aa'][i%3]} npc /></group>)}
    <group position={[-5.8, 0, 8]}><Box p={[0, .4, 0]} s={[.8, .8, .8]} color="#9c8861" /><Box p={[.8, .3, .1]} s={[.55, .6, .6]} color="#b5996a" /></group>
    <group position={[5, 0, -1]}><Box p={[0, .6, 0]} s={[.7, 1.2, .7]} color="#5b7761" /><Box p={[0, 1.22, 0]} s={[.8, .08, .8]} color="#364d3e" /></group>
    {Array.from({ length: 8 }, (_, i) => <Box key={i} p={[((i * 17) % 7 - 3) * 8, 3 + i % 5, -25 - Math.floor(i / 4) * 6]} s={[4, 6 + i % 7, 4]} color={i % 2 ? '#9b9f88' : '#878f7d'} />)}
  </group>;
});
function City(){const nearby=useGame(s=>districts.filter(d=>Math.hypot(d.x-s.game.position[0],d.z-s.game.position[1])<72).map(d=>d.id).join(','));const ride=useGame(s=>s.ride?.destination);return <><Box p={[0,-.35,-50]} s={[280,.6,190]} color="#77836a"/><Box p={[0,-.15,-143]} s={[280,.2,25]} color="#587c79"/>{[-100,0,100].map(x=><group key={x}><Box p={[x,-.02,-48]} s={[12,.15,153]} color="#626e62"/>{Array.from({length:42},(_,i)=><Box key={i} p={[x,.07,-122+i*3.5]} s={[.12,.02,1.5]} color="#b2ac8f"/>)}</group>)}{[-90,10].map(z=><Box key={z} p={[0,-.02,z]} s={[250,.15,7]} color="#626e62"/>)}{districts.filter(d=>nearby.split(',').includes(d.id)||d.id===ride).map(d=><District key={d.id} id={d.id}/>)}</>;}
function Traffic(){const groups=useRef<(THREE.Group|null)[]>([]);const time=useRef(Date.now()/1000);const immunity=useRef(0);useFrame((_,dt)=>{const s=useGame.getState();if(s.paused||s.modal||!s.game.created||document.hidden)return;time.current+=Math.min(dt,.05);trafficAt(time.current).forEach((t,i)=>{const group=groups.current[i];if(!group)return;group.position.set(t.x,0,t.z);group.rotation.y=t.angle;group.visible=Math.hypot(t.x-controls.position[0],t.z-controls.position[1])<65;if(!s.ride&&s.game.lives>0&&time.current>immunity.current&&Math.abs(t.x-controls.position[0])<(t.kind==='bike'?.65:1.25)&&Math.abs(t.z-controls.position[1])<(t.kind==='bus'?2.5:1.8)){immunity.current=time.current+8;s.damage(s.driving?45:100,s.driving?'Vehicle collision':'Traffic collision');}});});return <>{Array.from({length:18},(_,i)=><group key={i} ref={el=>{groups.current[i]=el;}}><Vehicle kind={(['car','bus','bike','keke'] as VehicleKind[])[i%4]} color={['#b6c2b0','#bd916e','#718e97'][i%3]}/></group>)}</>;}
function Markers() {
  const projected = useMemo(() => new THREE.Vector3(), []);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => { nodes.current = [...locations.map(l => document.getElementById(`marker-${l.id}`)), document.getElementById('marker-player')]; return () => nodes.current.forEach(el => { if (el) el.style.opacity = '0'; }); }, []);
  useFrame(({ camera, size }) => {
    nodes.current.forEach((el, i) => { if (!el) return; const l = locations[i]; projected.set(l ? l.x : controls.position[0], l?.type === 'home' ? 3 : 2.7, l ? l.z : controls.position[1]).project(camera); const x = (projected.x + 1) * size.width / 2, y = (1 - projected.y) * size.height / 2; const visible = (!l||Math.hypot(l.x-controls.position[0],l.z-controls.position[1])<38)&&projected.z > -1 && projected.z < 1 && x > -80 && x < size.width + 80 && y > 0 && y < size.height; el.style.opacity = visible ? '1' : '0'; el.style.pointerEvents = visible ? 'auto' : 'none'; el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
  });
  return null;
}
export default function World() {
  const quality = useGame(s => s.quality);
  return <Canvas onCreated={()=>window.dispatchEvent(new Event('9lives-world-ready'))} shadows={quality === 'high'} dpr={quality === 'high' ? [1, 1.5] : 1} camera={{ position: [18, 22, 24], fov: 43, near: .1, far: 280 }} gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}><color attach="background" args={['#adb49a']} /><fog attach="fog" args={['#adb49a', 38, 125]} /><ambientLight intensity={1.2} color="#e5e3ce" /><hemisphereLight args={['#e8ead3', '#536246', 1.3]} /><directionalLight position={[-15, 24, 10]} intensity={2.7} color="#ffe0a3" castShadow={quality === 'high'} shadow-mapSize={[1024, 1024]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-bias={-.001} /><City /><Player /><Traffic/><Markers /></Canvas>;
}
