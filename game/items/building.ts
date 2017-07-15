import { Item } from 'item';
import { Creep } from './creep';
import { Entity, IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars

const defaults: IEntityProperty = {
	texture: '/textures/default.jpg',
};

const rangedDefaults: IEntityProperty = {
	range: 3,
	damage: 1,
	cooldown: 1,
};

const moneyDefaults: IEntityProperty = {
	amount: 10,
};

export class Building extends Item {
	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, options);
		super(gl, options);
	}
}

export class RangedBuilding extends Building {
	range: number;
	damage: number;
	timer: number;
	cooldown: number;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, rangedDefaults, options);
		super(gl, options);
		this.range = options.range;
		this.damage = options.damage;
		this.timer = 0;
		this.cooldown = options.cooldown;
	}

	canFire(dt: number, creep: Creep[]): Creep {
		if (this.timer > 0){
			this.timer -= dt;
			return null;
		}
		for (const entity of creep){
			const d = this.position.distanceFrom(entity.position);
			if (d < this.range){
				this.timer = this.cooldown;
				return entity;
			}
		}
		return null;
	}
}

export class BuildingMoney extends Building {
	amount: number;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign({}, defaults, moneyDefaults, options);
		super(gl, options);
		this.amount = options.amount;
	}
}
