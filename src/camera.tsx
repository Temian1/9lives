import {useThree} from '@react-three/fiber';
import {useEffect} from 'react';
import {useGame} from './game';
export const cameraControl = { yaw: .665, pitch: .72, distance: 34, insideYaw: 0, insidePitch: 0 };
export function CameraGestures() {
  const canvas=useThree(s=>s.gl.domElement);
  useEffect(()=>{

    const points=new Map<number,{x:number;y:number}>();let previousDistance=0;
    const down=(e:PointerEvent)=>{if(e.pointerType==='mouse'&&e.button!==2)return;canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});previousDistance=0;};
    const move=(e:PointerEvent)=>{const last=points.get(e.pointerId);if(!last)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const [a,b]=[...points.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(previousDistance)cameraControl.distance=Math.max(9,Math.min(65,cameraControl.distance*previousDistance/distance));previousDistance=distance;}else {const inside=useGame.getState().ride&&useGame.getState().passengerView;if(inside){cameraControl.insideYaw-=(e.clientX-last.x)*.006;cameraControl.insidePitch=Math.max(-.65,Math.min(.65,cameraControl.insidePitch+(e.clientY-last.y)*.004));}else{cameraControl.yaw-=(e.clientX-last.x)*.006;cameraControl.pitch=Math.max(.25,Math.min(1.25,cameraControl.pitch+(e.clientY-last.y)*.004));}}};
    const up=(e:PointerEvent)=>{points.delete(e.pointerId);previousDistance=0;};
    const wheel=(e:WheelEvent)=>{e.preventDefault();cameraControl.distance=Math.max(9,Math.min(65,cameraControl.distance+e.deltaY*.025));};
    const menu=(e:Event)=>e.preventDefault();canvas.style.touchAction='none';canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('contextmenu',menu);
    return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('contextmenu',menu);};
  },[canvas]);return null;
}
