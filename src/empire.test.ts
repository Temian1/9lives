import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,validSave,advance} from './game';
import {carStats,defenseOf,empireAction,empireClock,empireOf,festivalFactor,freshEmpire,holdingOf,minuteOf,netWorth,scheduleRaid,storyStatus,validEmpire} from './empire';
import {enterpriseAction,enterpriseData,newPlot} from './enterprise';
import {idleCar,impact,stepCar} from './vehiclePhysics';
import {canMove,blockers,locations} from '../shared/city';
import {entrance,front,parcels} from '../shared/property';
import {roadFacing} from '../shared/roads';
type Game=ReturnType<typeof fresh>;
const act=(g:Game,action:string,extra:Record<string,unknown>={})=>empireAction(g,{action,...extra}).game;
const withPlot=(built=true)=>{const g=fresh();g.created=true;const parcel=parcels.find(p=>p.size===16&&!p.built)!;g.properties!.push({id:parcel.id,kind:built?'house':'land',level:1,furniture:['bed','sofa','tv']});g.enterprise!.plots[parcel.id]={...newPlot(),registered:true};g.empire=freshEmpire(1);return {g,id:parcel.id,parcel};};
const at=(g:Game,minute:number):Game=>({...g,day:Math.floor(minute/1440)+1,minutes:minute%1440});

test('every building and plot entrance faces a reachable road',()=>{
 for(const p of parcels){const door=entrance(p);assert.ok(canMove(...door),`${p.id} door is walkable`);if(p.id==='house-yaba')continue;const f=front(p),toDoor=[door[0]-p.x,door[1]-p.z];assert.ok(toDoor[0]*f.dir[0]+toDoor[1]*f.dir[1]>0,`${p.id} door is on its front face`);}
 for(const b of blockers.filter(b=>b.district==='yaba').slice(0,6)){const f=roadFacing(b.x,b.z);assert.equal(f.dir[1],0,'district blocks beside the main road face it sideways');assert.equal(Math.sign(f.dir[0]),Math.sign(0-b.x));}
});

test('fortifying charges escalating prices, caps levels and raises defence; repairs restore condition',()=>{
 let {g,id}=withPlot();const money=g.money,base=defenseOf(g,id);
 g=act(g,'fortify',{id,kind:'gate'});assert.equal(g.money,money-5000);g=act(g,'fortify',{id,kind:'gate'});assert.equal(g.money,money-15000);
 assert.ok(defenseOf(g,id)>=base+16);g=act(g,'fortify',{id,kind:'gate'});const capped=act(g,'fortify',{id,kind:'gate'});assert.equal(capped.money,g.money,'level 3 is the maximum');
 g.empire!.holdings[id]={...holdingOf(empireOf(g),id),condition:40};const before=g.money;g=act(g,'repair',{id});assert.equal(g.money,before-60*300);assert.equal(holdingOf(empireOf(g),id).condition,100);
 assert.equal(act(fresh(),'fortify',{id,kind:'gate'}).money,1000000,'cannot fortify property you do not own');
});

test('raids wait for a newcomer grace period and strong defences make them rarer',()=>{
 const {g,id}=withPlot();
 const early=empireClock({...g,day:3,empire:freshEmpire(2)});assert.equal(early.empire!.raid,undefined);
 const count=(game:Game)=>Array.from({length:300},(_,seed)=>empireClock({...game,seed,day:5,empire:{...structuredClone(game.empire!),lastDay:4}})).filter(x=>x.empire!.raid).length;
 const weak=count(g);let strong=g;for(const kind of ['fence','gate','cctv','dogs','gateman','alarm'])for(let i=0;i<3;i++)strong=act(strong,'fortify',{id,kind});strong.money=g.money;
 assert.ok(weak>0,'undefended valuable property is sometimes targeted');assert.ok(count(strong)<weak,'fortified property is targeted less often');
});

test('an unattended raid resolves when its time passes: losses, condition damage and a log entry',()=>{
 let {g,id}=withPlot();g.enterprise!.vaults[id]={money:10000,items:['Gold watch']};g.position=[0,6];const e=structuredClone(g.empire!);g.day=5;g.minutes=600;e.lastDay=5;
 scheduleRaid(g,e,'armed-robbers',id,minuteOf(g)+60);e.raid!.strength=500;g.empire=e;
 g=empireClock(at(g,minuteOf(g)+61));const log=empireOf(g).log[0];
 assert.equal(empireOf(g).raid,undefined);assert.equal(log.outcome,'lost');assert.ok(holdingOf(empireOf(g),id).condition<100);assert.ok(g.enterprise!.vaults[id].money<10000);assert.ok(validSave(g));
});

test('a raid becomes live when the owner is present; each downed raider counts and the last one repels the attack',()=>{
 let {g,id,parcel}=withPlot();g.position=entrance(parcel);g.day=5;g.minutes=1300;const e=structuredClone(g.empire!);e.lastDay=5;scheduleRaid(g,e,'burglars',id,minuteOf(g)+1);g.empire=e;
 g=empireClock(at(g,minuteOf(g)+2));const raid=empireOf(g).raid!;assert.equal(raid.status,'active');
 for(let i=0;i<raid.initial;i++)g=act(g,'hit-raider',{receipt:'r'+i});assert.equal(act(g,'hit-raider',{receipt:'r0'}).empire,g.empire,'receipts prevent double counting');
 assert.equal(empireOf(g).raid,undefined);assert.equal(empireOf(g).log[0].outcome,'repelled');assert.equal(holdingOf(empireOf(g),id).repelled,1);
});

test('land grabbers can be paid off; police need intel before an attack starts',()=>{
 let {g,id}=withPlot(false);g.day=5;const e=structuredClone(g.empire!);e.lastDay=5;scheduleRaid(g,e,'omo-onile',id,minuteOf(g)+120);e.raid!.warned=false;g.empire=e;
 assert.equal(act(g,'call-police').empire!.raid!.police,undefined,'no intel, no stake-out');
 g.empire!.raid!.warned=true;const staked=act(g,'call-police');assert.equal(staked.empire!.raid!.police,g.empire!.raid!.at);
 const money=g.money;g=act(g,'settle');assert.ok(g.money<money);assert.equal(empireOf(g).raid,undefined);assert.equal(empireOf(g).log[0].outcome,'settled');
});

test('car snatchers take an untracked car but a GPS tracker recovers it',()=>{
 const run=(tracker:boolean)=>{let {g,id,parcel}=withPlot();g.inventory.push('Car key');g.sim!.garage.car={fuel:80,condition:90,parked:entrance(parcel)};if(tracker)g.empire!.cars.car={tracker:1};g.position=[0,6];g.day=5;const e=structuredClone(g.empire!);e.lastDay=5;scheduleRaid(g,e,'car-snatchers',id,minuteOf(g)+5);e.raid!.strength=500;g.empire=e;return empireClock(at(g,minuteOf(g)+6));};
 const lost=run(false);assert.equal(lost.inventory.includes('Car key'),false);assert.equal(lost.sim!.garage.car,undefined);
 const kept=run(true);assert.ok(kept.inventory.includes('Car key'));assert.equal(kept.sim!.garage.car!.condition,50);
});

test('car tuning changes handling stats and is charged once per level',()=>{
 let g=fresh();g.inventory.push('Car key');const garage=locations.find(l=>l.type==='garage')!;g.position=[garage.x,garage.z];const money=g.money;
 g=act(g,'upgrade-car',{id:'car',kind:'engine'});assert.equal(g.money,money-8000);g=act(g,'upgrade-car',{id:'car',kind:'armor'});
 const tuned=carStats('car',empireOf(g).cars.car),stock=carStats('car');assert.ok(tuned.topSpeed>stock.topSpeed*1.05);assert.equal(tuned.armor,1);
 assert.equal(act(fresh(),'upgrade-car',{id:'car',kind:'engine'}).money,1000000,'must own the car');
 g=act(g,'paint-car',{id:'car',kind:'#123456'});assert.equal(empireOf(g).cars.car!.paint,'#123456');assert.ok(validSave(g));
});

test('vehicle physics: bounded acceleration, braking to rest, no pivoting in place, less grip in rain, armoured crashes',()=>{
 const stats=carStats('car');let s=idleCar(0);for(let i=0;i<400;i++)s=stepCar(s,{throttle:1,steer:0,brake:false,boost:false},.05,stats).state;
 assert.ok(s.speed>stats.topSpeed*.8&&s.speed<=stats.topSpeed,'approaches but never exceeds top speed');
 let stop=s;for(let i=0;i<80;i++)stop=stepCar(stop,{throttle:0,steer:0,brake:true,boost:false},.05,stats).state;assert.equal(stop.speed,0);
 assert.equal(stepCar(idleCar(1),{throttle:0,steer:1,brake:false,boost:false},.05,stats).state.angle,1);
 const dry=stepCar({...s},{throttle:1,steer:1,brake:false,boost:false},.05,stats),wet=stepCar({...s},{throttle:1,steer:1,brake:false,boost:false},.05,stats,true);
 assert.ok(Math.abs(wet.state.angle-s.angle)<Math.abs(dry.state.angle-s.angle));
 assert.equal(impact(1.5,stats).damage,0);assert.ok(impact(12,carStats('car',{armor:3})).damage<impact(12,stats).damage);assert.ok(impact(12,stats).speed<0,'hard hits bounce back');
});

test('new livestock needs housing, feed and time; breeding fills capacity; festive seasons lift prices',()=>{
 let {g,id}=withPlot(false);assert.equal(act(g,'buy-animal',{id,kind:'goat',amount:4}).money,g.money,'needs a pen');
 g=enterpriseAction(g,{action:'place',id,kind:'pen',x:-5,z:-5,y:0,rotation:0}).game;g=act(g,'buy-animal',{id,kind:'goat',amount:4});assert.equal(empireOf(g).herds[id]!.goat!.count,4);
 assert.equal(act(g,'buy-animal',{id,kind:'goat',amount:20}).money,g.money,'capacity enforced');
 g=act(g,'fortify',{id,kind:'fence'});g=act(g,'feed-herd',{id,amount:2000});const e=empireOf(g);g.day=e.lastDay+160;g=empireClock(g);const herd=empireOf(g).herds[id]!.goat!;assert.ok(herd.age>=150);assert.ok(herd.young>0,'goats breed');
 assert.equal(act(g,'sell-herd',{id,kind:'goat'}).money,g.money,'too young to sell');
 g.empire!.herds[id]!.goat!.age=300;const sold=act(g,'sell-herd',{id,kind:'goat'});assert.ok(sold.money>g.money);
 assert.ok(festivalFactor('ram',6)>1);assert.equal(festivalFactor('catfish',6),1);
 for(const crop of ['plantain','pepper','okra','groundnut','sorghum','ginger'])assert.ok(crop in enterpriseData.crops);
});

test('empire arc: gated objectives, location choices, failed choices cost nothing',()=>{
 let g=fresh();g.created=true;const first=storyStatus(g);assert.ok(!first.complete&&first.blocked);
 ({g}=withPlot(false));g=act(g,'story-advance');assert.equal(empireOf(g).story.step,1);
 const id=g.properties![1].id;g.enterprise!.plots[id].registered=false;assert.equal(act(g,'story-choice',{kind:'pay'}).empire!.story.part,0,'must stand at the plot');
 g.position=entrance(parcels.find(p=>p.id===id)!);g.skills.communication=1;const refused=act(g,'story-choice',{kind:'baale'});assert.equal(refused.money,g.money);assert.equal(empireOf(refused).story.part,0);
 g=act(g,'story-choice',{kind:'police'});assert.equal(empireOf(g).story.part,1);assert.equal(empireOf(g).raid?.kind,'omo-onile','unregistered deed invites a night attack');
});

test('empire saves validate, reject tampering and older saves without empire data remain valid',()=>{
 const g=fresh();assert.ok(validSave(g));const advanced=advance(g,5);assert.ok(advanced.empire&&validSave(advanced));
 const bad=structuredClone(advanced);bad.empire!.heat=500;assert.equal(validSave(bad),false);
 const bad2=structuredClone(advanced);bad2.empire!.holdings['nope']={condition:50,defenses:{},repelled:0,lastRaid:0};assert.equal(validEmpire(bad2.empire),false);
 const bad3=structuredClone(advanced);bad3.empire!.cars.car={engine:9};assert.equal(validEmpire(bad3.empire),false);
 assert.ok(netWorth(g)>=1000000);
});
