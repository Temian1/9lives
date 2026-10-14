import {useEffect} from 'react';
import {controls,locations,useGame} from './game';
import {enterpriseOf,weather} from './enterprise';
import {telemetry,type Sfx} from './sfx';
// Every effect is synthesised locally with Web Audio; street voices use the browser's own speech engine.
export const audioSettings={voices:readVoices(),volume:1};
function readVoices(){try{return localStorage.getItem('9lives-voices')!=='off';}catch{return true;}}
export function setVoices(on:boolean){audioSettings.voices=on;try{localStorage.setItem('9lives-voices',on?'on':'off');}catch{/* private mode */}}
const conductor=['Oshodi! Oshodi! Enter with your change o!','CMS, Obalende, one chance remain!','Ojuelegba! Owa le! Come in, come in!','Wole! Wole! Fare na four hundred!'];
const hawker=['Pure water! Buy your cold pure water!','Gala! Buy your Gala and La Casera!','Hot puff-puff and boli!','Agege bread! Fresh bread dey!'];
export function Soundscape(){useEffect(()=>{
 let context:AudioContext|undefined,master:GainNode|undefined,noise:AudioBuffer|undefined;
 let engineA:OscillatorNode|undefined,engineB:OscillatorNode|undefined,engineGain:GainNode|undefined,engineFilter:BiquadFilterNode|undefined,skidGain:GainNode|undefined,humGain:GainNode|undefined,murmurGain:GainNode|undefined,murmurLfo:OscillatorNode|undefined;
 let lastStep=0,lastVoice=0,roosterDay=0;
 const loopNoise=(filter:BiquadFilterType,frequency:number,q=1)=>{const src=context!.createBufferSource();src.buffer=noise!;src.loop=true;const f=context!.createBiquadFilter();f.type=filter;f.frequency.value=frequency;f.Q.value=q;const gain=context!.createGain();gain.gain.value=0;src.connect(f);f.connect(gain);gain.connect(master!);src.start();return gain;};
 const start=()=>{context??=new AudioContext();if(!master){master=context.createGain();master.gain.value=.05;master.connect(context.destination);
   noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   engineFilter=context.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=700;engineGain=context.createGain();engineGain.gain.value=0;engineFilter.connect(engineGain);engineGain.connect(master);
   engineA=context.createOscillator();engineA.type='sawtooth';engineB=context.createOscillator();engineB.type='square';engineA.connect(engineFilter);const sub=context.createGain();sub.gain.value=.5;engineB.connect(sub);sub.connect(engineFilter);engineA.start();engineB.start();
   skidGain=loopNoise('bandpass',2600,4);humGain=context.createGain();humGain.gain.value=0;const hum=context.createOscillator();hum.type='sawtooth';hum.frequency.value=50;const humFilter=context.createBiquadFilter();humFilter.type='lowpass';humFilter.frequency.value=220;hum.connect(humFilter);humFilter.connect(humGain);humGain.connect(master);hum.start();
   murmurGain=loopNoise('bandpass',520,.7);murmurLfo=context.createOscillator();murmurLfo.frequency.value=.35;const depth=context.createGain();depth.gain.value=.08;murmurLfo.connect(depth);depth.connect(murmurGain.gain);murmurLfo.start();}
  void context.resume();};
 const live=()=>!!context&&!!master&&context.state==='running';
 const tone=(frequency:number,length=.1,type:OscillatorType='triangle',volume=.7,glide?:number,delay=0)=>{if(!live())return;const t=context!.currentTime+delay,osc=context!.createOscillator(),gain=context!.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,t);if(glide)osc.frequency.exponentialRampToValueAtTime(glide,t+length);gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+length);osc.connect(gain);gain.connect(master!);osc.start(t);osc.stop(t+length);osc.onended=()=>{osc.disconnect();gain.disconnect();};};
 const burst=(length:number,frequency:number,volume=1,type:BiquadFilterType='lowpass',delay=0)=>{if(!live())return;const t=context!.currentTime+delay,src=context!.createBufferSource(),f=context!.createBiquadFilter(),gain=context!.createGain();src.buffer=noise!;f.type=type;f.frequency.value=frequency;gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+length);src.connect(f);f.connect(gain);gain.connect(master!);src.start(t,Math.random());src.stop(t+length);src.onended=()=>{src.disconnect();gain.disconnect();};};
 const say=(line:string)=>{if(!audioSettings.voices||!('speechSynthesis' in window)||speechSynthesis.speaking)return;const u=new SpeechSynthesisUtterance(line),voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='en-NG')??voices.find(v=>v.lang.startsWith('en-GB'))??null;u.rate=1.05;u.pitch=.9+Math.random()*.3;u.volume=.55;speechSynthesis.speak(u);};
 const play:Record<Sfx,(v:number)=>void>={
  crash:v=>{burst(.55,900,1.6*v);tone(70,.4,'sawtooth',.9*v,35);burst(.25,4000,.6*v,'highpass',.08);},
  bump:v=>{burst(.18,500,.9*v);tone(90,.15,'sine',.6*v,60);},
  hit:()=>{burst(.09,1400,.9);tone(160,.08,'square',.4,90);},
  'enemy-shot':v=>{burst(.22,1800,1.3*v);tone(110,.18,'sawtooth',.5*v,50);},
  build:()=>{[0,.14,.28].forEach(d=>{burst(.07,900,1,'lowpass',d);tone(220,.06,'square',.25,140,d);});},
  cash:()=>{tone(1318,.12,'triangle',.5);tone(1760,.25,'triangle',.5,undefined,.09);burst(.05,6000,.25,'highpass');},
  confirm:()=>{tone(660,.08,'sine',.35);tone(990,.12,'sine',.35,undefined,.07);},
  deny:()=>{tone(220,.16,'square',.25,170);},
  alarm:()=>{for(let i=0;i<4;i++)tone(700,.45,'square',.35,1300,i*.5);},
  dog:()=>{[0,.35].forEach(d=>tone(420,.12,'square',.45,180,d));},
  raid:()=>{tone(196,.5,'sawtooth',.4,147);tone(147,.6,'sawtooth',.35,110,.45);[0,.25,.5,.75].forEach(d=>burst(.08,180,1.2,'lowpass',d));},
  victory:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.25,'triangle',.4,undefined,i*.11));},
  defeat:()=>{[392,330,262].forEach((f,i)=>tone(f,.35,'sawtooth',.25,undefined,i*.18));},
  horn:()=>{const bus=useGame.getState().driving==='bus';tone(bus?330:370,.3,'square',.5);tone(bus?415:466,.3,'square',.35);if(bus)tone(330,.3,'square',.5,undefined,.38);},
  skid:v=>burst(.35,2600,.6*v,'bandpass'),
 };
 const onSfx=(event:Event)=>{const {name,volume=1}=(event as CustomEvent<{name:Sfx;volume?:number}>).detail;play[name]?.(volume);};
 const shot=()=>{burst(.2,2200,1.4);tone(80,.16,'sawtooth',.6,45);};
 const key=(event:KeyboardEvent)=>{if(event.target instanceof HTMLElement&&event.target.matches('input,textarea,select'))return;if(event.key.toLowerCase()==='b'&&useGame.getState().driving)play.horn(1);};
 window.addEventListener('pointerdown',start,{once:true});window.addEventListener('keydown',start,{once:true});window.addEventListener('keydown',key);window.addEventListener('9lives-shot',shot);window.addEventListener('9lives-sfx',onSfx);
 const timer=setInterval(()=>{
  const s=useGame.getState(),g=s.game,active=g.created&&!s.paused&&!s.modal&&!document.hidden&&!g.interior,now=context?.currentTime??0,smooth=(p:AudioParam|undefined,v:number)=>p?.setTargetAtTime(v,now,.08);
  if(engineA&&engineB){const rpm=s.driving?telemetry.rpm:0,big=s.driving==='bus'||s.driving==='van'||s.driving==='suv',two=s.driving==='bike'||s.driving==='keke';engineA.frequency.setTargetAtTime((big?38:two?70:48)+rpm*(big?110:two?260:170),now,.05);engineB.frequency.setTargetAtTime(((big?38:two?70:48)+rpm*(big?110:two?260:170))/2,now,.05);smooth(engineGain?.gain,active&&s.driving&&s.driving!=='bicycle'?.18+telemetry.throttle*.18:0);smooth(engineFilter?.frequency,400+rpm*1800);}
  smooth(skidGain?.gain,active&&s.driving?Math.max(0,telemetry.slip-.25)*.9:0);
  const e=enterpriseOf(g),w=weather(g),generator=w.blackout&&Object.entries(e.plots).some(([,p])=>p.fuel>0&&p.blocks.some(b=>b.kind==='generator'));smooth(humGain?.gain,active&&generator?.06:0);
  const market=locations.some(l=>(l.type==='shop'||l.type==='terminal'||l.type==='hawker')&&Math.hypot(l.x-controls.position[0],l.z-controls.position[1])<14);smooth(murmurGain?.gain,active&&market&&g.minutes>6*60&&g.minutes<21*60?.12:0);
  if(!active)return;
  if(controls.moving&&!s.driving&&Date.now()-lastStep>(controls.running?220:380)){burst(.05,w.rain?1800:600,.5);lastStep=Date.now();}
  if(w.rain&&Math.random()<.35)tone(1600+Math.random()*1400,.04,'sawtooth',.25);if(w.storm&&Math.random()<.008){burst(1.6,160,1.6);tone(40,.9,'sawtooth',.6,28);}
  if(g.minutes>=6*60&&g.minutes<6*60+20&&roosterDay!==g.day&&locations.some(l=>Math.hypot(l.x-controls.position[0],l.z-controls.position[1])<40)){roosterDay=g.day;tone(520,.18,'sawtooth',.3,900);tone(900,.5,'sawtooth',.3,600,.2);}
  if(Date.now()-lastVoice>28000&&!s.driving){const park=locations.find(l=>l.type==='terminal'&&Math.hypot(l.x-controls.position[0],l.z-controls.position[1])<12),seller=locations.find(l=>(l.type==='hawker'||l.type==='shop')&&Math.hypot(l.x-controls.position[0],l.z-controls.position[1])<9);if(park||seller){lastVoice=Date.now();const list=park?conductor:hawker;say(list[Math.floor(Math.random()*list.length)]);}}
 },100);
 return()=>{clearInterval(timer);window.removeEventListener('pointerdown',start);window.removeEventListener('keydown',start);window.removeEventListener('keydown',key);window.removeEventListener('9lives-shot',shot);window.removeEventListener('9lives-sfx',onSfx);engineA?.stop();engineB?.stop();murmurLfo?.stop();if('speechSynthesis' in window)speechSynthesis.cancel();void context?.close();};
},[]);return null;}
