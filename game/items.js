import { Item } from 'item';

export class Food extends Item {
	constructor(gl, options, properties){
		options = Object.assign({
			hp: 35,
			texture: 'textures/apple.png',
		}, options);
		super(gl, options, properties);
	}
}

export class Kebab extends Item {
	constructor(gl, options, properties){
		options = Object.assign({
			hp: 50,
			texture: 'textures/kebab.png',
		}, options);
		super(gl, options, properties);
	}
}

export class QuestItem extends Item {
	constructor(gl, options, properties){
		options = Object.assign({
			hp: 50,
		}, options);
		super(gl, options, properties);
	}
}

export function registerItems(){
	Item.register('food', Food);
	Item.register('kebab', Kebab);
	Item.register('key', QuestItem);
}
