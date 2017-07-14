import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
	model: null,
};

export class Waypoint extends Item {
	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign(defaults, options);
		super(gl, options);
	}
}

export function registerItems(){
	Item.register('Waypoint', Waypoint);
}
