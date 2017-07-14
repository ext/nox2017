import { Item } from 'item';
import { Waypoint } from './waypoint';
import { Spawn } from './spawn';

export function registerItems(){
	Item.register('Waypoint', Waypoint);
	Item.register('Spawn', Spawn);
}
