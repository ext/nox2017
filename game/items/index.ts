import { Item } from 'item';
import { Waypoint } from './waypoint';
import { Spawn } from './spawn';
import { Area } from './area';
import { Creep } from './creep';
import { Building, RangedBuilding, BuildingMoney } from './building';

export function registerItems(){
	Item.register('Waypoint', Waypoint);
	Item.register('Spawn', Spawn);
	Item.register('Area', Area);
	Item.register('Creep', Creep);
	Item.register('Building', Building);
	Item.register('RangedBuilding', RangedBuilding);
	Item.register('BuildingMoney', BuildingMoney);
}
