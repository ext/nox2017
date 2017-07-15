import { Item } from 'item';
import { Waypoint } from './waypoint';
import { Spawn } from './spawn';
import { Building, BuildingMoney } from './building';

export function registerItems(){
	Item.register('Waypoint', Waypoint);
	Item.register('Spawn', Spawn);
	Item.register('Building', Building);
	Item.register('BuildingMoney', BuildingMoney);
}
