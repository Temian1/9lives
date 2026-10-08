import {enterpriseData,enterpriseDay,enterpriseOf} from './enterprise';
import { districts, districtAt, locations, vehicles, type VehicleKind } from '../shared/city';
import { buildTypes, entrance, furnishings, parcels, starterProperty, type Furniture } from '../shared/property';
import type { Save } from './game';

export type Lease = { id: string; rent: number; dueDay: number; arrears: number; warnings: number; deposit: number };
export type VehicleState = { fuel: number; condition: number; parked: [number,number] };
export type Job = { kind: 'delivery'|'taxi'|'repair'|'shop'; stage: number; destination: string; reward: number; startedDay: number };
export type Simulation = {
  bank: number; debt: number; loanDue: number; bills: number; lastDay: number;
  hygiene: number; cleanliness: number; stamina: number; injury: number; illness: number;
  leases: Lease[]; tenants: Record<string,{rent:number;dueDay:number}>;
  businesses: Record<string,{stock:number;staff:number;open:boolean;earned:number}>;
  garage: Partial<Record<VehicleKind,VehicleState>>; job?: Job;
  progress: { business:number;survival:number;reputation:number };
  messages: string[]; completed: string[]; selectedTarget?: string;
  guardMode: 'follow'|'protect'|'stay'; stored: string[]; editHome: boolean;
};
export const freshSimulation=(day=1):Simulation=>({bank:0,debt:0,loanDue:0,bills:0,lastDay:day,hygiene:85,cleanliness:90,stamina:100,injury:0,illness:0,leases:[],tenants:{},businesses:{},garage:{},progress:{business:1,survival:1,reputation:50},messages:['Welcome to Lagos. Your ₦1,000,000 starter fund is ready.'],completed:[],guardMode:'protect',stored:[],editHome:false});
export const simOf=(g:Save):Simulation=>g.sim??freshSimulation(g.day);
const cap=(n:number)=>Math.max(0,Math.min(100,n));
const addMessage=(s:Simulation,text:string)=>({...s,messages:[text,...s.messages].slice(0,25)});
export const rentPrice=(id:string)=>Math.max(1000,Math.round((parcels.find(p=>p.id===id)?.price??20000)*.05));
export const salePrice=(g:Save,id:string)=>{
  const p=(g.properties??[starterProperty()]).find(p=>p.id===id),parcel=parcels.find(p=>p.id===id);if(!p||!parcel)return 0;
  return Math.floor((parcel.price+(parcel.built?0:p.kind==='land'?0:buildTypes[p.kind].price)+(p.level-1)*5000+p.furniture.reduce((n,f)=>n+furnishings[f].price,0)+(p.walls?.length??0)*500+(g.enterprise?.plots[id]?.blocks??[]).reduce((n,b)=>n+enterpriseData.blocks[b.kind].cost,0))*.7);
};
export function simulationDay(g:Save):Save {
  let s=simOf(g);if(g.day<=s.lastDay)return g;
  let money=g.money,interior=g.interior,checkpoint=g.checkpoint;let leases=s.leases.map(l=>({...l}));const tenants={...s.tenants},businesses={...s.businesses};
  // Bounded catch-up: game time is paused offline, but sleep/work can advance days.
  for(let day=s.lastDay+1;day<=Math.min(g.day,s.lastDay+31);day++){
    for(const l of [...leases])if(day>l.dueDay){l.arrears+=l.rent;l.dueDay+=7;l.warnings++;s=addMessage(s,`Landlord: ${l.id} rent is overdue. Arrears ₦${l.arrears.toLocaleString()}. ${l.warnings>=2?'Final notice: pay before the next rent cycle.':'Please pay or negotiate.'}`);if(l.warnings>=3){leases=leases.filter(a=>a.id!==l.id);if(interior===l.id)interior=undefined;checkpoint=[-4,12];s=addMessage(s,'Landlord palava: you have been evicted after three unpaid rent cycles.');}}
    for(const [id,t] of Object.entries(tenants))if(day>=t.dueDay){money+=t.rent;tenants[id]={...t,dueDay:day+7};s=addMessage(s,`Tenant paid ₦${t.rent.toLocaleString()} for ${id}.`);}
    for(const [id,b] of Object.entries(businesses)){if(enterpriseOf(g).businesses[id]||!b.open)continue;const sold=Math.min(b.stock,4+b.staff*3);const revenue=sold*(650+s.progress.business*50),wages=b.staff*400;money+=revenue-wages;businesses[id]={...b,stock:b.stock-sold,earned:b.earned+revenue-wages};if(!sold)s=addMessage(s,`${id}: stock has run out. Restock to serve customers.`);}
    s={...s,bills:s.bills+500,hygiene:cap(s.hygiene-12),cleanliness:cap(s.cleanliness-8)};
    if(s.hygiene<20||s.cleanliness<20)s={...s,illness:cap(s.illness+15)};
    if(s.debt&&day>s.loanDue){s={...s,debt:Math.ceil(s.debt*1.02),loanDue:day+7};s=addMessage(s,'Bank: overdue loan interest added.');}
  }
  return enterpriseDay({...g,money:Math.max(0,money),interior,checkpoint,sim:{...s,lastDay:g.day,leases,tenants,businesses}});
}
export type SimResult={game:Save;message:string};
export function simulate(g:Save,action:string,value='',amount=0):SimResult {
  let s=simOf(g),next:Save={...g,sim:s};const done=(message:string):SimResult=>({game:next,message});
  if(!g.lives)return done('Your one-hour break must finish before a fresh campaign.');
  const owned=(g.properties??[starterProperty()]).find(p=>p.id===value),parcel=parcels.find(p=>p.id===value);
  const spend=(cost:number)=>{if(!Number.isFinite(cost)||cost<0||next.money<cost)return false;next={...next,money:next.money-cost};return true;};
  const write=(updates:Partial<Simulation>)=>{s={...s,...updates};next={...next,sim:s};};
  if(action==='buy-life'){
    const near=locations.some(l=>l.type==='hospital'&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<6);
    if(!near&&g.interior!=='hospital'&&g.interior!=='island-hospital')return done('Visit a hospital to buy a life.');
    if(g.lives>=9)return done('You already have the maximum nine lives.');if(!spend(25000))return done('A life costs ₦25,000 in game cash.');next={...next,lives:g.lives+1};return done('Hospital life restored. Lives +1. No real-money payment.');
  }
  if(action==='sell-property'){
    if(!owned)return done('You do not own this property.');const price=salePrice(g,value);
    next={...next,money:g.money+price,properties:(g.properties??[starterProperty()]).filter(p=>p.id!==value),interior:g.interior===value?undefined:g.interior,checkpoint:g.checkpoint&&parcel&&Math.hypot(g.checkpoint[0]-entrance(parcel)[0],g.checkpoint[1]-entrance(parcel)[1])<6?[-4,12]:g.checkpoint};
    const e=structuredClone(enterpriseOf(next)),vault=e.vaults[value];if(vault){next.money+=vault.money;next.inventory=[...next.inventory,...vault.items];}delete e.plots[value];delete e.businesses[value];delete e.vaults[value];for(const plot of Object.values(e.plots))plot.merged=plot.merged.filter(id=>id!==value);next={...next,enterprise:e,inventory:next.inventory.filter(item=>item!==`Registered deed: ${value}`&&item!==`Unregistered deed: ${value}`)};const tenants={...s.tenants},businesses={...s.businesses};delete tenants[value];delete businesses[value];write({tenants,businesses});return done(`Property sold for ₦${price.toLocaleString()}. Furniture and improvements included.`);
  }
  if(action==='rent'){
    if(!parcel?.built||owned||s.leases.some(l=>l.id===value))return done('Choose an available house.');const rent=rentPrice(value),deposit=rent*2;if(!spend(rent+deposit))return done('You need the first week of rent and two weeks deposit.');write({leases:[...s.leases,{id:value,rent,dueDay:g.day+7,arrears:0,warnings:0,deposit}]});return done(`Lease signed. ₦${rent.toLocaleString()} weekly. Rent due on day ${g.day+7}.`);
  }
  if(action==='pay-rent'||action==='negotiate-rent'||action==='leave-rental'){
    const lease=s.leases.find(l=>l.id===value);if(!lease)return done('No active lease here.');
    if(action==='negotiate-rent'){const reduction=Math.min(lease.arrears,Math.round(lease.arrears*.2));if(!lease.arrears)return done('You have no arrears to negotiate.');if(s.completed.includes(`rent-${value}-${g.day}`))return done('You already negotiated today.');write({leases:s.leases.map(l=>l.id===value?{...l,arrears:l.arrears-reduction,dueDay:Math.max(l.dueDay,g.day+2)}:l),completed:[...s.completed,`rent-${value}-${g.day}`].slice(-60)});next={...next,skills:{...g.skills,communication:g.skills.communication+1}};return done(`Landlord agrees to waive ₦${reduction.toLocaleString()} and extend the deadline.`);}
    if(action==='leave-rental'){next={...next,money:next.money+Math.max(0,lease.deposit-lease.arrears),interior:g.interior===value?undefined:g.interior};write({leases:s.leases.filter(l=>l.id!==value)});return done('Lease ended. Remaining deposit returned after arrears.');}
    const cost=lease.arrears||lease.rent;if(!spend(cost))return done('Not enough cash for rent.');write({leases:s.leases.map(l=>l.id===value?{...l,arrears:0,warnings:0,dueDay:Math.max(l.dueDay,g.day)+7}:l)});return done('Rent paid. Landlord trouble settled.');
  }
  if(action==='find-tenant'){
    if(owned?.kind!=='house'||g.interior===value)return done('Own an unoccupied house to let it to a tenant.');if(s.tenants[value])return done('A tenant is already renting this home.');write({tenants:{...s.tenants,[value]:{rent:rentPrice(value),dueDay:g.day+7}}});return done('Tenant moved in. Weekly rent will be paid automatically.');
  }
  if(action==='end-tenancy'){const tenants={...s.tenants};delete tenants[value];write({tenants});return done('Tenancy ended. You can move back in.');}
  if(action==='deposit'||action==='withdraw'||action==='loan'||action==='repay'){
    if(!Number.isInteger(amount)||amount<=0||amount>1000000)return done('Enter a whole-naira amount from 1 to 1,000,000.');
    if(action==='deposit'){if(!spend(amount))return done('Not enough cash.');write({bank:s.bank+amount});}
    if(action==='withdraw'){if(amount>s.bank)return done('Not enough bank savings.');next={...next,money:next.money+amount};write({bank:s.bank-amount});}
    if(action==='loan'){if(s.debt||amount>100000)return done('Loans are capped at ₦100,000; repay any existing loan first.');next={...next,money:next.money+amount};write({debt:Math.ceil(amount*1.1),loanDue:g.day+7});}
    if(action==='repay'){const cost=Math.min(amount,s.debt);if(!cost)return done('No outstanding loan.');if(!spend(cost))return done('Not enough cash.');write({debt:s.debt-cost});}return done('Bank balance updated.');
  }
  if(action==='pay-bills'){if(!spend(s.bills))return done('Not enough cash for household bills.');write({bills:0});return done('Water and electricity bills paid.');}
  if(['cook','bath','clean','exercise','treat-injury'].includes(action)){
    if(action!=='treat-injury'&&!g.interior)return done('Go inside your home first.');
    if(action==='cook'){const home=effectiveProperty(g,g.interior??'');if(!home?.furniture.includes('kitchen'))return done('Install a kitchen first.');if(!spend(500))return done('Ingredients cost ₦500.');next={...next,stats:{...g.stats,hunger:cap(g.stats.hunger+45),hydration:cap(g.stats.hydration-5),stress:cap(g.stats.stress-5)},pose:'eat'};}
    if(action==='bath'){if(!spend(100))return done('Water costs ₦100.');write({hygiene:100});next={...next,stats:{...g.stats,stress:cap(g.stats.stress-15)}};}
    if(action==='clean'){write({cleanliness:100});next={...next,stats:{...g.stats,energy:cap(g.stats.energy-5)}};}
    if(action==='exercise'){write({stamina:100});next={...next,stats:{...g.stats,energy:cap(g.stats.energy-8)},skills:{...g.skills,fitness:g.skills.fitness+1}};}
    if(action==='treat-injury'){if(!locations.some(l=>l.type==='hospital'&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<6))return done('Visit a hospital for treatment.');if(!spend(3000))return done('Injury and illness treatment costs ₦3,000.');write({injury:0,illness:0});}
    write({progress:{...s.progress,survival:s.progress.survival+1}});return done('Activity complete. Your wellbeing improved.');
  }
  if(action==='store'||action==='retrieve'){
    if(!g.interior)return done('Use storage inside a home.');const list=action==='store'?g.inventory:s.stored,i=list.indexOf(value);if(i<0||value.endsWith('key')||value==='Phone')return done('Choose a movable inventory item.');const rest=list.filter((_,n)=>n!==i);next={...next,inventory:action==='store'?rest:[...g.inventory,value]};write({stored:action==='store'?[...s.stored,value]:rest});return done('Storage updated.');
  }
  if(action==='open-business'||action==='restock'||action==='hire-staff'||action==='close-business'){
    if(!owned||owned.kind==='house'||owned.kind==='land')return done('Build a club, church or shop first.');const b={...(s.businesses[value]??{stock:0,staff:0,open:false,earned:0})};
    if(action==='restock'){if(!spend(3000))return done('Restocking costs ₦3,000.');b.stock+=20;}
    if(action==='hire-staff'){if(b.staff>=3)return done('Maximum three staff.');if(!spend(2000))return done('Hiring costs ₦2,000.');b.staff++;}
    if(action==='open-business')b.open=true;if(action==='close-business')b.open=false;
    write({businesses:{...s.businesses,[value]:{...b}}});return done('Business updated. Daily sales depend on stock and staff; wages are deducted daily.');
  }
  if(action==='guard-mode'&&['follow','protect','stay'].includes(value)){write({guardMode:value as Simulation['guardMode']});return done(`Bodyguards: ${value}.`);}
  if(action==='fuel'||action==='repair-car'){
    if(!Object.hasOwn(vehicles,value)||!g.inventory.includes(vehicles[value as VehicleKind].key))return done('You must own this vehicle.');const kind=value as VehicleKind,v=s.garage[kind]??{fuel:100,condition:100,parked:[...g.position]};if(!spend(action==='fuel'?2000:4000))return done('Not enough cash.');write({garage:{...s.garage,[kind]:{...v,...(action==='fuel'?{fuel:100}:{condition:100})}}});return done(action==='fuel'?'Tank refilled.':'Vehicle repaired.');
  }
  if(action==='start-job'){
    if(s.job)return done('Finish or cancel your current job first.');if(!['delivery','taxi','repair','shop'].includes(value))return done('Unknown job.');if(value==='taxi'&&!g.inventory.includes('Car key'))return done('Buy a car before taking taxi jobs.');const current=districtAt(...g.position),dest=districts.find(d=>d.id!==current.id&&d.id===((g.day%2)?'ikorodu':'ikeja'))??districts.find(d=>d.id!==current.id)!;
    write({job:{kind:value as Job['kind'],stage:0,destination:dest.id,reward:value==='taxi'?6500:value==='delivery'?4500:3000,startedDay:g.day}});return done(value==='repair'?'Repair task: loosen, clean, then tighten the part.':value==='shop'?'Serve the order: water, food, then medicine.':'Collect your passenger/package at this district’s motor park.');
  }
  if(action==='cancel-job'){write({job:undefined});return done('Job cancelled. No payment awarded.');}
  if(action==='job-step'){
    const job=s.job;if(!job)return done('Choose a job first.');
    if(job.kind==='repair'||job.kind==='shop'){if(!locations.some(l=>l.type===(job.kind==='repair'?'work':'shop')&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<6))return done(job.kind==='repair'?'Visit Femi’s workshop to complete repairs.':'Visit a provision shop to serve this order.');const sequence=job.kind==='repair'?['loosen','clean','tighten']:['water','food','medicine'];if(value!==sequence[job.stage])return done('Wrong step. Check the job instructions.');}
    else if(job.stage===0){const park=locations.find(l=>l.type==='terminal'&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<5);if(!park)return done('Walk to a motor park to collect the passenger/package.');}
    else{const d=districts.find(d=>d.id===job.destination)!;if(Math.hypot(g.position[0]-(d.x-4),g.position[1]-(d.z+12))>5)return done(`Deliver at ${d.name} motor park.`);}
    const stages=job.kind==='repair'||job.kind==='shop'?3:2;if(job.stage+1<stages){write({job:{...job,stage:job.stage+1}});return done(job.stage===0?`Next stop: ${districts.find(d=>d.id===job.destination)?.name??'next task'}.`:'Next task unlocked.');}
    next={...next,money:next.money+job.reward,skills:{...g.skills,fitness:g.skills.fitness+1}};write({job:undefined,completed:[...s.completed,job.kind].slice(-60),progress:{...s.progress,business:s.progress.business+1,reputation:cap(s.progress.reputation+3)}});return done(`Job complete. ₦${job.reward.toLocaleString()} earned.`);
  }
  if(action==='sidequest'){
    const dayKey=`${value}-${g.day}`;if(s.completed.includes(dayKey))return done('You already helped with this today.');
    const target=value==='clinic'?'hospital':value==='witness'?'police':'community',l=locations.find(l=>l.id===target);if(!l||Math.hypot(l.x-g.position[0],l.z-g.position[1])>6)return done(`Visit ${l?.name??'the community center'} first.`);
    next={...next,money:next.money+2000,relationships:{...g.relationships,amara:Math.min(100,g.relationships.amara+5)}};write({completed:[...s.completed,dayKey].slice(-60),progress:{...s.progress,reputation:cap(s.progress.reputation+5)}});return done('Community mission complete. ₦2,000 and reputation +5.');
  }
  if(action==='add-wall'){
    if(!owned||owned.kind==='land'||(owned.walls?.length??0)>=12)return done('Build a property first. Maximum twelve room walls.');if(!spend(500))return done('A wall costs ₦500.');const index=owned.walls?.length??0;next={...next,properties:(g.properties??[starterProperty()]).map(p=>p.id===value?{...p,walls:[...(p.walls??[]),{x:(index%3-1)*2,z:(Math.floor(index/3)%3-1)*2,length:1.6,axis:index%2?'x':'z'}]}:p)};return done('Room divider built. Furniture can be positioned in the room editor.');
  }
  if(action==='remove-wall'){next={...next,properties:(g.properties??[starterProperty()]).map(p=>p.id===value?{...p,walls:p.walls?.slice(0,-1)}:p)};return done('Last room divider removed.');}
  if(action==='edit-home'){write({editHome:!s.editHome});return done(s.editHome?'Room editor on. Pick furniture, then tap the floor to place it.':'Room editor off.');}
  return done('Action unavailable.');
}
export function validSimulation(s:unknown):s is Simulation {
  if(!s||typeof s!=='object')return false;const v=s as Simulation;
  const record=(value:unknown)=>value&&typeof value==='object'&&!Array.isArray(value);
  if(!record(v.tenants)||!record(v.businesses)||!record(v.garage))return false;
  if(!Object.entries(v.tenants).every(([id,t])=>parcels.some(p=>p.id===id)&&t&&[t.rent,t.dueDay].every(n=>Number.isFinite(n)&&n>=0)))return false;
  if(!Object.entries(v.businesses).every(([id,b])=>parcels.some(p=>p.id===id)&&b&&Number.isInteger(b.stock)&&b.stock>=0&&Number.isInteger(b.staff)&&b.staff>=0&&b.staff<=3&&typeof b.open==='boolean'&&Number.isFinite(b.earned)))return false;
  if(!Object.values(v.garage).every(t=>t&&Array.isArray(t.parked)&&t.parked.length===2&&t.fuel>=0&&t.fuel<=100&&t.condition>=0&&t.condition<=100))return false;
  if(v.job&&(!Number.isFinite(v.job.reward)||v.job.reward<0||!Number.isInteger(v.job.startedDay)||v.job.startedDay<1))return false;
  return ['bank','debt','loanDue','bills','lastDay','hygiene','cleanliness','stamina','injury','illness'].every(k=>Number.isFinite(v[k as keyof Simulation])&&Number(v[k as keyof Simulation])>=0)&&Array.isArray(v.leases)&&v.leases.length<=12&&v.leases.every(l=>parcels.some(p=>p.id===l.id)&&[l.rent,l.dueDay,l.arrears,l.warnings,l.deposit].every(n=>Number.isFinite(n)&&n>=0))&&!!v.garage&&Object.entries(v.garage).every(([k,t])=>Object.hasOwn(vehicles,k)&&t&&[t.fuel,t.condition,...t.parked].every(Number.isFinite))&&!!v.progress&&['business','survival','reputation'].every(k=>Number.isFinite(v.progress[k as keyof Simulation['progress']]))&&Array.isArray(v.messages)&&v.messages.every(m=>typeof m==='string')&&Array.isArray(v.completed)&&v.completed.every(m=>typeof m==='string')&&Array.isArray(v.stored)&&v.stored.every(m=>typeof m==='string')&&!!v.businesses&&!!v.tenants&&['follow','protect','stay'].includes(v.guardMode)&&typeof v.editHome==='boolean'&&(!v.job||['delivery','taxi','repair','shop'].includes(v.job.kind)&&Number.isInteger(v.job.stage)&&v.job.stage>=0&&v.job.stage<3&&districts.some(d=>d.id===v.job!.destination));
}
export function effectiveProperty(g:Save,id:string) {
  const owned=(g.properties??[starterProperty()]).find(p=>p.id===id);if(owned){const blocks=g.enterprise?.plots[id]?.blocks??[];return owned.kind==='land'&&blocks.some(b=>b.kind==='shop'||b.kind==='warehouse')?{...owned,kind:'shop' as const}:owned;}
  if(simOf(g).leases.some(l=>l.id===id))return {id,kind:'house' as const,furniture:['bed','sofa','tv','kitchen'] as Furniture[],level:1};
  return undefined;
}
