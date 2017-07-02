import { Vector, Matrix } from 'sylvester';

export class Entity {

	constructor(gl, options){
		options = Object.assign({
			model: null,
		}, options);

		this.context = gl;
		this.model = options.model;
		this.position = Vector.create([0.0, 0.0, 0.0]);
		this.rotation = Vector.create([0.0, 0.0, 0.0, 1.0]);
		this.modelMatrix = Matrix.I(4);
		this.calc();
	}

	calc(){
		const t = Matrix.Translation(this.position).ensure4x4();
		const r = Matrix.RotationFromQuat(this.rotation).ensure4x4();
		this.modelMatrix = t.x(r);
	}

	render(shader){
		if (!this.model) return;
		this.model.render(shader);
	}

}
