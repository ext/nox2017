import { Item } from 'item';
import { rotationFromDirection, IEntityProperty } from 'entity/entity'; // eslint-disable-line no-unused-vars
import { Texture } from 'texture';
import { Vector, Matrix } from 'sylvester';

const defaults: IEntityProperty = {
	value: 1,
	texture: '/textures/beaver.png',
};

export class Creep extends Item {
	value: number;
	stolen: boolean;
	escaped: boolean;
	otherDiffuse: Texture;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
		this.value = options.value;
		this.stolen = false;
		this.escaped = false;
		this.otherDiffuse = null;

		Texture.load(gl, '/textures/beaver-theft.png').then((texture: Texture) => {
			this.otherDiffuse = texture;
		}).catch((fallback: Texture) => {
			this.otherDiffuse = fallback;
		});
	}

	updateModelMatrix(){
		if (!this.model) return;
		const p = this.position.add(Vector.create([0.5, 0.5, 0]));
		const t = Matrix.Translation(p).ensure4x4();
		if (this.rotation){
			const r = rotationFromDirection(this.rotation).ensure4x4();
			this.modelMatrix = t.x(r);
		} else {
			this.modelMatrix = t;
		}
	}

	steal(){
		this.stolen = true;
		this.diffuse = this.otherDiffuse;
	}

	update(dt: number){
		if (!this.stolen && this.position.elements[1] > -5){
			this.steal();
		}

		if (this.stolen && this.position.elements[1] < -45){
			this.escaped = true;
			this.dead = true;
		}

		super.update(dt);
	}
}
