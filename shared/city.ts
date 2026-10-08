export type VehicleKind = 'car' | 'bus' | 'bike' | 'keke';
export const vehicles: Record<VehicleKind, { name: string; fare: number; price: number; speed: number; duration: number; key: string }> = {
  car: { name: 'Car', fare: 1200, price: 18000, speed: 13, duration: 16, key: 'Car key' },
  bus: { name: 'Danfo bus', fare: 400, price: 35000, speed: 9, duration: 24, key: 'Bus key' },
  bike: { name: 'Okada bike', fare: 250, price: 9000, speed: 15, duration: 13, key: 'Bike key' },
  keke: { name: 'Keke tricycle', fare: 350, price: 12000, speed: 10, duration: 20, key: 'Tricycle key' },
};
export const districts = [
  { id: 'yaba', name: 'Yaba', x: 0, z: 0, color: '#b7aa86', description: 'Home, familiar faces, and fresh beginnings.' },
  { id: 'ikorodu', name: 'Ikorodu', x: 0, z: -100, color: '#b98e66', description: 'A busy market, a clinic, and a secret by the river.' },
  { id: 'ikeja', name: 'Ikeja', x: -100, z: 0, color: '#8ca094', description: 'Government offices, police, and an EFCC case.' },
  { id: 'vi', name: 'Victoria Island', x: 100, z: 0, color: '#a7b4b0', description: 'Big contracts, expensive tastes, and the final choice.' },
  { id: 'mainland', name: 'Mainland', x: -100, z: -100, color: '#a19878', description: 'Mechanics, neighbors, and a community that sticks together.' },
  { id: 'lekki', name: 'Lekki', x: 100, z: -100, color: '#c0b294', description: 'A waterfront estate and the security company.' },
] as const;
export type DistrictId = typeof districts[number]['id'];
export const districtAt = (x: number, z: number) => [...districts].sort((a, b) => Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
export type Place = { id: string; name: string; label: string; x: number; z: number; color: string; district: DistrictId; type: string };
const place = (id: string, name: string, type: string, district: DistrictId, x: number, z: number, label = ''): Place => { const d=districts.find(d=>d.id===district)!;return {id,name,type,district,x:d.x+x,z:d.z+z,label,color:d.color}; };
export const locations: Place[] = [
  place('tunde','Tunde','tunde','yaba',3.8,2.2,'Your old friend'),place('shop','Amara’s shop','shop','yaba',-5.7,4.3,'Food & supplies'),place('home','Your apartment','home','yaba',-6,-3,'Safe checkpoint'),place('work','Femi’s workshop','work','yaba',6.3,-4,'Earn ₦3,000'),place('delivery','The meeting point','delivery','yaba',0,-11.5,'Midnight delivery'),
  ...districts.map(d=>place(`terminal-${d.id}`,`${d.name} motor park`,'terminal',d.id,-4,12,'Board a vehicle')),
  place('ikorodu-market','Ikorodu market','shop','ikorodu',-5.8,4,'Trade & supplies'),place('hospital','General Hospital','hospital','ikorodu',6.1,-4,'Treatment & emergency work'),place('amara-contact','Nurse Sade','story','ikorodu',3.8,2.2,'The price of trust'),place('river','Riverfront depot','story','ikorodu',0,-12,'Find the missing ledger'),
  place('police','Police station','police','ikeja',-6,-3,'Report crime · Pay fines'),place('efcc','EFCC field office','efcc','ikeja',6.1,-4,'Evidence & investigations'),place('ikeja-market','Computer village','shop','ikeja',-5.8,4,'Supplies & trade'),place('ikeja-work','Dispatch office','work','ikeja',3.8,2.2,'Earn an honest wage'),
  place('corporate','Island logistics','story','vi',6.1,-4,'The final contract'),place('island-shop','Island provisions','shop','vi',-5.8,4,'Food & equipment'),place('island-hospital','Island clinic','hospital','vi',-6,-3,'Treatment'),
  place('garage','Mainland motors','garage','mainland',6.1,-4,'Buy & drive vehicles'),place('community','Community center','community','mainland',-6,-3,'Teamwork & gift boxes'),place('mainland-work','Repair yard','work','mainland',3.8,2.2,'Earn ₦3,000'),place('mainland-shop','Neighborhood stores','shop','mainland',-5.8,4,'Supplies'),
  place('security','Lekki security','security','lekki',6.1,-4,'Hire bodyguards'),place('lekki-shop','Waterfront market','shop','lekki',-5.8,4,'Equipment & supplies'),place('lekki-home','Guest house','home','lekki',-6,-3,'Rest'),
];
const blocks = [{ x: -9, z: -4, w: 5, d: 6 }, { x: -9, z: 5, w: 5, d: 5 }, { x: 9, z: -4, w: 5, d: 6 }, { x: 9, z: 5, w: 5, d: 5 }, { x: -9, z: -13, w: 5, d: 5 }, { x: 9, z: -13, w: 5, d: 5 }];
export const blockers = districts.flatMap(d=>blocks.map(b=>({...b,x:b.x+d.x,z:b.z+d.z,district:d.id})));
export const canMove = (x:number,z:number) => Number.isFinite(x)&&Number.isFinite(z)&&x > -125&&x < 125&&z > -125&&z < 28&&!blockers.some(b=>Math.abs(x-b.x)<b.w/2+.35&&Math.abs(z-b.z)<b.d/2+.35);
export function trafficAt(time:number) { return Array.from({length:18},(_,i)=>{const lane=i%6,roadX=[-100,0,100][Math.floor(lane/2)],direction=lane%2?1:-1,speed=5+i%4;return {id:i,kind:(['car','bus','bike','keke'] as VehicleKind[])[i%4],x:roadX+(direction>0?-2.3:2.3),z:-123+((time*speed+i*19)%147),angle:direction>0?0:Math.PI,speed,direction};}).map(t=>({...t,z:t.direction>0?t.z:-95-t.z})); }
export const shopItems = [{id:'food',name:'Jollof rice',price:1500},{id:'water',name:'Bottled water',price:300},{id:'medkit',name:'First-aid kit',price:1000},{id:'gun',name:'Pistol',price:4500},{id:'ammo',name:'Ammo pack',price:600},{id:'armor',name:'Protective vest',price:2500},{id:'gift',name:'Mystery gift box',price:800},{id:'guard',name:'Bodyguard contract',price:3000}];
export const giftRewards = ['Cash', 'First-aid kit', 'Ammo pack', 'Mystery gift box', 'Protective vest', 'Pistol', 'Bodyguard contract', 'Life token', 'Bike key'];
export const safeZone = (x:number,z:number) => locations.some(l=>['home','hospital','police','efcc','terminal'].includes(l.type)&&Math.hypot(x-l.x,z-l.z)<5);
