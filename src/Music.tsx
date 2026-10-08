import { useEffect, useRef, useState } from 'react';
import { useGame } from './game';

// An original synthesized city-radio loop; no external recordings or downloads.
export function Music() {
  const [playing,setPlaying]=useState(false);const audio=useRef<AudioContext|null>(null);
  useEffect(()=>{if(!playing)return;const context=audio.current??new AudioContext();audio.current=context;void context.resume();let beat=0;
    const notes=[220,261.63,329.63,293.66,220,196,261.63,293.66];
    const timer=setInterval(()=>{const state=useGame.getState();if(document.hidden||state.paused)return;const start=context.currentTime;
      const note=(frequency:number,duration:number,volume:number,type:OscillatorType)=>{const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};};
      note(notes[beat%8],.23,.018,'triangle');if(beat%2===0)note(55,.18,.035,'sine');if(beat%4===2)note(1400,.045,.006,'square');beat++;
    },260);return()=>{clearInterval(timer);void context.suspend();};
  },[playing]);
  useEffect(()=>()=>{void audio.current?.close();},[]);
  return <button aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?'♫ Radio on':'♫ Radio off'}</button>;
}
