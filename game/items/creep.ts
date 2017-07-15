import { Item } from 'item';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { Texture } from 'texture';

const defaults: IEntityProperty = {
	value: 1,
};

export class Creep extends Item {
	value: number;
	stolen: boolean;
	otherDiffuse: Texture;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
		this.value = options.value;
		this.stolen = false;
		this.otherDiffuse = null;

		Texture.load(gl, '/textures/beaver-theft.png').then((texture: Texture) => {
			this.otherDiffuse = texture;
		}).catch((fallback: Texture) => {
			this.otherDiffuse = fallback;
		});
	}

	steal(){
		this.stolen = true;
		this.diffuse = this.otherDiffuse;
	}

	update(dt: number){
		if (!this.stolen && this.position.elements[1] > -4){
			this.steal();
		}

		super.update(dt);
	}
}
