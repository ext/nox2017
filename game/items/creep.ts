import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
	value: 1,
};

export class Creep extends Item {
	value: number;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
		this.value = options.value;
	}
}
