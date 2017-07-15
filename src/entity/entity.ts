import { Behaviour } from 'behaviour';
import { Model } from 'model';
import { Vector, Matrix } from 'sylvester';

export type IEntityProperty = { [key:string]: any };

const defaults: IEntityProperty = {
	model: null,
	position: [0, 0, 0],
	speed: 1,
	hp: 100,
};

let id: number = 1;

export class Entity {
	id: number;
	model: Model;
	position: Vector;
	rotation: Vector;
	modelMatrix: Matrix;
	speed: number;
	hp: number;
	dead: boolean;
	behaviour: Behaviour;
	behaviourData: any;

	constructor(options: IEntityProperty){
		options = Object.assign(defaults, options);

		this.id = id++;
		this.model = options.model;
		this.position = Vector.create(options.position);
		this.rotation = null;
		this.modelMatrix = Matrix.I(4);
		this.speed = options.speed;
		this.hp = options.hp;
		this.dead = false;
		this.updateModelMatrix();
	}

	attachBehaviour(behaviour: Behaviour): void {
		this.behaviour = behaviour;
		this.behaviourData = behaviour.createData(this);
	}

	updateModelMatrix(){
		if (!this.model) return;
		const t = Matrix.Translation(this.position).ensure4x4();
		if (this.rotation){
			const r = rotationFromDirection(this.rotation).ensure4x4();
			this.modelMatrix = t.x(r);
		} else {
			this.modelMatrix = t;
		}
	}

	render(gl: WebGL2RenderingContext){
		if (!this.model) return;
		this.model.render(gl);
	}

	update(dt: number){
		if (this.behaviour){
			this.behaviour.update(this, this.behaviourData, dt);
		}

		this.updateModelMatrix();
	}

	kill(){
		this.dead = true;
	}
}

export function rotationFromDirection(dir: Vector){
	const up = Vector.create([0, 0, 1]);
	const inv = dir.x(-1);
	const xaxis = inv.cross(up).toUnitVector();
	const yaxis = xaxis.cross(inv).toUnitVector();

	return Matrix.create([
		[xaxis.elements[0], -dir.elements[0], yaxis.elements[0]],
		[xaxis.elements[1], -dir.elements[1], yaxis.elements[1]],
		[xaxis.elements[2], -dir.elements[2], yaxis.elements[2]],
	]);
}
