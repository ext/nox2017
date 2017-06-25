import { Vector, Matrix } from 'sylvester';

export class Entity {

	constructor(gl, options){
		options = Object.assign({
			model: null,
		}, options);

		this.context = gl;
		this.model = options.model;
		this.position = Vector.create([-0.0, 0.0, -6.0]);
		this.modelMatrix = Matrix.I(4);
		this.calc();
	}

	calc(){
		this.modelMatrix = Matrix.Translation(this.position).ensure4x4();
	}

	render(shader){
		if (!this.model) return;

		const gl = this.context;
		this.model.bind(shader);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

}
