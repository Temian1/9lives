import {Canvas,useFrame} from '@react-three/fiber';
import {Suspense,useRef} from 'react';
import {Group} from 'three';
import {RiggedPerson} from './GameModels';
import type {Character} from './game';
function Turntable({character}:{character:Character}){const ref=useRef<Group>(null);useFrame((_,dt)=>{if(ref.current)ref.current.rotation.y+=dt*.2;});return <group ref={ref}><RiggedPerson character={character}/></group>;}
export default function CharacterPreview({character}:{character:Character}){return <div className="model-preview" aria-label="Animated 3D character preview"><Canvas camera={{position:[0,1.3,4.3],fov:35}} dpr={[1,1.5]}><ambientLight intensity={2}/><directionalLight position={[3,5,4]} intensity={3}/><Suspense fallback={null}><Turntable character={character}/></Suspense><mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.2,32]}/><meshStandardMaterial color="#354637"/></mesh></Canvas></div>;}
