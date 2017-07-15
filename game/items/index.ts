import { Item } from 'item';
import { Waypoint } from './waypoint';
import { Spawn } from './spawn';
import { Area } from './area';
import { Building } from './building';

export function registerItems(){
	Item.register('Waypoint', Waypoint);
	Item.register('Spawn', Spawn);
	Item.register('Area', Area);
	Item.register('Building', Building);
}
