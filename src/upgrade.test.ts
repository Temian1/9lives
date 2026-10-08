import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canDrive,sweptDrive,trafficAt,vehicleSize,blockers,districts,canMove} from '../shared/city';
import {parcels,entrance,starterProperty} from '../shared/property';
import {controls,fresh,loseLife,useGame,validSave,recoverSavePosition} from './game';

test('vehicle footprint and swept collision prevent corner clipping and tunneling',()=>{
  assert.equal(canMove(-6,-4),true);
  assert.equal(canDrive(-6,-4,0,'car'),false);
  assert.equal(sweptDrive([-14,-4],[-4,-4],Math.PI/2,'car'),false);
  assert.equal(sweptDrive([0,6],[0,-20],0,'bus'),true);
  assert.equal(canDrive(0,6,0,'car',[{x:0,z:8,w:2,d:4}]),false);
  assert.equal(canDrive(-8,20,0,'car'),false);
});
test('traffic spacing remains safe over time and districts have different skylines',()=>{
  for(const time of [0,1,42,10000,1000000]){
    const cars=trafficAt(time);for(const a of cars)for(const b of cars){if(a.id>=b.id||a.x!==b.x)continue;const distance=Math.abs(a.z-b.z);assert.ok(Math.min(distance,147-distance)>vehicleSize(a.kind)[1]+vehicleSize(b.kind)[1]+3);}
  }
  assert.equal(new Set(districts.map(d=>blockers.filter(b=>b.district===d.id).length)).size,6);
});
test('purchase land, build once, buy furniture once, enter nearby owned houses, and validate saves',()=>{
  useGame.setState({game:{...fixture(),created:true,money:100000},ride:null,driving:null});
  const s=useGame.getState();s.propertyAction('plot-ikorodu','buy');s.propertyAction('plot-ikorodu','house');const cash=useGame.getState().game.money;s.propertyAction('plot-ikorodu','house');assert.equal(useGame.getState().game.money,cash);
  s.propertyAction('plot-ikorodu','bed');const after=useGame.getState().game.money;s.propertyAction('plot-ikorodu','bed');assert.equal(useGame.getState().game.money,after);
  controls.position=[0,6];s.propertyAction('plot-ikorodu','enter');assert.equal(useGame.getState().game.interior,undefined);
  const parcel=parcels.find(p=>p.id==='plot-ikorodu')!;controls.position=entrance(parcel);s.update(g=>({...g,position:entrance(parcel)}));s.propertyAction(parcel.id,'enter');assert.equal(useGame.getState().game.interior,parcel.id);assert.ok(validSave(useGame.getState().game));s.homeAction('sleep');assert.equal(useGame.getState().game.pose,'sleep');s.propertyAction(parcel.id,'exit');assert.equal(useGame.getState().game.interior,undefined);
  assert.equal(validSave({...fixture(),properties:[starterProperty(),starterProperty()]}),false);
});
test('kidnapping ransom and rescue remove captivity; unpaid deadline consumes a life',()=>{
  const previous=globalThis.document;Object.defineProperty(globalThis,'document',{value:{hidden:false},configurable:true});
  try{useGame.setState({game:{...fixture(),created:true,stage:'ledger'},ride:null,paused:false});const s=useGame.getState();s.story('kidnap');assert.equal(useGame.getState().game.captivity?.remaining,60);s.story('ransom');assert.equal(useGame.getState().game.money,2000);assert.equal(useGame.getState().game.captivity,undefined);s.story('kidnap');s.story('rescue');assert.equal(useGame.getState().game.relationships.amara,40);s.story('kidnap');s.update(g=>({...g,captivity:{remaining:1,ransom:3000}}));s.tick();assert.equal(useGame.getState().game.lives,8);assert.equal(useGame.getState().game.captivity,undefined);assert.equal(useGame.getState().game.deathCause,'Unpaid kidnapping ransom');}
  finally{Object.defineProperty(globalThis,'document',{value:previous,configurable:true});}
});
test('zero lives starts a one-hour break and reset cannot bypass it',()=>{
  const before=Date.now(),dead=loseLife({...fixture(),lives:1});assert.ok(dead.breakUntil!>=before+3600000);assert.ok(validSave(dead));useGame.setState({game:dead});useGame.getState().reset();assert.equal(useGame.getState().game.lives,0);
});
test('patrol arrest clears wanted status, charges fine, and returns to police',()=>{
  useGame.setState({game:{...fixture(),created:true,wanted:3},ride:null});useGame.getState().arrest();const g=useGame.getState().game;assert.equal(g.wanted,0);assert.equal(g.money,2000);assert.deepEqual(g.position,[-106,-3]);assert.equal(useGame.getState().modal,'police');assert.ok(validSave(g));
});

test('new collision geometry relocates an older save without discarding purchases or story',()=>{const old={...fixture(),position:[17,-32] as [number,number],money:23000,stage:'ledger'};assert.equal(validSave(old),false);const migrated=recoverSavePosition(old);assert.ok(validSave(migrated));assert.equal(migrated.money,23000);assert.equal(migrated.stage,'ledger');assert.deepEqual(migrated.position,[0,12]);assert.equal(validSave(recoverSavePosition({...fixture(),position:[100,100]})),false);});

function fixture(){return {...fresh(),money:5000};}
