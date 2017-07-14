import { Entity, IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { Model } from 'model';
import { Shader } from 'shader';
import { Texture } from 'texture';

interface ItemFactory {
	new (gl: WebGL2RenderingContext, options?: any): Item;
}

const types: { [key:string]: ItemFactory } = {};

const defaults: IEntityProperty = {
	hp: 100,
};

export class Item extends Entity {
	name?: string;
	hp: number;
	diffuse?: Texture;
	width: number;
	height: number;

	constructor(gl: WebGL2RenderingContext, options?: IEntityProperty){
		options = Object.assign(defaults, {
			model: Model.Quad(gl),
		}, options);

		super(options);
		this.name = options.name;
		this.hp = options.hp;
		this.diffuse = null;
		this.width = options.width;
		this.height = options.height;

		if (options.texture){
			Texture.load(gl, options.texture).then((texture: Texture) => {
				this.diffuse = texture;
			}, (fallback: Texture) => {
				this.diffuse = fallback;
			});
		}
	}

	static register(name: string, cls: ItemFactory){
		types[name] = cls;
	}

	static factory(name: string, gl: WebGL2RenderingContext, options?: IEntityProperty){
		if (name in types){
			return new types[name](gl, options);
		} else {
			if (name !== null){
				// eslint-disable-next-line
				console.warn(`Failed to instantiate object of type "${name}", generic placeholder used instead.`);
			}
			return new Item(gl, options);
		}
	}

	render(gl: WebGL2RenderingContext){
		if (this.diffuse){
			this.diffuse.bind(gl);
		}

		if (this.model){
			Shader.uploadModel(gl, this.modelMatrix);
			this.model.render(gl);
		}
	}
}
