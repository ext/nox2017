import { Waypoint } from './waypoint';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
};

export class Spawn extends Waypoint {
	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign(defaults, options);
		super(gl, options);
	}
}
