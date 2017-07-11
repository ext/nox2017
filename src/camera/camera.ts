import { lookAt } from './math';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector, Matrix } from 'sylvester';

export class Camera {
	position: Vector;
	target: Vector;
	up: Vector;
	projectionMatrix: Matrix;
	viewMatrix: Matrix;
	onUpdate?: (camera: Camera) => void;

	constructor(options: any){
		options = Object.assign({
			position: Vector.create([0, 0, 25]),
			target: Vector.create([0, 0, 0]),
			up: Vector.create([0, 1, 0]),
			projection: null,
			onUpdate: null,
		}, options);

		this.position = options.position;
		this.target = options.target;
		this.up = options.up,
		this.projectionMatrix = options.projection || Matrix.I(4);
		this.viewMatrix = Matrix.I(4);
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
		this.viewMatrix = lookAt(this.position, this.target, this.up);
	}

	update(){
		if (this.onUpdate){
			this.onUpdate(this);
			this.calc();
		}
	}

	setProjectionMatrix(m: Matrix): void {
		this.projectionMatrix = m;
	}

	setPosition(v: Vector): void {
		this.position = v;
	}

	setTarget(v: Vector): void{
		this.target = v;
	}

	getProjectionMatrix(): Matrix {
		return this.projectionMatrix;
	}

	getViewMatrix(): Matrix {
		return this.viewMatrix;
	}
}
