import { Vector, Matrix } from 'sylvester';

export class Entity {

	constructor(gl, options){
		options = Object.assign({
			model: null,
		}, options);

		this.context = gl;
		this.model = options.model;
		this.position = Vector.create([-0.0, 0.0, -6.0]);
		this.matMV = Matrix.I(4);
		this.calc();
	}

	calc(){
		this.matMV = Matrix.Translation(this.position).ensure4x4();
	}

	render(shader){
		if (!this.model) return;

		this.model.bind(shader);

		const gl = this.context;
		gl.uniformMatrix4fv(shader.uMV, false, new Float32Array(this.matMV.flatten()));
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

}
