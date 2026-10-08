import {useEffect,useState} from 'react';
import {Navigation,LocateFixed} from 'lucide-react';
import {controls,locations,useGame,type Save} from './game';
import {districtAt,districts} from '../shared/city';
import {cameraControl} from './camera';
import {approachPlace} from './navigation';
export function missionTarget(g:Save){if(g.sim?.job){const job=g.sim.job,d=job.stage===0?districtAt(...g.position):districts.find(d=>d.id===job.destination);if(job.kind==='delivery'||job.kind==='taxi')return locations.find(l=>l.id==='terminal-'+d?.id);}const id=({meet:'tunde',offer:'tunde',delivery:'delivery',trust:'amara-contact',ledger:'river',evidence:'efcc',contract:'corporate'} as Record<string,string>)[g.stage];return locations.find(l=>l.id===id);}
export function MovementUI(){const [stick,setStick]=useState({visible:false,x:0,y:0,dx:0,dy:0}),[heading,setHeading]=useState({angle:0,distance:0}),g=useGame(s=>s.game),modal=useGame(s=>s.modal),target=missionTarget(g);
 useEffect(()=>{const changed=(e:Event)=>setStick((e as CustomEvent).detail);window.addEventListener('9lives-joystick',changed);return()=>window.removeEventListener('9lives-joystick',changed);},[]);
 useEffect(()=>{const tick=()=>{if(target)setHeading({distance:Math.hypot(target.x-controls.position[0],target.z-controls.position[1]),angle:Math.atan2(target.x-controls.position[0],-(target.z-controls.position[1]))+cameraControl.yaw});};tick();const timer=setInterval(tick,300);return()=>clearInterval(timer);},[target?.id]);
 return <>{stick.visible&&!modal&&<div className="floating-joystick" style={{left:stick.x,top:stick.y}} aria-label="Active movement joystick"><span style={{transform:`translate(${stick.dx}px,${stick.dy}px)`}}/></div>}{target&&!g.interior&&!modal&&<button className="mission-guide" onClick={()=>approachPlace(target.id)}><Navigation size={18} style={{transform:`rotate(${heading.angle}rad)`}}/><span><strong>{target.name}</strong><small>{heading.distance<3?'Arrived · interact':`${Math.round(heading.distance)} m · tap to walk`}</small></span></button>}<button className="recenter-camera" aria-label="Recenter camera" onClick={()=>{cameraControl.yaw=.665;cameraControl.pitch=.72;cameraControl.distance=g.interior?26:34;}}><LocateFixed size={17}/></button><div className="movement-zone-hint">Tap to walk · hold left to move · drag right to look</div></>;
}
