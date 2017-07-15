import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
	route: 0,
};

export class Area extends Item {
	route: number;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign(defaults, options);
		super(gl, options);

		this.route = options.route;
	}
}
