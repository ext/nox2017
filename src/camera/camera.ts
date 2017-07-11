import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector, Matrix } from 'sylvester';

export class Camera {
	position: Vector;
	target: Vector;
	up: Vector;
	matrix: Matrix;
	onUpdate?: (camera: Camera) => void;

	constructor(options: any){
		options = Object.assign({
			position: Vector.create([0, 0, 25]),
			target: Vector.create([0, 0, 0]),
			up: Vector.create([0, 1, 0]),
			onUpdate: null,
		}, options);

		this.position = options.position;
		this.target = options.target;
		this.up = options.up,
		this.matrix = Matrix.I(4);
		this.onUpdate = options.onUpdate;
		this.calc();
	}

	static follow(entity: Entity, options: any){
		const offset = Vector.create(options.offset || [0, 0, 25]);
		return (camera: Camera) => {
			camera.setPosition(entity.position.add(offset));
			camera.setTarget(Vector.create(entity.position.elements));
		};
	}

	calc(){
		this.matrix = lookAt(this.position, this.target, this.up);
	}

	update(){
		if (this.onUpdate){
			this.onUpdate(this);
			this.calc();
		}
	}

	setPosition(v: Vector): void {
		this.position = v;
	}

	setTarget(v: Vector): void{
		this.target = v;
	}

	getViewMatrix(){
		return this.matrix;
	}
}

function lookAt(eye: Vector, center: Vector, up: Vector){
	const z = eye.subtract(center).toUnitVector();
	const x = up.cross(z).toUnitVector();
	const y = z.cross(x).toUnitVector();

	const m = Matrix.create([
		[x.e(1), x.e(2), x.e(3), 0],
		[y.e(1), y.e(2), y.e(3), 0],
		[z.e(1), z.e(2), z.e(3), 0],
		[0, 0, 0, 1],
	]);

	const t = Matrix.create([
		[1, 0, 0, -eye.e(1)],
		[0, 1, 0, -eye.e(2)],
		[0, 0, 1, -eye.e(3)],
		[0, 0, 0, 1],
	]);

	return m.x(t);
}
