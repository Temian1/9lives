import {useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {VehicleKind} from '../shared/city';
import type {CarMods} from './empire';
import {Person} from './SceneParts';
type V3=[number,number,number];
// Shared geometries/materials keep many traffic cars cheap to draw.
const geometries=new Map<string,THREE.BufferGeometry>();
const geometry=(key:string,make:()=>THREE.BufferGeometry)=>{let g=geometries.get(key);if(!g){g=make();geometries.set(key,g);}return g;};
const box=(s:V3,r=0)=>geometry(`box${s.join(',')}/${r}`,()=>r?new RoundedBoxGeometry(s[0],s[1],s[2],3,r):new THREE.BoxGeometry(...s));
const cylinder=(r:number,h:number,n:number)=>geometry(`cyl${r},${h},${n}`,()=>new THREE.CylinderGeometry(r,r,h,n));
const materials=new Map<string,THREE.Material>();
const material=(key:string,make:()=>THREE.Material)=>{let m=materials.get(key);if(!m){m=make();materials.set(key,m);}return m;};
const paint=(color:string)=>material('paint'+color,()=>new THREE.MeshPhysicalMaterial({color,metalness:.45,roughness:.32,clearcoat:1,clearcoatRoughness:.12}));
const flat=(color:string,roughness=.8,metalness=0)=>material(`flat${color}${roughness}${metalness}`,()=>new THREE.MeshStandardMaterial({color,roughness,metalness}));
const glass=(tint:boolean)=>material('glass'+tint,()=>new THREE.MeshPhysicalMaterial({color:tint?'#06090b':'#22343b',metalness:.1,roughness:.04,transparent:true,opacity:tint?.96:.78,clearcoat:1}));
const chrome=()=>material('chrome',()=>new THREE.MeshStandardMaterial({color:'#dfe3e2',metalness:1,roughness:.18}));
const lamp=(color:string,on:boolean)=>material(`lamp${color}${on}`,()=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:on?2.4:.25,roughness:.3}));
let plateTexture:THREE.CanvasTexture|undefined;
function plate(){if(plateTexture)return plateTexture;const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d')!;x.fillStyle='#f4f4ee';x.fillRect(0,0,256,96);x.fillStyle='#1d7a3c';x.font='bold 18px sans-serif';x.textAlign='center';x.fillText('LAGOS · CENTRE OF EXCELLENCE',128,22,240);x.fillStyle='#1b2a8a';x.font='bold 46px sans-serif';x.fillText('LND 9L·24',128,72,236);plateTexture=new THREE.CanvasTexture(c);plateTexture.colorSpace=THREE.SRGBColorSpace;return plateTexture;}
// dispose={null}: geometry and materials are shared between every vehicle instance.
const B=({p,s,m,r=0,rot}:{p:V3;s:V3;m:THREE.Material;r?:number;rot?:V3})=><mesh position={p} rotation={rot} material={m} geometry={box(s,r)} castShadow receiveShadow dispose={null}/>;
function Plate({z,y=.5}:{z:number;y?:number}){return <mesh position={[0,y,z]} rotation={[0,z<0?Math.PI:0,0]} geometry={geometry('plate',()=>new THREE.PlaneGeometry(.5,.19))} material={material('plate',()=>new THREE.MeshStandardMaterial({map:plate(),roughness:.6}))} dispose={null}/>;}
function Wheel({x,z,r=.36,w=.24,rim='#dfe3e2',wheels}:{x:number;z:number;r?:number;w?:number;rim?:string;wheels:React.MutableRefObject<THREE.Group[]>}){
 return <group position={[x,r,z]} ref={g=>{if(g&&!wheels.current.includes(g))wheels.current.push(g);}}><mesh rotation={[0,0,Math.PI/2]} material={flat('#161918',.92)} geometry={cylinder(r,w,18)} castShadow dispose={null}/><mesh rotation={[0,0,Math.PI/2]} material={rim==='#dfe3e2'?chrome():flat(rim,.25,.9)} geometry={cylinder(r*.62,w+.02,10)} dispose={null}/>{[0,1,2].map(i=><mesh key={i} rotation={[i*Math.PI/3,0,0]} position={[x>0?w/2+.01:-w/2-.01,0,0]} material={flat('#3b4140',.4,.6)} geometry={box([.02,r*1.1,.06])} dispose={null}/>)}</group>;
}
function Lights({front,back,y,x,on}:{front:number;back:number;y:number;x:number;on:boolean}){return <>{[-x,x].map(lx=><group key={lx}><B p={[lx,y,front]} s={[.34,.13,.05]} m={lamp('#fff2c2',on)}/><B p={[lx,y+.02,back]} s={[.32,.12,.05]} m={lamp('#d0392b',on)}/></group>)}</>;}
type Props={kind:VehicleKind;color?:string;mods?:CarMods;lights?:boolean;spin?:React.MutableRefObject<number>};
export function Vehicle({kind,color='#b9c6b3',mods={},lights=false,spin}:Props){
 const wheels=useRef<THREE.Group[]>([]);
 useFrame((_,dt)=>{if(!spin)return;const turn=spin.current*Math.min(dt,.05)/.36;for(const w of wheels.current)w.rotation.x+=turn;});
 const body=paint(mods.paint??(kind==='taxi'?'#e6b422':kind==='bus'?'#e8b923':kind==='keke'?'#e2c23a':color)),tint=!!mods.tint,armor=mods.armor??0,rim=(mods.tires??0)>=3?'#c9a04a':'#dfe3e2',low=-(mods.suspension??0)*.03;
 const common={wheels};let model:ReactNode;
 const armour=(len:number,y:number,x:number)=>armor>0&&<>{[-x,x].map(ax=><B key={ax} p={[ax,y,0]} s={[.05,.3,len]} m={flat('#3c4245',.5,.7)}/>)}<B p={[0,y-.05,len/2+.18]} s={[1.3,.12,.08]} m={flat('#2d3133',.5,.8)}/></>;
 if(kind==='car'||kind==='taxi'||kind==='luxury'){const lux=kind==='luxury',len=lux?3.9:3.45,half=len/2;
  model=<group position={[0,low,0]}>
   <B p={[0,.6,0]} s={[1.74,.5,len]} m={body} r={.14}/><B p={[0,.87,half-.75]} s={[1.6,.08,1.1]} m={body} r={.03}/>
   <B p={[0,1.1,-.15]} s={[1.5,.56,lux?2.1:1.75]} m={body} r={.16}/>
   <B p={[0,1.12,(lux?1.05:.88)-.15]} s={[1.32,.46,.04]} m={glass(tint)} rot={[-.55,0,0]}/><B p={[0,1.12,-(lux?1.05:.88)-.15]} s={[1.32,.42,.04]} m={glass(tint)} rot={[.5,0,0]}/>
   {[-.756,.756].map(x=><B key={x} p={[x,1.14,-.15]} s={[.02,.34,lux?1.8:1.45]} m={glass(tint)}/>)}
   {[-.874,.874].flatMap(x=>[.15,-.55].map(z=><B key={x+','+z} p={[x,.66,z]} s={[.01,.4,.02]} m={flat('#1f2523')}/>))}
   {[-.92,.92].map(x=><B key={x} p={[x,1,.62]} s={[.16,.09,.07]} m={body}/>)}
   <B p={[0,.42,half+.02]} s={[1.78,.2,.16]} m={flat('#262a29',.6)}/><B p={[0,.42,-half-.02]} s={[1.78,.2,.16]} m={flat('#262a29',.6)}/>
   <B p={[0,.64,half+.005]} s={[.86,.16,.03]} m={lux?chrome():flat('#151817',.5)}/>{lux&&[-.875,.875].map(x=><B key={x} p={[x,.78,0]} s={[.01,.03,len-.4]} m={chrome()}/>)}
   <Lights front={half+.01} back={-half-.01} y={.75} x={.58} on={lights}/><Plate z={half+.1} y={.42}/><Plate z={-half-.1} y={.42}/>
   {kind==='taxi'&&<><B p={[0,1.44,-.15]} s={[.6,.16,.28]} m={lamp('#f7f1d0',lights)}/>{[-.876,.876].map(x=><B key={x} p={[x,.72,0]} s={[.01,.1,len-.6]} m={flat('#151515')}/>)}</>}
   {(mods.engine??0)>=2&&<B p={[0,.95,half-.85]} s={[.5,.1,.5]} m={flat('#1b1e1d',.4,.5)}/>}{armour(len-.8,.68,.885)}
   {[-.82,.82].flatMap(x=>[half-.62,-half+.62].map(z=><Wheel key={x+','+z} x={x} z={z} rim={rim} {...common}/>))}
  </group>;}
 else if(kind==='suv'){model=<group position={[0,low,0]}>
   <B p={[0,.78,0]} s={[1.86,.66,3.75]} m={body} r={.12}/><B p={[0,1.42,-.15]} s={[1.76,.68,2.5]} m={body} r={.1}/>
   <B p={[0,1.44,1.12]} s={[1.6,.56,.04]} m={glass(tint)} rot={[-.25,0,0]}/>{[-.885,.885].map(x=><B key={x} p={[x,1.48,-.15]} s={[.02,.44,2.2]} m={glass(tint)}/>)}<B p={[0,1.46,-1.41]} s={[1.6,.5,.04]} m={glass(tint)}/>
   {[-.65,.65].map(x=><B key={x} p={[x,1.8,-.15]} s={[.05,.05,2.3]} m={chrome()}/>)}<mesh position={[0,.95,-1.98]} rotation={[Math.PI/2,0,0]} material={flat('#161918',.9)} geometry={cylinder(.38,.22,16)} dispose={null}/>
   <B p={[0,.5,1.92]} s={[1.9,.24,.16]} m={flat('#2a2e2d',.6)}/><B p={[0,.82,1.88]} s={[1.1,.26,.03]} m={chrome()}/><Lights front={1.885} back={-1.885} y={.95} x={.66} on={lights}/><Plate z={1.98} y={.5}/>
   {armour(2.6,.82,.95)}{[-.9,.9].flatMap(x=>[1.22,-1.22].map(z=><Wheel key={x+','+z} x={x} z={z} r={.43} w={.28} rim={rim} {...common}/>))}
  </group>;}
 else if(kind==='sports'){model=<group position={[0,low,0]}>
   <B p={[0,.46,0]} s={[1.84,.4,3.65]} m={body} r={.16}/><B p={[0,.78,-.25]} s={[1.38,.36,1.45]} m={body} r={.16}/>
   <B p={[0,.8,.45]} s={[1.2,.32,.04]} m={glass(tint)} rot={[-.95,0,0]}/>{[-.7,.7].map(x=><B key={x} p={[x,.8,-.3]} s={[.02,.24,1.1]} m={glass(tint)}/>)}
   <B p={[0,.98,-1.65]} s={[1.6,.05,.32]} m={flat('#151817',.4)}/>{[-.6,.6].map(x=><B key={x} p={[x,.82,-1.62]} s={[.06,.28,.1]} m={flat('#151817')}/>)}
   <B p={[0,.32,1.83]} s={[1.86,.12,.12]} m={flat('#151817')}/><Lights front={1.83} back={-1.83} y={.56} x={.62} on={lights}/>
   {[-.86,.86].flatMap(x=>[1.18,-1.18].map(z=><Wheel key={x+','+z} x={x} z={z} r={.34} w={.3} rim={rim} {...common}/>))}
  </group>;}
 else if(kind==='van'||kind==='bus'){const bus=kind==='bus',len=bus?4.1:4.3;model=<group position={[0,low,0]}>
   <B p={[0,1.1,0]} s={[1.9,1.45,len]} m={body} r={.12}/>
   <B p={[0,1.45,len/2+.005]} s={[1.6,.6,.04]} m={glass(tint)}/>
   {bus?[-.96,.96].flatMap(x=>[-1.35,-.45,.45].map(z=><B key={x+','+z} p={[x,1.5,z]} s={[.02,.48,.75]} m={glass(tint)}/>)):[-.96,.96].map(x=><B key={x} p={[x,1.5,1.4]} s={[.02,.45,.8]} m={glass(tint)}/>)}
   {bus&&<>{[-.957,.957].flatMap(x=>[.82,1.2].map(y=><B key={x+','+y} p={[x,y,0]} s={[.01,.07,len-.1]} m={flat('#141414')}/>))}<B p={[.957,1.05,1.05]} s={[.02,1.25,.9]} m={flat('#1a1f1d',.9)}/><group position={[.75,0,1.05]}><Person npc color="#8b6a4f"/></group>
    {[-.6,.6].map(x=><B key={x} p={[x,1.9,0]} s={[.05,.05,len-.6]} m={flat('#3a3f3c',.5,.6)}/>)}<B p={[0,1.98,-.4]} s={[1.2,.25,1]} m={flat('#7a5b3a')}/></>}
   {!bus&&<B p={[0,1.2,-.3]} s={[1.92,.5,2.2]} m={flat('#efe9da',.7)}/>}
   <B p={[0,.4,len/2+.02]} s={[1.94,.22,.14]} m={flat('#252928',.6)}/><B p={[0,.4,-len/2-.02]} s={[1.94,.22,.14]} m={flat('#252928',.6)}/><Lights front={len/2+.01} back={-len/2-.01} y={.75} x={.68} on={lights}/><Plate z={len/2+.1} y={.4}/>
   {armour(len-1,.9,.97)}{[-.9,.9].flatMap(x=>[len/2-.75,-len/2+.75].map(z=><Wheel key={x+','+z} x={x} z={z} r={.4} w={.26} rim={rim} {...common}/>))}
  </group>;}
 else if(kind==='keke'){model=<group position={[0,low,0]}>
   <B p={[0,.6,-.3]} s={[1.3,.55,1.5]} m={body} r={.12}/><B p={[0,.75,.75]} s={[.6,.5,.6]} m={body} r={.1}/>
   <B p={[0,1.82,-.15]} s={[1.42,.08,2]} m={flat('#2f6b45',.8)}/>{[-.66,.66].flatMap(x=>[.65,-1].map(z=><B key={x+','+z} p={[x,1.25,z]} s={[.05,1.1,.05]} m={flat('#2b2f2e',.5,.5)}/>))}
   <B p={[0,1.3,.68]} s={[1.2,.6,.03]} m={glass(false)}/><B p={[0,.85,-.55]} s={[1.1,.18,.55]} m={flat('#3b2e25')}/><B p={[0,1.15,-.85]} s={[1.1,.45,.1]} m={flat('#3b2e25')}/>
   <B p={[0,.95,.85]} s={[.7,.05,.05]} m={chrome()}/><group position={[0,.25,.3]} scale={.8}><Person npc color="#5d7d8e"/></group>
   <B p={[0,.7,1.06]} s={[.28,.15,.04]} m={lamp('#fff2c2',lights)}/><Wheel x={0} z={1.05} r={.3} w={.16} {...common}/>{[-.7,.7].map(x=><Wheel key={x} x={x} z={-.75} r={.3} w={.16} {...common}/>)}
  </group>;}
 else{const bicycle=kind==='bicycle';model=<group position={[0,low,0]}>
   <Wheel x={0} z={-.75} r={bicycle?.38:.4} w={bicycle?.05:.13} {...common}/><Wheel x={0} z={.75} r={bicycle?.38:.4} w={bicycle?.05:.13} {...common}/>
   {bicycle?<><B p={[0,.7,0]} s={[.05,.05,1.2]} m={body} rot={[.25,0,0]}/><B p={[0,.65,-.3]} s={[.05,.6,.05]} m={body}/><B p={[0,1,-.35]} s={[.18,.05,.3]} m={flat('#1d1d1d')}/><B p={[0,1.05,.65]} s={[.6,.04,.04]} m={chrome()}/></>
   :<><B p={[0,.62,0]} s={[.24,.3,1.15]} m={flat('#2f3433',.5,.4)}/><B p={[0,.86,.25]} s={[.42,.28,.5]} m={body} r={.1}/><B p={[0,.95,-.3]} s={[.38,.12,.8]} m={flat('#1d1d1d')}/><B p={[0,1.25,.68]} s={[.8,.05,.05]} m={chrome()}/><B p={[0,.98,.85]} s={[.08,.65,.08]} m={chrome()}/><B p={[0,1.02,.95]} s={[.2,.16,.08]} m={lamp('#fff2c2',lights)}/><B p={[0,.5,-.45]} s={[.12,.12,.7]} m={chrome()}/></>}
   <group position={[0,bicycle?.45:.63,-.2]} scale={.8}><Person color="#788ba7" npc/></group>
  </group>;}
 return <group>{model}{lights&&<mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[kind==='bus'?2.6:1.8,20]}/><meshBasicMaterial color="#000" transparent opacity={.25} depthWrite={false}/></mesh>}</group>;
}
