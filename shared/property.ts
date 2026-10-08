import { districts, type DistrictId } from './city';

export const buildTypes = { house: { name: 'House', price: 9000 }, club: { name: 'Club', price: 16000 }, church: { name: 'Church', price: 12000 }, shop: { name: 'Shop', price: 7000 } };
export type BuildKind = keyof typeof buildTypes;
export const furnishings = { sofa: { name: 'Sofa', price: 900 }, bed: { name: 'Bed', price: 1200 }, tv: { name: 'Television', price: 1800 }, kitchen: { name: 'Kitchen', price: 1500 }, table: { name: 'Dining table', price: 700 }, plant: { name: 'Indoor plant', price: 250 } };
export type Furniture = keyof typeof furnishings;
export type Placement={x:number;z:number;rotation:number};
export type RoomWall={x:number;z:number;length:number;axis:string};
export type Property = { id: string; kind: BuildKind | 'land'; furniture: Furniture[]; level: number; placements?: Partial<Record<Furniture,Placement>>; walls?:RoomWall[] };
export const parcels = districts.flatMap((d, i) => [
  { id: `house-${d.id}`, district: d.id, name: `${d.name} ${['apartment','courtyard home','townhouse','penthouse','family house','villa'][i]}`, x: d.x-20, z: d.z-19, price: [0,16000,28000,65000,18000,55000][i], built: true },
  { id: `plot-${d.id}`, district: d.id, name: `${d.name} development plot`, x: d.x+20, z: d.z-19, price: [6000,5000,9000,18000,4500,15000][i], built: false },
]);
// The original apartment entrance stays in place for existing saves.
parcels[0] = { ...parcels[0], x: -9, z: -4, price:12000 };
export const starterProperty = (): Property => ({ id: 'house-yaba', kind: 'house', furniture: ['bed','sofa','tv','kitchen'], level: 1 });
export const entrance = (p: typeof parcels[number]): [number,number] => p.id==='house-yaba'?[-6,-3]:[p.x,p.z+4.5];
export const propertyDistrict = (id: string): DistrictId => parcels.find(p=>p.id===id)?.district??'yaba';
export function validProperties(value: unknown): value is Property[] {
  return Array.isArray(value) && value.length<=parcels.length && new Set(value.map(p=>p?.id)).size===value.length && value.every(p=>p && parcels.some(a=>a.id===p.id) && (p.kind==='land'||Object.hasOwn(buildTypes,p.kind)) && Number.isInteger(p.level)&&p.level>=1&&p.level<=3 && Array.isArray(p.furniture)&&p.furniture.every((f:unknown)=>typeof f==='string'&&Object.hasOwn(furnishings,f))&&new Set(p.furniture).size===p.furniture.length && (p.placements===undefined||p.placements&&typeof p.placements==='object'&&!Array.isArray(p.placements)&&Object.entries(p.placements).every(([key,raw])=>{const t=raw as Placement;return p.furniture.includes(key)&&t&&[t.x,t.z,t.rotation].every(Number.isFinite)&&Math.abs(t.x)<=3&&Math.abs(t.z)<=3;}))&&(p.walls===undefined||Array.isArray(p.walls)&&p.walls.length<=12&&p.walls.every((w:RoomWall)=>w&&[w.x,w.z,w.length].every(Number.isFinite)&&Math.abs(w.x)<=3&&Math.abs(w.z)<=3&&w.length>0&&w.length<=6&&['x','z'].includes(w.axis))));
}
