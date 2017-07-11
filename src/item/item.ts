import { Entity } from 'entity';
import { Model } from 'model';
import { Shader } from 'shader';
import { Texture } from 'texture';

interface ItemFactory {
	new (gl: WebGL2RenderingContext, options?: any, properties?: any): Item;
}

const types: { [key:string]: ItemFactory } = {};

export class Item extends Entity {
	name?: string;
	hp: number;
	diffuse?: Texture;

	constructor(gl: WebGL2RenderingContext, options?: any, properties?: any){
		options = Object.assign({
			model: Model.Quad(gl),
			hp: 100,
		}, options || {}, properties);

		super(options);
		this.name = options.name;
		this.hp = options.hp;
		this.diffuse = null;

		Texture.load(gl, options.texture).then((texture: Texture) => {
			this.diffuse = texture;
		}, (fallback: Texture) => {
			this.diffuse = fallback;
		});
	}

	static register(name: string, cls: any){
		types[name] = cls;
	}

	static factory(name: string, gl: WebGL2RenderingContext, options?: any, properties?: any){
		if (name in types){
			return new types[name](gl, options, properties);
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
