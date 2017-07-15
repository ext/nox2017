import { Waypoint } from './waypoint';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { AABB } from 'math';
import { Vector } from 'sylvester';

const defaults: IEntityProperty = {
};

export class Spawn extends Waypoint {
	aabb: AABB;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
		this.aabb = AABB.fromItem(this);
	}

	getPointInside(){
		const xr = Math.random();
		const yr = Math.random();
		const w = this.aabb.xmax - this.aabb.xmin;
		const h = this.aabb.ymax - this.aabb.ymin;
		return Vector.create([
			this.aabb.xmin + w * xr,
			-(this.aabb.ymin + h * yr),
			0,
		]);
	}
}
