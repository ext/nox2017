import { Item } from 'item';

export class Waypoint extends Item {
	constructor(gl, options, properties){
		options = Object.assign({
			model: null,
		}, options);
		super(gl, options, properties);
	}
}

export function registerItems(){
	Item.register('Waypoint', Waypoint);
}
