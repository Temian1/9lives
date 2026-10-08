import {controls,useGame} from './game';
import {trafficClock} from './trafficState';
import {citizens,unboardCitizen} from './citizens';
import {enterpriseOf,type EnterpriseCommand} from './enterprise';
import {dynamicBodies} from './crowd';
import {vehicles,type VehicleKind} from '../shared/city';
export let inspectedVehicle:{id:string;kind:VehicleKind;position:[number,number];moving:boolean;security:number}|null=null;
export function inspectVehicle(id:string,kind:VehicleKind,position:[number,number],moving=false){const s=useGame.getState();if(s.driving||s.ride||s.game.interior||s.paused||s.modal)return;if(Math.hypot(position[0]-controls.position[0],position[1]-controls.position[1])>6)return s.notify('Move within six metres to interact with this vehicle.');inspectedVehicle={id,kind,position:[...position],moving,security:moving?2:1};s.open('vehicle-interaction');}
export function takeVehicle(action:'theft'|'rob-vehicle'){const s=useGame.getState(),v=inspectedVehicle;if(!v)return;const witnesses=dynamicBodies().filter(b=>Math.hypot(v.position[0]-b.x,v.position[1]-b.z)<10).length;s.enterpriseAction({action,id:v.id,vehicle:v.kind,position:v.position,security:v.security,witnesses,receipt:`${action}-${v.id}-${s.game.day}-${Math.floor(s.game.minutes/5)}`});const current=useGame.getState(),e=enterpriseOf(current.game);if(e.stolen.includes(v.id)){const i=Number(v.id.replace('traffic-',''));for(const c of citizens.values())if(c.ride?.vehicle===i)unboardCitizen(c,v.position,current.game);controls.position=[...current.game.position];if(!e.chase&&!e.jail){current.open(null);current.useItem(vehicles[v.kind].key);}}else if(e.chase||e.jail){useGame.setState({selectedPlace:e.jail?'jail':'chase'});current.open('enterprise');}else current.open(null);}
