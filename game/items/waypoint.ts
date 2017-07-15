import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { AABB } from 'math';

const defaults: IEntityProperty = {
	model: null,
	next: null,
	route: 0,
	aabb: null,
};

export class Waypoint extends Item {
	route: number;
	next: string;
	aabb: AABB;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign(defaults, options);
		super(gl, options);

		this.route = options.route;
		this.next = options.next;
		this.aabb = AABB.fromItem(this);
	}
}
