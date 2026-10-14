import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {controls,useGame} from './game';
import {Box,Person,Sign} from './SceneParts';
import {empireData,type AnimalKind} from './empire';
import {enterpriseData} from './enterprise';
import {entrance,front,parcels,starterProperty} from '../shared/property';
import {worldFree} from './spatial';
import {clearSegment} from '../shared/navigation';
import {alarmCitizens} from './citizens';
import {raiders,raidRuntime,hurtRaider} from './raidState';
import {sfx} from './sfx';

const night=(minutes:number)=>minutes<6*60+30||minutes>18*60+40;
// ---------- Property defences and damage ----------
export function PropertyDamage({id}:{id:string}){
 const holding=useGame(s=>s.game.empire?.holdings[id]),level=useGame(s=>(s.game.properties??[starterProperty()]).find(p=>p.id===id)),raidHere=useGame(s=>s.game.empire?.raid?.status==='active'&&s.game.empire.raid.target===id),dark=useGame(s=>night(s.game.minutes)),parcel=parcels.find(p=>p.id===id)!;
 const smoke=useRef<THREE.Group>(null),alarm=useRef<THREE.MeshStandardMaterial>(null),dogs=useRef<THREE.Group>(null);
 const d=holding?.defenses??{},condition=holding?.condition??100,built=!!level&&level.kind!=='land'||parcel.built,half=built?4.2:(parcel.size??6)/2,roof=3.8+(level?.level??1)*.4;
 useFrame(({clock})=>{const t=clock.elapsedTime;if(smoke.current)smoke.current.children.forEach((c,i)=>{const k=(t*.35+i/6)%1;c.position.set(Math.sin(i*2.1+t*.4)*.6,roof*.6+k*4,Math.cos(i*1.7)*.5);c.scale.setScalar(.5+k*1.6);((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity=.45*(1-k);});
  if(alarm.current)alarm.current.emissiveIntensity=raidHere&&Math.floor(t*4)%2?3:.1;
  if(dogs.current)dogs.current.children.forEach((c,i)=>{const run=raidHere?2.2:.6,x=Math.sin(t*run*.5+i*2)*(half-.8);c.position.set(x,0,half-.45);c.rotation.y=Math.cos(t*run*.5+i*2)>0?Math.PI/2:-Math.PI/2;c.position.y=Math.abs(Math.sin(t*run*4+i))*.05;});});
 if(!holding)return null;
 const fence=d.fence??0,posts:[number,number][]=[];
 if(fence)for(let a=-half;a<=half+.01;a+=1.2){posts.push([a,-half],[-half,a],[half,a]);if(Math.abs(a)>1.4)posts.push([a,half]);}
 return <group rotation={[0,front(parcel).yaw,0]}>
  {fence>0&&<>{posts.map(([x,z],i)=><Box key={i} p={[x,.7,z]} s={[.1,1.4,.1]} color={fence>=2?'#5b605d':'#8f7957'}/>)}
   {[[0,-half,half*2,'x'],[-half,0,half*2,'z'],[half,0,half*2,'z'],[-(half+1.4)/2,half,half-1.4,'x'],[(half+1.4)/2,half,half-1.4,'x']].map(([x,z,len,axis],i)=><group key={i}><Box p={[x as number,.9,z as number]} s={axis==='x'?[len as number,.9,.05]:[.05,.9,len as number]} color={fence>=2?'#c9c3b4':'#a48a62'}/>{fence>=3&&<mesh position={[x as number,1.55,z as number]} rotation={axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0]}><torusGeometry args={[.12,.02,4,10]}/><meshStandardMaterial color="#d8dcdc" metalness={1} roughness={.3}/></mesh>}</group>)}</>}
  {(d.gate??0)>0&&[-1,1].map(side=><group key={side} position={[side*1.4,0,half]} rotation={[0,side*-.9,0]}><Box p={[side*-.6,.9,0]} s={[1.2,1.8,.06]} color={d.gate!>=2?'#2d3a33':'#4c5a4f'}/>{Array.from({length:4},(_,i)=><Box key={i} p={[side*-.6+(-.45+i*.3),.9,.04]} s={[.04,1.7,.04]} color="#9aa59c"/>)}</group>)}
  {(d.bars??0)>0&&built&&[-1.5,1.5].flatMap(x=>[1.2,2.4].map(y=><group key={x+','+y} position={[x,y,3.06]}>{[-.3,0,.3].map(o=><Box key={o} p={[o,0,0]} s={[.03,.7,.03]} color="#1d2320"/>)}<Box p={[0,0,0]} s={[.8,.03,.03]} color="#1d2320"/></group>))}
  {(d.cctv??0)>0&&<group position={[half-.2,0,half-.2]}><Box p={[0,1.5,0]} s={[.08,3,.08]} color="#566265"/><Box p={[0,3,.15]} s={[.18,.14,.36]} color="#e8e8e2"/><mesh position={[0,3.02,.34]}><sphereGeometry args={[.035,6,6]}/><meshStandardMaterial color="#ff2a1f" emissive="#ff2a1f" emissiveIntensity={2}/></mesh></group>}
  {(d.floodlight??0)>0&&<group position={[-half+.2,0,half-.2]}><Box p={[0,1.6,0]} s={[.08,3.2,.08]} color="#566265"/><Box p={[0,3.2,.12]} s={[.4,.22,.12]} color={dark?'#fff6d8':'#c9c6b5'}/>{dark&&<pointLight position={[0,3,1]} intensity={6*(d.floodlight??1)} distance={11} color="#fff2d0"/>}</group>}
  {(d.alarm??0)>0&&built&&<mesh position={[2.2,3.1,3.06]}><boxGeometry args={[.3,.3,.1]}/><meshStandardMaterial ref={alarm} color="#c73a2e" emissive="#ff3b2b" emissiveIntensity={.1}/></mesh>}
  {(d.solar??0)>0&&built&&<group position={[0,roof+.05,0]}>{[-1.2,1.2].map(x=><mesh key={x} position={[x,0,0]} rotation={[-.35,0,0]}><boxGeometry args={[2,.05,1.3]}/><meshStandardMaterial color="#1c2e52" metalness={.6} roughness={.25}/></mesh>)}</group>}
  {(d.gateman??0)>0&&<group position={[1.7,0,half+.6]}><Person npc color="#2e4a3a"/><Sign text="MAI-GUARD" position={[0,2.2,0]} width={1.3}/></group>}
  <group ref={dogs}>{Array.from({length:Math.min(2,d.dogs??0)},(_,i)=><Dog key={i}/>)}</group>
  {condition<70&&[[-2,-.5],[1.5,1.8],[2.6,-2]].slice(0,condition<45?3:1).map(([x,z],i)=><Box key={i} p={[x,.15,z]} s={[.7,.3,.5]} color="#6b6158"/>)}
  {condition<45&&built&&<><Box p={[-1.5,1.6,3.07]} s={[.9,.7,.04]} color="#5a432c"/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.03,3.4]}><circleGeometry args={[1.4,16]}/><meshStandardMaterial color="#2a2522" transparent opacity={.55}/></mesh></>}
  {condition<30&&<group ref={smoke}>{Array.from({length:6},(_,i)=><mesh key={i}><sphereGeometry args={[.5,8,6]}/><meshStandardMaterial color="#4a4744" transparent opacity={.4} depthWrite={false}/></mesh>)}</group>}
 </group>;
}
function Dog(){return <group><Box p={[0,.38,0]} s={[.28,.26,.62]} color="#b0874f"/><Box p={[0,.55,.36]} s={[.22,.22,.26]} color="#a27a45"/><Box p={[0,.5,.52]} s={[.12,.1,.12]} color="#2b211a"/>{[-.09,.09].map(x=><Box key={x} p={[x,.7,.3]} s={[.06,.1,.05]} color="#5d4426"/>)}{[-.1,.1].flatMap(x=>[-.22,.22].map(z=><Box key={x+','+z} p={[x,.13,z]} s={[.07,.26,.07]} color="#8f6c3e"/>))}<Box p={[0,.5,-.36]} s={[.05,.05,.25]} color="#8f6c3e" rotation={[.6,0,0]}/></group>;}

// ---------- Livestock ----------
function Animal({kind}:{kind:AnimalKind}){
 if(kind==='goat'||kind==='ram'){const ram=kind==='ram';return <group scale={ram?1.2:.9}><Box p={[0,.45,0]} s={[.3,.3,.6]} color={ram?'#e9e2d0':'#6e4b32'}/><Box p={[0,.62,.34]} s={[.18,.2,.22]} color={ram?'#ded4bd':'#5d3f2a'}/>{ram?[-.12,.12].map(x=><mesh key={x} position={[x,.7,.3]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.07,.025,6,10]}/><meshStandardMaterial color="#b6a382"/></mesh>):[-.06,.06].map(x=><Box key={x} p={[x,.78,.3]} s={[.03,.14,.03]} color="#d8cfb8" rotation={[-.4,0,0]}/>)}{[-.1,.1].flatMap(x=>[-.2,.2].map(z=><Box key={x+','+z} p={[x,.16,z]} s={[.06,.32,.06]} color="#3f2d1f"/>))}</group>;}
 if(kind==='pig')return <group><mesh position={[0,.32,0]} scale={[1,.85,1.5]}><sphereGeometry args={[.26,12,10]}/><meshStandardMaterial color="#e7b3a4" roughness={.7}/></mesh><mesh position={[0,.32,.4]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.08,.09,.06,10]}/><meshStandardMaterial color="#d99686"/></mesh>{[-.09,.09].flatMap(x=>[-.18,.18].map(z=><Box key={x+','+z} p={[x,.08,z]} s={[.06,.16,.06]} color="#d49a8a"/>))}</group>;
 if(kind==='catfish'||kind==='tilapia')return <group><mesh scale={[.35,.25,1]}><sphereGeometry args={[.22,8,6]}/><meshStandardMaterial color={kind==='catfish'?'#3d4a45':'#8a9a8c'} metalness={.3} roughness={.4}/></mesh><Box p={[0,0,-.24]} s={[.02,.12,.1]} color={kind==='catfish'?'#3d4a45':'#8a9a8c'}/></group>;
 if(kind==='snail')return <group><mesh position={[0,.12,-.03]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.08,.06,8,12]}/><meshStandardMaterial color="#8a5a33"/></mesh><Box p={[0,.04,.06]} s={[.07,.05,.22]} color="#c9b48d"/></group>;
 if(kind==='rabbit')return <group><mesh position={[0,.15,0]} scale={[1,.9,1.3]}><sphereGeometry args={[.13,10,8]}/><meshStandardMaterial color="#f2efe8"/></mesh><mesh position={[0,.24,.14]}><sphereGeometry args={[.08,8,8]}/><meshStandardMaterial color="#f2efe8"/></mesh>{[-.03,.03].map(x=><Box key={x} p={[x,.38,.12]} s={[.03,.16,.04]} color="#eedede"/>)}</group>;
 return <group><mesh position={[0,.22,0]} scale={[1,.9,1.25]}><sphereGeometry args={[.16,10,8]}/><meshStandardMaterial color="#4a4d55"/></mesh><mesh position={[0,.4,.14]}><sphereGeometry args={[.06,8,6]}/><meshStandardMaterial color="#d7d2c4"/></mesh><Box p={[0,.47,.14]} s={[.03,.06,.03]} color="#c33b2b"/></group>;
}
function Herds(){
 const herds=useGame(s=>s.game.empire?.herds),plots=useGame(s=>s.game.enterprise?.plots),position=useGame(s=>s.game.position),group=useRef<THREE.Group>(null);
 useFrame(({clock})=>{group.current?.traverse(o=>{const a=o.userData.animal as {x:number;z:number;w:number;d:number;i:number;fish?:boolean}|undefined;if(!a)return;const t=clock.elapsedTime*(a.fish?.8:.25)+a.i*1.7;o.position.set(a.x+Math.sin(t)*a.w*.32,a.fish?.3:.06,a.z+Math.cos(t*1.3)*a.d*.32);o.rotation.y=Math.atan2(Math.cos(t)*a.w,-Math.sin(t*1.3)*a.d*1.3);});});
 const items:{key:string;kind:AnimalKind;x:number;z:number;w:number;d:number;i:number}[]=[];
 for(const [id,herd] of Object.entries(herds??{})){const parcel=parcels.find(p=>p.id===id),blocks=plots?.[id]?.blocks??[];if(!parcel||Math.hypot(parcel.x-position[0],parcel.z-position[1])>70)continue;
  for(const [kind,h] of Object.entries(herd) as [AnimalKind,{count:number;young:number}][]){const homes=blocks.filter(b=>b.kind===empireData.animals[kind].housing&&b.y===0);let left=Math.min(16,h.count+h.young);homes.forEach((b,bi)=>{const spec=enterpriseData.blocks[b.kind],rot=b.rotation%2===1,w=rot?spec.d:spec.w,d=rot?spec.w:spec.d;for(let i=0;i<Math.min(left,4);i++)items.push({key:`${id}-${kind}-${bi}-${i}`,kind,x:parcel.x+b.x,z:parcel.z+b.z,w,d,i});left-=4;});}}
 return <group ref={group}>{items.map(a=><group key={a.key} userData={{animal:{...a,fish:a.kind==='catfish'||a.kind==='tilapia'}}}><Animal kind={a.kind}/></group>)}</group>;
}

// ---------- Live raid ----------
const armed=(kind:string)=>kind==='armed-robbers'||kind==='rival-thugs'||kind==='car-snatchers';
function Raiders(){
 const raid=useGame(s=>s.game.empire?.raid?.status==='active'?s.game.empire.raid:undefined),refs=useRef<(THREE.Group|null)[]>([]),tracer=useRef<THREE.Group>(null),flash=useRef(0),last=useRef(0);
 const setup=useMemo(()=>{if(!raid)return null;const parcel=parcels.find(p=>p.id===raid.target);if(!parcel)return null;const f=front(parcel),door=entrance(parcel);return {door,f,start:[door[0]+f.dir[0]*11,door[1]+f.dir[1]*11] as [number,number]};},[raid?.id]);
 useEffect(()=>{raiders.clear();if(!raid||!setup)return;raidRuntime.id=raid.id;raidRuntime.breach=0;raidRuntime.reported=false;const lateral:[number,number]=[setup.f.dir[1],-setup.f.dir[0]];
  for(let i=0;i<raid.initial;i++){const spread=(i-(raid.initial-1)/2)*1.3;raiders.set(`${raid.id}-${i}`,{id:`${raid.id}-${i}`,index:i,position:[setup.start[0]+lateral[0]*spread,setup.start[1]+lateral[1]*spread],hp:i<raid.initial-raid.attackers?0:100,down:i<raid.initial-raid.attackers,cooldown:1.5+i*.7,reported:i<raid.initial-raid.attackers});}
  alarmCitizens(setup.door,28,25);sfx('raid');const g=useGame.getState().game;if(g.empire?.holdings[raid.target]?.defenses.alarm)sfx('alarm');if(g.empire?.holdings[raid.target]?.defenses.dogs)sfx('dog');
  return()=>raiders.clear();},[raid?.id,setup]);
 useFrame(({clock},dt)=>{
  const s=useGame.getState(),r=s.game.empire?.raid;if(!r||r.status!=='active'||!setup||s.paused||s.modal||s.game.interior)return;const step=Math.min(dt,.05),free=worldFree(s.game),defenses=s.game.empire?.holdings[r.target]?.defenses??{},player=controls.position;
  if(tracer.current){flash.current=Math.max(0,flash.current-step);tracer.current.visible=flash.current>0;}
  for(const raider of raiders.values()){const node=refs.current[raider.index];if(!node)continue;
   if(raider.down){node.rotation.x=Math.max(-1.45,node.rotation.x-step*4);node.userData.walking=false;if(!raider.reported){raider.reported=true;s.empireAction({action:'hit-raider',receipt:`raider-${raider.id}`});}continue;}
   const lateral=(raider.index-(r.initial-1)/2)*.9,target:[number,number]=[setup.door[0]+setup.f.dir[1]*lateral,setup.door[1]-setup.f.dir[0]*lateral],dx=target[0]-raider.position[0],dz=target[1]-raider.position[1],dist=Math.hypot(dx,dz),toPlayer=Math.hypot(player[0]-raider.position[0],player[1]-raider.position[1]);
   // Close in on the player when they stand in the way; otherwise head for the door.
   const chase=toPlayer<5&&!s.driving,goal=chase?player:target,gx=goal[0]-raider.position[0],gz=goal[1]-raider.position[1],gl=Math.hypot(gx,gz);node.userData.walking=false;
   if(gl>(chase?1.2:.5)){const speed=(chase?2:1.5)*step;for(const turn of [0,.7,-.7,1.4,-1.4]){const c=Math.cos(turn),sn=Math.sin(turn),nx=raider.position[0]+(gx*c-gz*sn)/gl*speed,nz=raider.position[1]+(gz*c+gx*sn)/gl*speed;if(free(nx,nz)){raider.position=[nx,nz];node.userData.walking=true;break;}}node.rotation.y=Math.atan2(gx,gz);}
   else if(!chase&&dist<1.6){raidRuntime.breach+=step*(1-Math.min(.6,((defenses.gate??0)+(defenses.bars??0))*.1));}
   if(dist<8){const dps=(defenses.dogs??0)*4+(defenses.gateman??0)*5;if(dps&&hurtRaider(raider,dps*step))sfx('dog');}
   raider.cooldown-=step;
   if(raider.cooldown<=0&&!s.game.interior){
    if(armed(r.kind)&&toPlayer<14&&clearSegment(raider.position,[player[0],player[1]],free)){raider.cooldown=2.6+Math.random()*1.6;sfx('enemy-shot',Math.max(.3,1-toPlayer/16));if(tracer.current){tracer.current.position.set(raider.position[0],1.3,raider.position[1]);tracer.current.lookAt(player[0],1.2,player[1]);tracer.current.scale.z=toPlayer;flash.current=.08;}if(Math.random()<.6-toPlayer*.03)s.damage(s.driving?5:9,'Raid gunfire');}
    else if(toPlayer<1.6&&!s.driving){raider.cooldown=2;s.damage(6,'Raid attack');sfx('hit');}
    else raider.cooldown=.8;}
   // Bodyguards return fire.
   const guards=s.game.guards??0;if(guards&&toPlayer<16&&Math.random()<step*guards*.25&&hurtRaider(raider,40))sfx('enemy-shot',.6);
   node.position.set(raider.position[0],0,raider.position[1]);
  }
  if(raidRuntime.breach>=30&&!raidRuntime.reported&&clock.elapsedTime-last.current>1){raidRuntime.reported=true;last.current=clock.elapsedTime;s.empireAction({action:'raid-breach',receipt:`breach-${r.id}`});}
 });
 if(!raid||!setup)return null;
 const outfit=raid.kind==='omo-onile'?'#7a4f2a':raid.kind==='burglars'?'#262626':raid.kind==='rival-thugs'?'#5b1f1f':'#1d1f24';
 return <><group ref={tracer} visible={false}><Box p={[0,0,.5]} s={[.03,.03,1]} color="#ffb85c"/></group>{Array.from({length:raid.initial},(_,i)=><group key={i} ref={g=>{refs.current[i]=g;}} userData={{walking:false}} position={[setup.start[0],0,setup.start[1]]}><Person npc character={{name:'raider',gender:'male',skin:['#4e3324','#6b4630','#3d281c'][i%3],shirt:outfit,hair:'#141414',hairstyle:'short',email:'',pants:'#151515',model:'character-'+'aceg'[i%4],accessory:i%2?'cap':'none'}}/><Sign text={empireData.raids[raid.kind].name.toUpperCase()} position={[0,2.25,0]} width={1.6} bg="#5b1f1f"/></group>)}</>;
}
export function EmpireWorld(){const interior=useGame(s=>!!s.game.interior);if(interior)return null;return <><Herds/><Raiders/><StarterDefense/></>;}
function StarterDefense(){const d=useGame(s=>s.game.empire?.holdings['house-yaba']?.defenses);if(!d)return null;return <group position={[-6,0,-1.6]}>{(d.gateman??0)>0&&<group position={[1.2,0,0]}><Person npc color="#2e4a3a"/><Sign text="MAI-GUARD" position={[0,2.2,0]} width={1.3}/></group>}{(d.cctv??0)>0&&<Box p={[-1,2.8,-1]} s={[.18,.14,.36]} color="#e8e8e2"/>}</group>;}
