import { Item } from 'item';
import { Waypoint } from './waypoint';
import { Spawn } from './spawn';
import { Building } from './building';

export function registerItems(){
	Item.register('Waypoint', Waypoint);
	Item.register('Spawn', Spawn);
	Item.register('Building', Building);
}
