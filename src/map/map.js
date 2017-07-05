//import { Matrix } from 'sylvester';

const NO_TILE = -1;

export class Map {
	constructor(gl, options){
		this.context = gl;
		this.width = options.width;
		this.height = options.height;
		this.tileWidth = options.tileWidth;
		this.tileHeight = options.tileHeight;
		this.grid = undefined;
		this.texture = undefined;
		this.model = [];
		this.object = [];
		this.namedObject = {};
	}

	render(){
		this.texture.bind();
		this.model.forEach(model => model.render());
	}

	getObjects(){
		return this.object;
	}

	getObjectByName(name){
		return this.namedObject[name];
	}

	tileAt(pos){
		const x = pos.x;
		const y = -pos.y;
		if (x < 0 || y < 0){
			return NO_TILE;
		}
		const i = y * this.width + x;
		return this.grid[i] || NO_TILE;
	}

	tileCollidable(i){
		/* Tell if a tile index is collidable or just decorative */
		return 0 < i < 96; // eslint-disable-line yoda
	}

	tileCollisionAt(pos){
		/* Similar to tile_at but only returns True if the tile it collides with is collidable */
		return this.tile_collidable(this.tile_at(pos));
	}
}
