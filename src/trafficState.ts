import {trafficAt} from '../shared/city';
export const trafficClock={time:0,cars:trafficAt(0),playerAngle:Math.PI};

import {useGame} from './game';
export function activeTraffic(){const stolen=useGame.getState().game.enterprise?.stolen??[];return trafficClock.cars.filter(t=>!stolen.includes('traffic-'+t.id));}
