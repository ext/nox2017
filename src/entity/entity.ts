import { Model } from 'model';
import { Vector, Matrix } from 'sylvester';

export class Entity {
	model: Model;
	position: Vector;
	rotation: Vector;
	modelMatrix: Matrix;

	constructor(options: any){
		options = Object.assign({
			model: null,
			position: [0, 0, 0],
		}, options);

		this.model = options.model;
		this.position = Vector.create(options.position);
		this.rotation = Vector.create([0.0, 0.0, 0.0, 1.0]);
		this.modelMatrix = Matrix.I(4);
		this.calc();
	}

	calc(){
		const t = Matrix.Translation(this.position).ensure4x4();
		const r = Matrix.RotationFromQuat(this.rotation).ensure4x4();
		this.modelMatrix = t.x(r);
	}

	render(gl: WebGL2RenderingContext){
		if (!this.model) return;
		this.model.render(gl);
	}
}
