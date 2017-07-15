import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
	texture: '/textures/default.jpg',
};

export class Building extends Item {
	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
	}
}
