import data from '../shared/empire-data.json';
import {enterpriseData,enterpriseOf,random,weather} from './enterprise';
import {salePrice,simOf} from './simulation';
import {districts,locations,vehicles,type DistrictId,type VehicleKind} from '../shared/city';
import {entrance,parcels,starterProperty} from '../shared/property';
import type {Save} from './game';
export {data as empireData};
export type DefenseKind=keyof typeof data.defenses;
export type ModKind=keyof typeof data.mods;
export type RaidKind=keyof typeof data.raids;
export type AnimalKind=keyof typeof data.animals;
export type Herd={count:number;young:number;age:number;youngAge:number;feed:number;health:number};
export type Holding={condition:number;defenses:Partial<Record<DefenseKind,number>>;repelled:number;lastRaid:number};
export type CarMods=Partial<Record<ModKind,number>>&{paint?:string};
export type Raid={id:string;kind:RaidKind;target:string;at:number;status:'scheduled'|'active';attackers:number;initial:number;strength:number;deadline?:number;police?:number;warned:boolean;rival?:string};
export type Rival={id:string;wealth:number;hostility:number;truceUntil:number;defeated:boolean};
export type RaidLog={day:number;kind:RaidKind;target:string;outcome:'repelled'|'lost'|'settled';loss:number};
export type Empire={version:1;lastDay:number;holdings:Record<string,Holding>;cars:Partial<Record<VehicleKind,CarMods>>;raid?:Raid;log:RaidLog[];rivals:Rival[];influence:Record<string,number>;heat:number;herds:Record<string,Partial<Record<AnimalKind,Herd>>>;story:{part:number;step:number;flags:string[]};vigilante:number;receipts:string[]};
export type EmpireCommand={action:string;id?:string;kind?:string;amount?:number;receipt?:string};
const clamp=(v:number,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
export const minuteOf=(g:Save)=>(g.day-1)*1440+g.minutes;
export const freshEmpire=(day=1):Empire=>({version:1,lastDay:day,holdings:{},cars:{},log:[],rivals:data.rivals.map(r=>({id:r.id,wealth:r.wealth,hostility:10,truceUntil:0,defeated:false})),influence:Object.fromEntries(districts.map(d=>[d.id,d.id==='yaba'?10:0])),heat:0,herds:{},story:{part:0,step:0,flags:[]},vigilante:0,receipts:[]});
export const empireOf=(g:Save)=>g.empire??freshEmpire(g.day);
export const holdingOf=(e:Empire,id:string):Holding=>e.holdings[id]??{condition:100,defenses:{},repelled:0,lastRaid:0};
const owned=(g:Save)=>g.properties??[starterProperty()];
const districtOf=(id:string)=>parcels.find(p=>p.id===id)?.district??'yaba';
const rivalInfo=(id:string)=>data.rivals.find(r=>r.id===id)!;
const message=(g:Save,text:string)=>{const s=simOf(g);g.sim={...s,messages:[text,...s.messages].slice(0,25)};};
export const clockText=(minute:number)=>{const m=((minute%1440)+1440)%1440;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;};

// ---------- Vehicles ----------
export type CarStats={topSpeed:number;accel:number;brake:number;grip:number;mass:number;armor:number;roll:number};
const mass:Record<VehicleKind,number>={bicycle:90,bike:180,keke:350,car:1200,taxi:1200,sports:1300,luxury:1700,suv:2100,van:2300,bus:3200};
export function carStats(kind:VehicleKind,mods:CarMods={}):CarStats{
 const base=vehicles[kind].speed,engine=mods.engine??0,tires=mods.tires??0,suspension=mods.suspension??0,armor=mods.armor??0,heavy=mass[kind]>2000;
 return {topSpeed:base*(1+engine*.12)*(1-armor*.03),accel:(heavy?3.2:kind==='sports'?7.5:5.2)*(1+engine*.15)*(1-armor*.04),brake:(heavy?7:10)*(1+tires*.1),grip:(heavy?6.5:8.5)*(1+tires*.12+suspension*.04),mass:mass[kind]*(1+armor*.08),armor:armor,roll:(heavy?.09:.06)*(1-suspension*.25)};
}
export const modsOf=(g:Save,kind:VehicleKind):CarMods=>empireOf(g).cars[kind]??{};

// ---------- Defense, value and standing ----------
export function defenseOf(g:Save,id:string){
 const e=empireOf(g),h=holdingOf(e,id),plot=enterpriseOf(g).plots[id],blocks=plot?.blocks??[],powered=!weather(g).blackout||(h.defenses.solar??0)>0||blocks.some(b=>b.kind==='generator')&&(plot?.fuel??0)>0;
 let power=0;for(const [kind,level] of Object.entries(h.defenses)){const d=data.defenses[kind as DefenseKind];power+=d.power*(level??0)*('powered' in d&&!powered?.3:1);}
 const count=(kind:string)=>blocks.filter(b=>b.kind===kind).length;
 power+=Math.min(8,(count('fence')+count('gate'))*.5)+count('security')*4+Math.min(9,count('cctv')*3)+Math.min(4,count('lamp'))+(plot?.staff.security??0)*10;
 power+=(e.influence[districtOf(id)]??0)*.15+(e.vigilante>=g.day?12:0);
 return Math.round(power);
}
const herdValue=(g:Save)=>Object.values(empireOf(g).herds).reduce((n,herds)=>n+Object.entries(herds).reduce((m,[kind,h])=>m+((h?.count??0)+(h?.young??0)*.4)*data.animals[kind as AnimalKind].price,0),0);
export function netWorth(g:Save){
 const s=simOf(g),e=enterpriseOf(g),em=empireOf(g),cars=(Object.keys(vehicles) as VehicleKind[]).filter(k=>g.inventory.includes(vehicles[k].key)).reduce((n,k)=>n+vehicles[k].price*(s.garage[k]?.condition??100)/100,0);
 return Math.floor(g.money+s.bank+e.investment+e.cooperative+Object.values(e.vaults).reduce((n,v)=>n+v.money,0)+owned(g).reduce((n,p)=>n+salePrice(g,p.id)*holdingOf(em,p.id).condition/100,0)+cars+herdValue(g)-s.debt);
}
export const titleFor=(worth:number)=>[...data.titles].reverse().find(t=>worth>=t.worth)!.name;
const hostile=(e:Empire,r:Rival,day:number)=>!r.defeated&&r.hostility>=60&&r.truceUntil<day;

// ---------- Raids ----------
const strengthFor=(g:Save,kind:RaidKind,r:number)=>Math.round(data.raids[kind].strength*(1+Math.log10(Math.max(1,netWorth(g)/1e6))*.35)*(.85+r*.3)+empireOf(g).heat*.1);
export function scheduleRaid(g:Save,e:Empire,kind:RaidKind,target:string,at:number,rival?:string){
 const r=random(g.seed+606,at),attackers=Math.min(8,data.raids[kind].attackers+Math.floor(netWorth(g)/5e6)),warned=defenseOf(g,target)>=7||e.vigilante>=g.day||(e.influence[districtOf(target)]??0)>=30;
 e.raid={id:`raid-${at}-${target}`,kind,target,at,status:'scheduled',attackers,initial:attackers,strength:strengthFor(g,kind,r),warned,rival};
 if(warned)message(g,`Informant: ${data.raids[kind].name.toLowerCase()} are planning to hit ${parcels.find(p=>p.id===target)?.name??target} around ${clockText(at)}. Fortify, call the police, or be there.`);
}
function planNightRaid(g:Save,e:Empire,day:number){
 if(day<4||e.raid)return;const worth=netWorth(g),dayStart=(day-1)*1440;let best:{id:string;score:number}|undefined;
 owned(g).forEach((p,i)=>{const plot=enterpriseOf(g).plots[p.id];if(p.kind==='land'&&!plot?.blocks.length&&!Object.values(e.herds[p.id]??{}).some(h=>h&&h.count+h.young>0)&&plot?.registered!==false)return;const district=districtOf(p.id),value=salePrice(g,p.id),rivalHere=e.rivals.some(r=>hostile(e,r,day)&&rivalInfo(r.id).district===district);
  const risk=clamp(((.025+Math.min(.12,value/2e6*.1)+e.heat*.0015+(rivalHere?.05:0))*(data.crime[district as DistrictId]??1))-defenseOf(g,p.id)*.0011-(e.influence[district]??0)*.0008,.005,.3),roll=random(g.seed+404,day*31+i);
  if(roll<risk&&(!best||risk-roll>best.score))best={id:p.id,score:risk-roll};});
 if(!best)return;const r=random(g.seed+505,day),plot=enterpriseOf(g).plots[best.id],property=owned(g).find(p=>p.id===best!.id)!,parcel=parcels.find(p=>p.id===best!.id),rival=e.rivals.find(x=>hostile(e,x,day));
 const carNear=parcel&&Object.values(simOf(g).garage).some(v=>v&&Math.hypot(v.parked[0]-entrance(parcel)[0],v.parked[1]-entrance(parcel)[1])<14);
 const kind:RaidKind=property.kind==='land'&&plot&&!plot.registered?'omo-onile':rival&&r<.45?'rival-thugs':worth>4e6&&r<.65?'armed-robbers':carNear&&r<.8?'car-snatchers':'burglars';
 const at=data.raids[kind].night?dayStart+22*60+Math.floor(r*300):dayStart+10*60+Math.floor(r*360);
 scheduleRaid(g,e,kind,best.id,at,kind==='rival-thugs'?rival?.id:undefined);
}
export function playerNear(g:Save,target:string){if(g.interior)return g.interior===target;const parcel=parcels.find(p=>p.id===target);if(!parcel)return false;const door=entrance(parcel);return Math.hypot(door[0]-g.position[0],door[1]-g.position[1])<30;}
export function raidDefense(g:Save,present:boolean){
 const raid=empireOf(g).raid;if(!raid)return 0;const armed=g.inventory.includes('Pistol')&&(g.ammo??0)>0;
 return defenseOf(g,raid.target)+(present?12+g.skills.fitness*2+(g.guards??0)*10+(armed?15:0):0)+(raid.police!==undefined&&minuteOf(g)>=raid.police?30:0);
}
function resolveRaid(g:Save,e:Empire,present:boolean,forced?:'repelled'|'lost'){
 const raid=e.raid!,id=raid.target,h={...holdingOf(e,id)},district=districtOf(id),name=parcels.find(p=>p.id===id)?.name??id,info=data.raids[raid.kind];
 const power=raid.strength*Math.max(.2,raid.attackers/raid.initial),defense=raidDefense({...g,empire:e},present),roll=random(g.seed+707,raid.at)*20;
 const repelled=forced?forced==='repelled':defense+roll>=power;let loss=0;
 if(repelled){h.repelled++;e.influence[district]=clamp((e.influence[district]??0)+3);e.heat=clamp(e.heat-2);const bounty=raid.police!==undefined||present?(raid.initial-raid.attackers)*2000:0;g.money+=bounty;message(g,`${info.name} repelled at ${name}.${bounty?` Police bounty ₦${bounty.toLocaleString()}.`:''}`);}
 else{
  const severity=clamp((power-defense-roll)/Math.max(1,power),.2,1),ent=structuredClone(enterpriseOf(g)),vault=ent.vaults[id];
  h.condition=clamp(h.condition-Math.round(15+severity*35));
  if(vault){const taken=Math.floor(vault.money*severity*.7);vault.money-=taken;loss+=taken;vault.items=vault.items.slice(Math.ceil(severity*2));}
  const property=owned(g).find(p=>p.id===id);
  if(property&&property.kind==='house'&&severity>.4&&property.furniture.length>1){const item=property.furniture.filter(f=>f!=='bed')[Math.floor(random(g.seed,raid.at+3)*(property.furniture.length-1))];if(item){g.properties=owned(g).map(p=>p.id===id?{...p,furniture:p.furniture.filter(f=>f!==item),placements:Object.fromEntries(Object.entries(p.placements??{}).filter(([k])=>k!==item))}:p);loss+=500;}}
  const shop=ent.businesses[id];if(shop&&['rival-thugs','armed-robbers'].includes(raid.kind)){shop.reputation=clamp(shop.reputation-15);for(const k of Object.keys(shop.stock))shop.stock[k]=Math.floor(shop.stock[k]/2);}
  const plot=ent.plots[id];if(plot&&raid.kind==='omo-onile'&&plot.blocks.length){plot.undo=[...plot.blocks];plot.blocks=plot.blocks.filter(b=>plot.crops.some(c=>c.bed===b.id)).concat(plot.blocks.filter(b=>!plot.crops.some(c=>c.bed===b.id)).slice(0,Math.floor(plot.blocks.length*(1-severity*.5))));}
  if(raid.kind==='car-snatchers'){const parcel=parcels.find(p=>p.id===id),garage={...simOf(g).garage},kind=(Object.keys(garage) as VehicleKind[]).find(k=>parcel&&garage[k]&&Math.hypot(garage[k]!.parked[0]-entrance(parcel)[0],garage[k]!.parked[1]-entrance(parcel)[1])<14);
   if(kind){if(e.cars[kind]?.tracker){garage[kind]={...garage[kind]!,condition:clamp(garage[kind]!.condition-40)};message(g,`Your ${vehicles[kind].name} was snatched but the GPS tracker led police to it. It needs repairs.`);}else{delete garage[kind];delete e.cars[kind];g.inventory=g.inventory.filter(i=>i!==vehicles[kind].key);loss+=vehicles[kind].price;message(g,`Car snatchers drove off with your ${vehicles[kind].name}. Fit a GPS tracker next time.`);}g.sim={...simOf(g),garage};}}
  if(present){const cash=Math.floor(Math.min(g.money*.1,100000)*severity);g.money-=cash;loss+=cash;g.stats={...g.stats,health:clamp(g.stats.health-Math.round(15+severity*35)),stress:clamp(g.stats.stress+20)};}
  if(plot?.insured)ent.claims+=Math.floor(loss*.7);g.enterprise=ent;e.heat=clamp(e.heat+3);
  message(g,`${info.name} broke into ${name}. Losses ₦${loss.toLocaleString()} · property condition ${h.condition}%.`);
 }
 const sim=simOf(g);if(h.condition<30&&sim.tenants[id]){const tenants={...sim.tenants};delete tenants[id];g.sim={...sim,tenants};message(g,`Your tenant moved out of ${name}: the building is unsafe. Repair it.`);}
 if(raid.rival){const r=e.rivals.find(x=>x.id===raid.rival);if(r)r.hostility=clamp(r.hostility+(repelled?-10:5));}
 h.lastRaid=g.day;e.holdings[id]=h;e.log=[{day:g.day,kind:raid.kind,target:id,outcome:repelled?'repelled' as const:'lost' as const,loss},...e.log].slice(0,20);e.raid=undefined;
 return repelled;
}

// ---------- Livestock ----------
const housing=(g:Save,plot:string,kind:AnimalKind)=>(enterpriseOf(g).plots[plot]?.blocks??[]).filter(b=>b.kind===data.animals[kind].housing).length*data.animals[kind].capacity;
const freshHerd=():Herd=>({count:0,young:0,age:0,youngAge:0,feed:0,health:100});
function herdDay(g:Save,e:Empire,day:number){
 const w=weather(g,day);
 for(const [plot,herds] of Object.entries(e.herds))for(const [kind,h] of Object.entries(herds) as [AnimalKind,Herd][]){
  if(!h||h.count+h.young<=0)continue;const cfg=data.animals[kind],p=enterpriseOf(g).plots[plot],need=(h.count+h.young*.5)*cfg.feed;
  if(h.feed>=need){h.feed-=need;h.age++;if(h.young)h.youngAge++;h.health=clamp(h.health+.5);}else h.health=clamp(h.health-6);
  if('humid' in cfg&&w.season==='dry'&&!p?.blocks.some(b=>b.kind==='borehole'))h.health=clamp(h.health-4);
  if(random(g.seed+808+plot.length,day*13+kind.length)<.02)h.health=clamp(h.health-20);
  if(h.young&&h.youngAge>=cfg.days){h.count+=h.young;h.young=0;h.youngAge=0;}
  if(cfg.breed&&day%cfg.breed===0&&h.count>=2&&h.health>50){const room=housing(g,plot,kind)-h.count-h.young;h.young+=Math.max(0,Math.min(room,Math.floor(h.count*.5)));}
  const guarded=!!p?.staff.security||!!p?.staff.herder||(holdingOf(e,plot).defenses.dogs??0)>0||(holdingOf(e,plot).defenses.fence??0)>0;
  if(day%7===3&&!guarded&&random(g.seed+909,day+plot.length)<.15&&h.count){const lost=Math.min(h.count,h.count>10?2:1);h.count-=lost;message(g,`Thieves took ${lost} ${cfg.name.toLowerCase()} from an unguarded farm. Fence it or hire security.`);}
  if(h.health<=0){message(g,`${cfg.name} died from neglect or disease. Feed, water and vet care matter.`);herds[kind]=freshHerd();}
 }
}
export const festivalFactor=(kind:AnimalKind,month:number)=>(data.animals[kind].festival as Record<string,number>)[String(month)]??1;

// ---------- Daily strategy simulation ----------
function empireDay(g:Save,e:Empire,day:number){
 if(day%7===0){let upkeep=0;for(const h of Object.values(e.holdings))for(const [k,level] of Object.entries(h.defenses))upkeep+=data.defenses[k as DefenseKind].upkeep*(level??0);
  if(upkeep){if(g.money>=upkeep){g.money-=upkeep;message(g,`Security upkeep paid: ₦${upkeep.toLocaleString()} for dogs and gatemen.`);}else{for(const h of Object.values(e.holdings)){delete h.defenses.gateman;if(h.defenses.dogs)h.defenses.dogs=Math.max(0,h.defenses.dogs-1);}message(g,'Unpaid security: your gatemen left and a guard dog was rehomed.');}}}
 const worth=netWorth(g);
 for(const r of e.rivals){if(r.defeated){g.money+=Math.floor(r.wealth*.001);continue;}r.wealth=Math.floor(r.wealth*(1.004+random(g.seed+111,day+r.id.length)*.006));r.hostility=clamp(r.hostility+(r.truceUntil>=day?-3:worth>r.wealth*.6?2:-.5)+((e.influence[rivalInfo(r.id).district]??0)>40?1:0));}
 if(e.story.flags.includes('jv-balogun'))g.money+=3000;
 e.heat=clamp(e.heat-1.5+(g.wanted??0)*2+(enterpriseOf(g).dirty>0?1:0));
 const props=owned(g),biz=enterpriseOf(g).businesses;
 for(const d of districts){const target=clamp(props.filter(p=>districtOf(p.id)===d.id).length*6+Object.keys(biz).filter(id=>districtOf(id)===d.id).length*8+e.log.filter(l=>l.outcome==='repelled'&&districtOf(l.target)===d.id).length*2);e.influence[d.id]=Math.round(clamp((e.influence[d.id]??0)+(target-(e.influence[d.id]??0))*.1)*10)/10;}
 herdDay(g,e,day);planNightRaid(g,e,day);
}
/** Advances strategy time: daily rivals/herds/raid planning and minute-accurate raid starts. */
export function empireClock(g:Save):Save{
 if(!g.empire)return {...g,empire:freshEmpire(g.day)};
 const now=minuteOf(g),raid=g.empire.raid;
 if(g.day<=g.empire.lastDay&&(!raid||(raid.status==='scheduled'?now<raid.at:now<raid.deadline!&&(raid.police===undefined||now<raid.police))))return g;
 const next:Save={...g},e=structuredClone(g.empire);
 for(let day=e.lastDay+1;day<=Math.min(g.day,e.lastDay+366);day++)empireDay(next,e,day);
 e.lastDay=Math.max(e.lastDay,g.day);
 if(e.raid?.status==='scheduled'&&now>=e.raid.at){if(playerNear(next,e.raid.target)){e.raid={...e.raid,status:'active',deadline:now+25};message(next,`${data.raids[e.raid.kind].name} are attacking your property! Defend it, call the police or pay them off.`);}else resolveRaid(next,e,false);}
 if(e.raid?.status==='active'&&(now>=e.raid.deadline!||e.raid.police!==undefined&&now>=e.raid.police))resolveRaid(next,e,playerNear(next,e.raid.target),e.raid.police!==undefined&&now>=e.raid.police?'repelled':undefined);
 return {...next,money:Math.max(0,next.money),empire:e};
}

// ---------- Story: the Empire arc (chapters 6–10) ----------
export type StoryChoice={id:string;label:string;detail:string};
type StoryStep={objective:string;hint:string;place?:string;ready?:(g:Save)=>string|null;choices?:StoryChoice[]};
const ownsLand=(g:Save)=>owned(g).some(p=>p.id!=='house-yaba');
const vehicleKey=(g:Save)=>Object.values(vehicles).some(v=>g.inventory.includes(v.key));
export const empireStory:{title:string;intro:string;steps:StoryStep[]}[]=[
 {title:'Omo Onile',intro:'Land is wealth in Lagos — and everyone wants a share of yours.',steps:[
  {objective:'Buy a plot or house beyond your starter apartment',hint:'Open Properties, or walk to any FOR SALE sign.',ready:g=>ownsLand(g)?null:'You need a second property first.'},
  {objective:'Face the land grabbers at your new plot',hint:'Walk to the entrance of the plot you bought.',place:'own-plot',choices:[{id:'pay',label:'Pay the ₦50,000 “foundation levy”',detail:'Peace for now; they may come back.'},{id:'police',label:'Show your deed and call the police',detail:'Works if the deed is registered. Otherwise expect an attack tonight.'},{id:'baale',label:'Ask the Baale to mediate',detail:'Communication 3+ · ₦15,000 · Influence +8'}]}]},
 {title:'Agbero Wahala',intro:'The motor park touts want a cut of every vehicle that moves.',steps:[
  {objective:'Own a vehicle',hint:'Buy one at Mainland Motors or a dealership.',ready:g=>vehicleKey(g)?null:'Buy or acquire a vehicle first.'},
  {objective:'Visit any motor park',hint:'Motor parks sit near each district’s entry.',place:'terminal',choices:[{id:'dues',label:'Pay union dues · ₦20,000',detail:'Your vehicles are left in peace.'},{id:'refuse',label:'Refuse the touts',detail:'Alhaji Danjuma’s boys will come for your car.'},{id:'rally',label:'Rally the drivers',detail:'Requires influence 20+ in this district.'}]}]},
 {title:'Chief Balogun’s Offer',intro:'A rival tycoon has noticed your rise.',steps:[
  {objective:'Grow your net worth to ₦1,800,000',hint:'Businesses, farms, rent and property all count.',ready:g=>netWorth(g)>=1800000?null:`Net worth ₦${netWorth(g).toLocaleString()} of ₦1,800,000.`},
  {objective:'Meet Chief Balogun at Island Logistics, Victoria Island',hint:'Travel to VI by motor park or drive.',place:'corporate',choices:[{id:'sell',label:'Sell him your most valuable property',detail:'Paid at 80% of value. Balogun becomes friendly.'},{id:'refuse',label:'Refuse his offer',detail:'Balogun declares war: expect thugs.'},{id:'partner',label:'Propose a joint venture',detail:'Communication 4+ · ₦3,000 daily dividend · long truce'}]}]},
 {title:'Election Season',intro:'Politicians are touring the city looking for “stakeholders”.',steps:[
  {objective:'Reach influence 25 in any district',hint:'Own property, run businesses, repel raids or sponsor community events.',ready:g=>Math.max(...Object.values(empireOf(g).influence))>=25?null:'Build more influence in a district.'},
  {objective:'Attend the town hall at the Mainland community centre',hint:'The community centre is in Mainland.',place:'community',choices:[{id:'donate',label:'Donate ₦100,000 to the campaign',detail:'Influence +15 everywhere · Heat +10'},{id:'civic',label:'Mobilise a free and fair vote',detail:'Requires reputation 55+ · Influence +10 everywhere'},{id:'neutral',label:'Stay out of politics',detail:'Heat −10'}]}]},
 {title:'Odogwu of Lagos',intro:'Everything you built leads to one decision.',steps:[
  {objective:'Own 3 properties, reach ₦3,000,000 and prove your strength',hint:'Repel two raids or defeat a rival.',ready:g=>{const e=empireOf(g),strong=e.log.filter(l=>l.outcome==='repelled').length>=2||e.rivals.some(r=>r.defeated);return owned(g).length>=3&&netWorth(g)>=3e6&&strong?null:`Properties ${owned(g).length}/3 · Net worth ₦${netWorth(g).toLocaleString()} · ${strong?'strength proven':'repel 2 raids or defeat a rival'}`;}},
  {objective:'Choose your legacy at the Lands Bureau, Yaba',hint:'Return to where your deeds began.',place:'lands',choices:[{id:'school',label:'Build a community school · ₦300,000',detail:'Influence +30 everywhere · Community legacy'},{id:'tycoon',label:'Expand the empire',detail:'Tycoon legacy · Rival hostility rises'},{id:'family',label:'Set up a family trust · ₦200,000',detail:'Family legacy · +1 life (max 9)'}]}]},
];
export function storyStatus(g:Save){
 const s=empireOf(g).story;if(s.part>=empireStory.length)return {complete:true as const,part:s.part,ending:s.flags.find(f=>f.startsWith('ending-'))?.slice(7)??'legacy'};
 const part=empireStory[s.part],step=part.steps[s.step];return {complete:false as const,part:s.part,chapter:s.part+6,title:part.title,intro:part.intro,...step,blocked:step.ready?.(g)??null,atPlace:atStoryPlace(g,step.place)};
}
function atStoryPlace(g:Save,place?:string){
 if(!place)return true;if(g.interior)return false;const near=(x:number,z:number,r=6)=>Math.hypot(x-g.position[0],z-g.position[1])<r;
 if(place==='own-plot')return owned(g).some(p=>{const parcel=parcels.find(a=>a.id===p.id);return p.id!=='house-yaba'&&parcel&&near(...entrance(parcel),8);});
 if(place==='terminal')return locations.some(l=>l.type==='terminal'&&near(l.x,l.z));
 const l=locations.find(l=>l.id===place);return !!l&&near(l.x,l.z);
}
const newestPlot=(g:Save)=>[...owned(g)].reverse().find(p=>p.id!=='house-yaba')?.id;
function storyChoice(g:Save,e:Empire,choice:string):string|null{
 const part=e.story.part,flag=(f:string)=>{e.story.flags=[...new Set([...e.story.flags,f])];},spend=(n:number)=>{if(g.money<n)return false;g.money-=n;return true;},night=(g.day-1)*1440+22*60+30,district=()=>{const t=locations.find(l=>l.type==='terminal'&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<6);return t?.district??'yaba';};
 const allInfluence=(n:number)=>{for(const d of districts)e.influence[d.id]=clamp((e.influence[d.id]??0)+n);};
 const rival=(id:string)=>e.rivals.find(r=>r.id===id)!;
 if(part===0){const plot=newestPlot(g)!;
  if(choice==='pay'){if(!spend(50000))return 'You need ₦50,000.';flag('paid-levy');return 'The land grabbers take the money and leave… for now.';}
  if(choice==='police'){if(enterpriseOf(g).plots[plot]?.registered){allInfluence(0);e.influence[districtOf(plot)]=clamp((e.influence[districtOf(plot)]??0)+5);flag('stood-firm');return 'Your registered deed and the police send them away. Neighbours respect you.';}flag('defied');if(!e.raid)scheduleRaid(g,e,'omo-onile',plot,night);return 'Your deed is unregistered. The Omo Onile promise to return tonight. Prepare!';}
  if(choice==='baale'){if(g.skills.communication<3)return 'You need communication 3+ to persuade the Baale.';if(!spend(15000))return 'The Baale’s mediation needs ₦15,000.';e.influence[districtOf(plot)]=clamp((e.influence[districtOf(plot)]??0)+8);flag('baale-friend');return 'The Baale blesses your land. The grabbers back off.';}
 }
 if(part===1){
  if(choice==='dues'){if(!spend(20000))return 'Union dues are ₦20,000.';flag('union');return 'Union sticker on your windscreen. The agberos wave you through.';}
  if(choice==='refuse'){rival('danjuma').hostility=clamp(rival('danjuma').hostility+30);flag('refused-agbero');const home=owned(g)[owned(g).length-1].id;if(!e.raid)scheduleRaid(g,e,'car-snatchers',home,night,'danjuma');return 'The touts curse you. Watch your car tonight.';}
  if(choice==='rally'){const d=district();if((e.influence[d]??0)<20)return 'You need influence 20+ in this district.';e.influence[d]=clamp(e.influence[d]+10);flag('rallied');return 'The drivers stand with you. The agberos leave your vehicles alone.';}
 }
 if(part===2){
  if(choice==='sell'){const best=[...owned(g)].filter(p=>p.id!=='house-yaba').sort((a,b)=>salePrice(g,b.id)-salePrice(g,a.id))[0];if(!best)return 'You have nothing Balogun wants.';const price=Math.floor(salePrice(g,best.id)/.7*.8);g.properties=owned(g).filter(p=>p.id!==best.id);if(g.interior===best.id)g.interior=undefined;const sim=simOf(g),tenants={...sim.tenants},shops={...sim.businesses};delete tenants[best.id];delete shops[best.id];g.sim={...sim,tenants,businesses:shops};g.inventory=g.inventory.filter(i=>!i.endsWith(`deed: ${best.id}`));const ent=structuredClone(enterpriseOf(g));delete ent.plots[best.id];delete ent.businesses[best.id];g.enterprise=ent;delete e.holdings[best.id];delete e.herds[best.id];g.money+=price;rival('balogun').hostility=0;flag('sold-out');return `Sold for ₦${price.toLocaleString()}. Balogun shakes your hand.`;}
  if(choice==='refuse'){rival('balogun').hostility=80;rival('balogun').truceUntil=0;flag('war-balogun');const target=newestPlot(g)??'house-yaba';if(!e.raid)scheduleRaid(g,e,'rival-thugs',target,night,'balogun');return '“You will regret this.” Balogun’s thugs are coming.';}
  if(choice==='partner'){if(g.skills.communication<4)return 'You need communication 4+ to pitch a joint venture.';rival('balogun').truceUntil=g.day+120;rival('balogun').hostility=0;flag('jv-balogun');return 'Joint venture signed. ₦3,000 daily dividend.';}
 }
 if(part===3){
  if(choice==='donate'){if(!spend(100000))return 'The donation is ₦100,000.';allInfluence(15);e.heat=clamp(e.heat+10);flag('donated');return 'Your name is on every campaign poster. Influence everywhere rises.';}
  if(choice==='civic'){if(simOf(g).progress.reputation<55)return 'You need reputation 55+ to lead the community.';allInfluence(10);flag('civic');return 'The community trusts you. A free and fair vote.';}
  if(choice==='neutral'){e.heat=clamp(e.heat-10);flag('neutral');return 'You stay out of it. Less attention, less trouble.';}
 }
 if(part===4){
  if(choice==='school'){if(!spend(300000))return 'The school costs ₦300,000.';allInfluence(30);flag('ending-community');return 'The Odogwu Community School opens. Lagos will remember you.';}
  if(choice==='tycoon'){for(const r of e.rivals)r.hostility=clamp(r.hostility+20);flag('ending-tycoon');return 'Your empire expands. So do your enemies.';}
  if(choice==='family'){if(!spend(200000))return 'The family trust needs ₦200,000.';g.lives=Math.min(9,g.lives+1);flag('ending-family');return 'Your family is secure. A life restored.';}
 }
 return 'Choose one of the listed options.';
}

// ---------- Player commands ----------
export function empireAction(g:Save,c:EmpireCommand):{game:Save;message:string}{
 const next:Save={...g},e=structuredClone(empireOf(g)),id=c.id??'',fail=(message:string)=>({game:g,message}),done=(message:string)=>({game:{...next,empire:{...e,receipts:e.receipts.slice(-200)}},message}),spend=(n:number)=>{if(!Number.isFinite(n)||n<0||next.money<n)return false;next.money-=n;return true;};
 if(!g.lives||g.captivity)return fail('Finish your current survival event first.');
 if(c.receipt&&e.receipts.includes(c.receipt))return fail('Already handled.');if(c.receipt)e.receipts.push(c.receipt);
 const isOwned=owned(g).some(p=>p.id===id),now=minuteOf(g);
 if(c.action==='fortify'){const kind=c.kind as DefenseKind;if(!isOwned)return fail('Own this property first.');if(!Object.hasOwn(data.defenses,kind))return fail('Choose a defence.');const h={...holdingOf(e,id),defenses:{...holdingOf(e,id).defenses}},level=h.defenses[kind]??0,max=kind==='solar'?1:3;if(level>=max)return fail('This defence is fully upgraded.');const cost=data.defenses[kind].cost*(level+1);if(!spend(cost))return fail(`Not enough cash: ₦${cost.toLocaleString()}.`);h.defenses[kind]=level+1;e.holdings[id]=h;return done(`${data.defenses[kind].name} installed (level ${level+1}). Defence ${defenseOf({...next,empire:e},id)}.`);}
 if(c.action==='repair'){if(!isOwned)return fail('Own this property first.');const h={...holdingOf(e,id)},cost=(100-h.condition)*300;if(!cost)return fail('This property is in perfect condition.');if(!spend(cost))return fail(`Repairs cost ₦${cost.toLocaleString()}.`);h.condition=100;e.holdings[id]=h;return done('Builders repaired the damage. Condition 100%.');}
 if(c.action==='upgrade-car'||c.action==='paint-car'){const kind=id as VehicleKind;if(!Object.hasOwn(vehicles,kind)||!g.inventory.includes(vehicles[kind].key))return fail('You must own this vehicle.');const garageNear=locations.some(l=>l.type==='garage'&&Math.hypot(l.x-g.position[0],l.z-g.position[1])<10)||Object.values(enterpriseOf(g).businesses).some(b=>b.kind==='dealership'),factor=(['sports','luxury','suv'].includes(kind)?1.5:1)*(garageNear?1:1.5),mods={...(e.cars[kind]??{})};
  if(c.action==='paint-car'){if(!/^#[0-9a-f]{6}$/i.test(c.kind??''))return fail('Choose a paint colour.');if(!spend(Math.round(3000*factor)))return fail('A respray costs ₦3,000+.');mods.paint=c.kind;e.cars[kind]=mods;return done('Fresh respray done at the panel beater.');}
  const mod=c.kind as ModKind;if(!Object.hasOwn(data.mods,mod))return fail('Choose an upgrade.');const level=mods[mod]??0;if(level>=data.mods[mod].max)return fail('Already at maximum.');const cost=Math.round(data.mods[mod].cost*(level+1)*factor);if(!spend(cost))return fail(`Not enough cash: ₦${cost.toLocaleString()}.`);mods[mod]=level+1;e.cars[kind]=mods;return done(`${data.mods[mod].name} fitted (level ${level+1})${garageNear?'':' by a mobile mechanic (+50%)'}.`);}
 const raid=e.raid;
 if(c.action==='call-police'){if(!raid||raid.status==='scheduled'&&!raid.warned)return fail('There is no threat to report.');if((g.wanted??0)>=2)return fail('With your wanted level, the police may arrest you instead.');if(raid.police!==undefined)return fail('Police are already on the way.');const d=districtOf(raid.target),response=Math.max(6,(data.police[d as DistrictId]??20)-Math.floor((e.influence[d]??0)/10));e.raid={...raid,police:raid.status==='scheduled'?raid.at:now+response};return done(raid.status==='scheduled'?'Police will stake out your property at the expected time.':`Police are responding: about ${response} minutes away. Hold on!`);}
 if(c.action==='settle'){if(!raid)return fail('Nobody is demanding money.');const info=data.raids[raid.kind];if(!('settlement' in info))return fail('These attackers cannot be paid off.');const cost=Math.round(info.settlement*(1+e.heat/50));if(!spend(cost))return fail(`They want ₦${cost.toLocaleString()}.`);if(raid.rival){const r=e.rivals.find(x=>x.id===raid.rival);if(r)r.hostility=clamp(r.hostility-10);}e.log=[{day:g.day,kind:raid.kind,target:raid.target,outcome:'settled' as const,loss:cost},...e.log].slice(0,20);e.raid=undefined;return done(`Paid ₦${cost.toLocaleString()}. They leave quietly.`);}
 if(c.action==='hit-raider'){if(raid?.status!=='active')return fail('No attack in progress.');e.raid={...raid,attackers:raid.attackers-1};if(e.raid.attackers<=0){resolveRaid(next,e,true,'repelled');return done('The last attacker is down. Raid repelled!');}return done(`Attacker down. ${e.raid.attackers} left.`);}
 if(c.action==='raid-breach'||c.action==='defend'||c.action==='flee'){if(raid?.status!=='active')return fail('No attack in progress.');const won=resolveRaid(next,e,c.action!=='flee',c.action==='raid-breach'?'lost':undefined);if(next.stats.health<=0)next.deathCause='Raid on your property';return done(c.action==='flee'?'You escaped. The attackers did as they pleased.':won?'You fought them off!':'They overpowered your defences.');}
 if(c.action==='hire-vigilante'){if(e.vigilante>=g.day)return fail('The vigilante group is already patrolling.');if(!spend(15000))return fail('A week of vigilante patrols costs ₦15,000.');e.vigilante=g.day+7;return done('Neighbourhood vigilantes patrol all your properties for seven days.');}
 if(c.action==='sponsor'){if(!districts.some(d=>d.id===id))return fail('Choose a district.');const key=`sponsor-${id}-${g.day}`;if(e.receipts.includes(key))return fail('One community event per district per day.');if(!spend(20000))return fail('A community event costs ₦20,000.');e.receipts.push(key);e.influence[id]=clamp((e.influence[id]??0)+12);e.heat=clamp(e.heat-5);next.sim={...simOf(next),progress:{...simOf(next).progress,reputation:clamp(simOf(next).progress.reputation+3)}};return done('Owambe sponsored! Jollof, music and goodwill. Influence +12.');}
 const r=e.rivals.find(r=>r.id===id);
 if(c.action==='rival-truce'){if(!r||r.defeated)return fail('Choose an active rival.');const cost=30000+Math.round(r.hostility*500);if(!spend(cost))return fail(`A truce costs ₦${cost.toLocaleString()}.`);r.truceUntil=g.day+14;r.hostility=clamp(r.hostility-40);return done(`Truce with ${rivalInfo(r.id).name} for 14 days.`);}
 if(c.action==='rival-expose'){if(!r||r.defeated)return fail('Choose an active rival.');const key=`expose-${r.id}-${g.day}`;if(e.receipts.includes(key))return fail('Your journalists need a day to dig further.');if(!spend(10000))return fail('Investigators cost ₦10,000.');e.receipts.push(key);const chance=Math.min(.85,.3+g.skills.communication*.05+((g.flags??[]).includes('reported')?.2:0));if(random(g.seed+313,g.day*7+r.id.length)<chance){r.wealth=Math.floor(r.wealth*.65);r.hostility=clamp(r.hostility+25);return done(`Exposé published! ${rivalInfo(r.id).name} loses a third of its value.`);}r.hostility=clamp(r.hostility+15);e.heat=clamp(e.heat+5);return done('The story fell apart. Your rival knows you tried.');}
 if(c.action==='rival-buyout'){if(!r||r.defeated)return fail('Choose an active rival.');const worth=netWorth(g),price=Math.floor(r.wealth*.4);if(worth<r.wealth*1.5)return fail(`You need a net worth of ₦${Math.floor(r.wealth*1.5).toLocaleString()} to take them over.`);if(!spend(price))return fail(`The takeover needs ₦${price.toLocaleString()} in cash.`);r.defeated=true;r.hostility=0;e.influence[rivalInfo(r.id).district]=clamp((e.influence[rivalInfo(r.id).district]??0)+20);return done(`${rivalInfo(r.id).name} is now yours. It pays a daily dividend.`);}
 if(['buy-animal','feed-herd','vet-herd','sell-herd'].includes(c.action)){
  if(!isOwned)return fail('Own this farm plot first.');const herds={...(e.herds[id]??{})},kind=c.kind as AnimalKind,qty=Math.floor(c.amount??1);
  if(c.action==='buy-animal'){if(!Object.hasOwn(data.animals,kind))return fail('Choose an animal.');const cfg=data.animals[kind],h={...(herds[kind]??freshHerd())},room=housing(g,id,kind)-h.count-h.young;if(room<=0)return fail(`Build a ${enterpriseData.blocks[cfg.housing as keyof typeof enterpriseData.blocks].name.toLowerCase()} first (or more of them).`);if(qty<1||qty>room)return fail(`Space for ${room} more.`);if(!spend(cfg.price*qty))return fail(`Not enough cash: ₦${(cfg.price*qty).toLocaleString()}.`);h.age=h.count?Math.floor(h.age*h.count/(h.count+qty)):0;h.count+=qty;herds[kind]=h;e.herds[id]=herds;return done(`${qty} ${cfg.name.toLowerCase()} delivered. Feed them daily.`);}
  if(c.action==='feed-herd'){const list=Object.entries(herds).filter(([,h])=>h&&h.count+h.young>0) as [AnimalKind,Herd][];if(!list.length)return fail('No animals on this farm.');if(qty<1||qty>10000||!spend(qty*60))return fail('Choose an affordable feed quantity (₦60/kg).');const need=list.reduce((n,[k,h])=>n+(h.count+h.young*.5)*data.animals[k].feed,0)||1;for(const [k,h] of list)herds[k]={...h,feed:h.feed+qty*(h.count+h.young*.5)*data.animals[k].feed/need};e.herds[id]=herds;return done(`${qty} kg of feed shared across your animals.`);}
  if(c.action==='vet-herd'){if(!Object.keys(herds).length)return fail('No animals on this farm.');if(!spend(2500))return fail('The vet charges ₦2,500.');for(const k of Object.keys(herds) as AnimalKind[])herds[k]={...herds[k]!,health:100};e.herds[id]=herds;return done('Vet visit complete. Animals healthy.');}
  if(c.action==='sell-herd'){const h=herds[kind];if(!h||!h.count)return fail('No adult animals of this kind.');const cfg=data.animals[kind];if(h.age<cfg.days)return fail(`Too young: ${h.age}/${cfg.days} days.`);const month=weather(g).month,total=Math.floor(h.count*cfg.sale*h.health/100*festivalFactor(kind,month));next.money+=total;herds[kind]={...h,count:0,age:0};e.herds[id]=herds;return done(`Sold for ₦${total.toLocaleString()}${festivalFactor(kind,month)>1?' — festive season prices!':''}.`);}
 }
 if(c.action==='story-advance'||c.action==='story-choice'){
  const status=storyStatus({...g,empire:e});if(status.complete)return fail('The Empire arc is complete. Lagos is yours.');if(status.blocked)return fail(status.blocked);if(!status.atPlace)return fail(status.hint);
  if(c.action==='story-advance'){if(status.choices)return fail('Make a choice.');e.story={...e.story,step:e.story.step+1};return done(`Chapter ${status.chapter}: ${empireStory[e.story.part].steps[e.story.step].objective}.`);}
  if(!status.choices?.some(x=>x.id===c.kind))return fail('Choose one of the listed options.');const before=JSON.stringify(e.story.flags),moneyBefore=next.money,result=storyChoice(next,e,c.kind!);
  const progressed=JSON.stringify(e.story.flags)!==before;if(!progressed){next.money=moneyBefore;return fail(result??'Nothing happened.');}
  e.story={part:e.story.part+1,step:0,flags:e.story.flags};return done(result??'Chapter complete.');
 }
 return fail('Unknown empire action.');
}

export function validEmpire(value:unknown):value is Empire{
 if(!value||typeof value!=='object')return false;const e=value as Empire,num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0,record=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v);
 try{return e.version===1&&Number.isInteger(e.lastDay)&&e.lastDay>=1&&num(e.heat)&&e.heat<=100&&num(e.vigilante)&&record(e.holdings)&&Object.entries(e.holdings).every(([id,h])=>parcels.some(p=>p.id===id)&&num(h.condition)&&h.condition<=100&&num(h.repelled)&&num(h.lastRaid)&&record(h.defenses)&&Object.entries(h.defenses).every(([k,v])=>Object.hasOwn(data.defenses,k)&&Number.isInteger(v)&&v!>=0&&v!<=3))
  &&record(e.cars)&&Object.entries(e.cars).every(([k,m])=>Object.hasOwn(vehicles,k)&&record(m)&&Object.entries(m!).every(([mod,v])=>mod==='paint'?typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v):Object.hasOwn(data.mods,mod)&&Number.isInteger(v)&&(v as number)>=0&&(v as number)<=data.mods[mod as ModKind].max))
  &&(e.raid===undefined||Object.hasOwn(data.raids,e.raid.kind)&&parcels.some(p=>p.id===e.raid!.target)&&['scheduled','active'].includes(e.raid.status)&&[e.raid.at,e.raid.attackers,e.raid.initial,e.raid.strength].every(num)&&typeof e.raid.warned==='boolean'&&(e.raid.deadline===undefined||num(e.raid.deadline))&&(e.raid.police===undefined||num(e.raid.police)))
  &&Array.isArray(e.log)&&e.log.length<=20&&e.log.every(l=>Object.hasOwn(data.raids,l.kind)&&num(l.day)&&num(l.loss)&&['repelled','lost','settled'].includes(l.outcome))
  &&Array.isArray(e.rivals)&&e.rivals.every(r=>data.rivals.some(x=>x.id===r.id)&&num(r.wealth)&&num(r.hostility)&&r.hostility<=100&&num(r.truceUntil)&&typeof r.defeated==='boolean')
  &&record(e.influence)&&Object.entries(e.influence).every(([d,v])=>districts.some(x=>x.id===d)&&num(v)&&v<=100)
  &&record(e.herds)&&Object.entries(e.herds).every(([id,herds])=>parcels.some(p=>p.id===id)&&record(herds)&&Object.entries(herds).every(([k,h])=>Object.hasOwn(data.animals,k)&&!!h&&[h.count,h.young,h.age,h.youngAge,h.feed,h.health].every(num)))
  &&!!e.story&&Number.isInteger(e.story.part)&&e.story.part>=0&&e.story.part<=empireStory.length&&Number.isInteger(e.story.step)&&e.story.step>=0&&e.story.step<=1&&Array.isArray(e.story.flags)&&e.story.flags.every(f=>typeof f==='string')&&Array.isArray(e.receipts)&&e.receipts.every(r=>typeof r==='string');}catch{return false;}
}
