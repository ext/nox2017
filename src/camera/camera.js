import { Vector, Matrix } from 'sylvester';

export class Camera {
	constructor(options){
		options = Object.assign({
			position: Vector.create([0, 0, -25]),
			target: Vector.create([0, 0, 0]),
		}, options);

		this.position = options.position;
		this.target = options.target;
		this.matrix = Matrix.I(4);
		this.calc();
	}

	calc(){
		this.matrix = Matrix.Translation(this.position).ensure4x4();
	}

	setPosition(v){
		this.position = v;
		this.calc();
	}

	getViewMatrix(){
		return this.matrix;
	}
}
