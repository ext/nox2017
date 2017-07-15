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
		const p = this.position.add(Vector.create([0.5, 0.5, 0.5]));
		const t = Matrix.Translation(p).ensure4x4();
		if (this.rotation){
			const c = Math.cos(Math.PI / 2)
			const s = Math.sin(Math.PI / 2)
			const r1 = Matrix.create([
				[ c,  0,  s,  0],
				[ 0,  1,  0,  0],
				[-s,  0,  c,  0],
				[ 0,  0,  0,  1],
			]);
			const r2 = rotationFromDirection(this.rotation).ensure4x4();
			this.modelMatrix = t.x(r2.x(r1));
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
