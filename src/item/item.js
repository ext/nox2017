import { Entity } from 'entity';
import { Model } from 'model';

const types = {};
let id = 1;

export class Item extends Entity {
	constructor(gl, options, properties){
		options = Object.assign({
			model: Model.Quad(gl),
			hp: 100,
		}, options);
		properties = properties || {};

		super(options);
		this.id = id++;
		this.name = options.name;
		this.hp = properties.hp || options.hp;
	}

	static register(name, cls){
		types[name] = cls;
	}

	static factory(name, ...args){
		if (name in types){
			return new types[name](...args);
		} else {
			if (name !== null){
				// eslint-disable-next-line
				console.warn(`Failed to instantiate object of type "${name}", generic placeholder used instead.`);
			}
			return new Item(...args);
		}
	}
}
