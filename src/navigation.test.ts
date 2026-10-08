import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avoidsBodies,cameraFraction,clearSegment,findRoute,type Point} from '../shared/navigation';
import {controls,fresh,recoverSavePosition,useGame,validSave} from './game';
import {parcels} from '../shared/property';
import {roomBounds,roomFree,worldFree} from './spatial';
import {steerCrowd} from './crowd';
import {approachPlace,navigateTo} from './navigation';
import {locations} from '../shared/city';

test('walking routes go around walls without cutting corners and reject enclosed destinations',()=>{
 const free=(x:number,z:number)=>Math.abs(x)<12&&Math.abs(z)<12&&!(Math.abs(x)<1.3&&Math.abs(z)<3.3);
 const start:Point=[-5,0],end:Point=[5,0],route=findRoute(start,end,free);assert.ok(route);assert.ok(route.length>1);
 let previous=start;for(const step of route){assert.equal(clearSegment(previous,step,free),true);previous=step;}assert.deepEqual(previous,end);
 const ring=(x:number,z:number)=>Math.abs(x)<10&&Math.abs(z)<10&&!(Math.max(Math.abs(x),Math.abs(z))>2&&Math.max(Math.abs(x),Math.abs(z))<4);
 assert.equal(findRoute([7,0],[0,0],ring),null);assert.equal(findRoute(start,[0,0],free),null);
 assert.equal(findRoute(start,[NaN,0],free),null);
});
test('NPC collision permits escaping existing overlap but prevents walking further through a body',()=>{
 const body={id:'neighbor',x:0,z:0,radius:.36};
 assert.equal(avoidsBodies([.4,0],[.3,0],[body]),false);assert.equal(avoidsBodies([.4,0],[.5,0],[body]),true);
 assert.equal(avoidsBodies([1,0],[.5,0],[body]),false);assert.equal(avoidsBodies([1,0],[.5,0],[body],.3,'neighbor'),true);
 let p:Point=[-1,0];for(let i=0;i<180;i++)p=steerCrowd(p,[2,0],()=>true,[body],'walker',.05);
 assert.ok(Math.hypot(...p)>=.72-.001);assert.ok(p[0]>0,'walker steers around the neighbor');
});
test('camera stops before buildings but can see over a low obstacle',()=>{
 const box={x:0,z:5,w:4,d:2,h:4};const fraction=cameraFraction([0,1,0],[0,2,10],[box]);assert.ok(fraction>0&&fraction<.4);
 assert.equal(cameraFraction([0,8,0],[0,9,10],[box]),1);
});
test('house purchase charges once, clears blocking input and keeps campaign state intact',()=>{
 const g={...fresh(),created:true,stage:'ledger',inventory:['Phone','Evidence ledger']};useGame.setState({game:g,modal:'property',paused:false,ride:null});
 controls.keys.add('w');controls.x=1;controls.route=[[5,5]];controls.destination=[5,5];
 useGame.getState().propertyAction('house-ikorodu','buy');let s=useGame.getState();assert.equal(s.game.money,984000);assert.equal(s.game.stage,'ledger');assert.deepEqual(s.game.inventory,[...g.inventory,'Unregistered deed: house-ikorodu']);assert.equal(s.modal,null);assert.equal(controls.keys.size,0);assert.equal(controls.x,0);assert.equal(controls.destination,null);
 s.propertyAction('house-ikorodu','buy');s=useGame.getState();assert.equal(s.game.money,984000);assert.equal(s.game.properties!.filter(p=>p.id==='house-ikorodu').length,1);
});
test('construction relocates an overlapping player, preserves distant positions and repairs old saves',()=>{
 const p=parcels.find(p=>p.id==='plot-yaba')!,g={...fresh(),created:true,position:[p.x,p.z] as Point};g.properties!.push({id:p.id,kind:'land',level:1,furniture:[]});
 useGame.setState({game:g,modal:'property',ride:null});controls.position=[...g.position];useGame.getState().propertyAction(p.id,'house');let built=useGame.getState().game;
 assert.equal(worldFree(built)(...controls.position),true);assert.equal(useGame.getState().modal,null);assert.equal(built.money,g.money-9000);
 const trapped={...built,position:[p.x,p.z] as Point},fixed=recoverSavePosition(trapped);assert.ok(validSave(fixed));assert.ok(worldFree(fixed)(...fixed.position));assert.equal(fixed.money,built.money);
 const distant={...g,position:[0,6] as Point};useGame.setState({game:distant});controls.position=[0,6];useGame.getState().propertyAction(p.id,'church');assert.deepEqual(controls.position,[0,6]);
});
test('room routing respects rotated furniture and larger-room defaults',()=>{
 const home={id:'house-yaba',kind:'house' as const,level:3,furniture:['bed','kitchen','plant'] as const,placements:{bed:{x:0,z:0,rotation:Math.PI/2}}};
 const property={...home,furniture:[...home.furniture]},bounds=roomBounds(property);assert.ok(Math.abs(bounds[0].w-3)<.001);assert.equal(bounds[1].x,-4);assert.equal(bounds[2].x,4);
 const free=roomFree(property);assert.equal(free(0,0),false);assert.equal(free(4.8,0),false);assert.equal(free(0,3),true);
});
test('mission navigation opens the boarding dialog and entering menus cancels queued movement',()=>{
 const terminal=locations.find(l=>l.type==='terminal')!;
 useGame.setState({game:{...fresh(),created:true,position:[terminal.x,terminal.z]},paused:false,modal:null,driving:null,ride:null});controls.position=[terminal.x,terminal.z];
 assert.equal(approachPlace(terminal.id),true);assert.equal(useGame.getState().modal,'transport');
 assert.equal(navigateTo([0,10]),false,'a menu blocks new routes');
 controls.route=[[0,10]];controls.destination=[0,10];controls.arrive=()=>{};controls.keys.add('arrowup');controls.x=1;
 useGame.getState().open('profile');assert.equal(controls.route.length,0);assert.equal(controls.arrive,null);assert.equal(controls.keys.size,0);assert.equal(controls.x,0);
});
