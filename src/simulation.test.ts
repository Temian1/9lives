import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,validSave,useGame,controls} from './game';
import {simulate,simulationDay,salePrice} from './simulation';
import {locations,districts} from '../shared/city';
test('new campaigns get one million naira and hospital lives require location, money and capacity',()=>{
 let g=fresh();assert.equal(g.money,1000000);g.lives=8;assert.equal(simulate(g,'buy-life').game.lives,8);
 const hospital=locations.find(l=>l.type==='hospital')!;g.position=[hospital.x,hospital.z];g=simulate(g,'buy-life').game;assert.equal(g.lives,9);assert.equal(g.money,975000);assert.equal(simulate(g,'buy-life').game.money,975000);g.lives=0;assert.equal(simulate(g,'buy-life').game.lives,0);
});
test('rent persists, arrears produce notices and eviction, negotiation and payment settle landlord disputes',()=>{
 let g=simulate(fresh(),'rent','house-ikorodu').game;assert.equal(g.sim!.leases.length,1);assert.equal(validSave(g),true);
 g=simulationDay({...g,day:9});assert.equal(g.sim!.leases[0].warnings,1);const arrears=g.sim!.leases[0].arrears;g=simulate(g,'negotiate-rent','house-ikorodu').game;assert.ok(g.sim!.leases[0].arrears<arrears);const once=g.sim!.leases[0].arrears;assert.equal(simulate(g,'negotiate-rent','house-ikorodu').game.sim!.leases[0].arrears,once);g=simulate(g,'pay-rent','house-ikorodu').game;assert.equal(g.sim!.leases[0].warnings,0);
 let unpaid=simulate(fresh(),'rent','house-ikorodu').game;unpaid.interior='house-ikorodu';unpaid=simulationDay({...unpaid,day:24});assert.equal(unpaid.sim!.leases.length,0);assert.equal(unpaid.interior,undefined);assert.ok(unpaid.sim!.messages.some(m=>m.includes('evicted')));
});
test('resale removes access, tenant income pays weekly and businesses consume stock without mutating old saves',()=>{
 let g=fresh();g.properties!.push({id:'plot-yaba',kind:'club',level:1,furniture:[]});g=simulate(g,'restock','plot-yaba').game;const old=structuredClone(g);const hired=simulate(g,'hire-staff','plot-yaba').game;assert.deepEqual(g,old);g=simulate(hired,'open-business','plot-yaba').game;const money=g.money;g=simulationDay({...g,day:2});assert.ok(g.money>money);assert.equal(g.sim!.businesses['plot-yaba'].stock,13);
 const price=salePrice(g,'plot-yaba');g.interior='plot-yaba';const sold=simulate(g,'sell-property','plot-yaba').game;assert.equal(sold.money,g.money+price);assert.equal(sold.interior,undefined);assert.equal(sold.sim!.businesses['plot-yaba'],undefined);
 g=fresh();g=simulate(g,'find-tenant','house-yaba').game;g=simulationDay({...g,day:8});assert.equal(g.money,1001000);
});
test('delivery payout requires pickup and destination and only pays once; bank rejects invalid amounts',()=>{
 let g=simulate(fresh(),'start-job','delivery').game;assert.equal(simulate(g,'job-step').game.sim!.job!.stage,0);const park=locations.find(l=>l.type==='terminal'&&l.district==='yaba')!;g.position=[park.x,park.z];g=simulate(g,'job-step').game;assert.equal(g.sim!.job!.stage,1);assert.equal(simulate(g,'job-step').game.money,1000000);const d=districts.find(d=>d.id===g.sim!.job!.destination)!;g.position=[d.x-4,d.z+12];g=simulate(g,'job-step').game;assert.equal(g.money,1004500);assert.equal(g.sim!.job,undefined);assert.equal(simulate(g,'job-step').game.money,1004500);assert.equal(simulate(g,'deposit','',NaN).game.money,g.money);
});
test('malformed nested simulation and furniture saves fail validation rather than crashing',()=>{
 const g=fresh();assert.equal(validSave(g),true);for(const modify of [(g:ReturnType<typeof fresh>)=>{g.sim!.garage.car={fuel:100,condition:100,parked:null as never};},(g:ReturnType<typeof fresh>)=>{g.sim!.businesses['plot-yaba']={stock:NaN,staff:0,open:true,earned:0};},(g:ReturnType<typeof fresh>)=>{g.properties![0].placements={bed:{x:Infinity,z:0,rotation:0}};}]){const copy=structuredClone(g);modify(copy);assert.equal(validSave(copy),false);}
});
test('buying a rented home ends its lease and resale cannot generate cash from a free starter house',()=>{
 const g=simulate(fresh(),'rent','house-ikorodu').game,deposit=g.sim!.leases[0].deposit;useGame.setState({game:g,ride:null});useGame.getState().propertyAction('house-ikorodu','buy');const purchased=useGame.getState().game;assert.equal(purchased.sim!.leases.length,0);assert.equal(purchased.money,g.money-16000+deposit);const sold=simulate(fresh(),'sell-property','house-yaba').game;useGame.setState({game:sold});useGame.getState().propertyAction('house-yaba','buy');const bought=useGame.getState().game;const again=simulate(bought,'sell-property','house-yaba').game;assert.ok(again.money<sold.money);
});
test('purchased clubs can be entered and furnished and saved furniture coordinates validate',()=>{
 const g=fresh();g.properties!.push({id:'plot-yaba',kind:'club',level:1,furniture:[]});useGame.setState({game:g,ride:null});useGame.getState().propertyAction('plot-yaba','sofa');assert.ok(useGame.getState().game.properties!.find(p=>p.id==='plot-yaba')!.furniture.includes('sofa'));controls.position=[20,-14.5];useGame.getState().propertyAction('plot-yaba','enter');assert.equal(useGame.getState().game.interior,'plot-yaba');useGame.getState().placeFurniture('plot-yaba','sofa',1,1,2);assert.equal(validSave(useGame.getState().game),true);
});
