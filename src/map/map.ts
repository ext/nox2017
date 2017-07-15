import { Entity, IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { Item } from 'item';
import { Shader } from 'shader';
import { Texture } from 'texture';
import { Model } from 'model';
import { Matrix } from 'sylvester';
import { IMapData } from './map-data'; // eslint-disable-line no-unused-vars

const NO_TILE = -1;

export class Map {
	context: WebGL2RenderingContext;
	width: number;                           // number of tiles
	height: number;                          // number of tiles
	tileWidth: number;                       // width of a single tile in pixels
	tileHeight: number;                      // height of a single tile in pixels
	grid: any;                               // tile data as 1D (as regular JS array)
	texture: Texture;
	model: Model[];
	object: Entity[];
	namedObject: { [key:string]: Entity };

	constructor(gl: WebGL2RenderingContext, options: IMapData){
		this.context = gl;
		this.width = options.width;
		this.height = options.height;
		this.tileWidth = options.tilewidth;
		this.tileHeight = options.tileheight;
		this.grid = undefined;
		this.texture = undefined;
		this.model = [];
		this.object = [];
		this.namedObject = {};
	}

	update(dt: number){
		this.object.forEach(obj => obj.update(dt));
	}

	render(gl: WebGL2RenderingContext){
		if (gl === null) throw new Error('Map.render() called without GL context');

		/* render map itself */
		this.texture.bind(gl);
		Shader.uploadModel(gl, Matrix.I(4));
		this.model.forEach(model => model.render(gl));

		/* render objects in world */
		this.object.forEach(obj => obj.render(gl));
	}

	spawn(type: string, gl: WebGL2RenderingContext, properties: IEntityProperty): Entity {
		const item = Item.factory(type, gl, properties);
		this.object.push(item);

		if (properties.name){
			this.namedObject[properties.name] = item;
		}

		return item;
	}

	getObjects(): Entity[] {
		return this.object;
	}

	getObjectByName(name: string): Entity {
		return this.namedObject[name];
	}

	isInsideMap(x: number, y: number): boolean {
		if (x < 0 || x >= this.width){
			return false;
		}
		if (y < 0 || y >= this.height){
			return false;
		}
		return true;
	}

	tileAt(pos: [number, number]){
		const x = pos[0];
		const y = -pos[1];
		if (x < 0 || y < 0){
			return NO_TILE;
		}
		const i = y * this.width + x;
		return this.grid[i] || NO_TILE;
	}

	/**
	 * Tell if a tile index is collidable or just decorative.
	 */
	tileCollidable(i: number){
		// TODO hardcoded tilemap size
		const tx = i % 16;
		const ty = Math.floor(i / 16);
		const passable = tx > 7 && tx < 13 && ty < 5;
		return !passable;
	}

	tileCollisionAt(pos: [number, number]){
		/* Similar to tile_at but only returns True if the tile it collides with is collidable */
		return this.tileCollidable(this.tileAt(pos));
	}

	// fluff space is the cozy space where things are not negative.
	// but still pretty fucked up.
	worldToTileSpace(pos: [number, number]) {
		const x = Math.floor(pos[0]);
		const y = Math.floor(pos[1]) + 1;
		return [x, y];
	}

	fluffSpaceToIndex(pos: [number, number]) {
		const ts = this.worldToTileSpace(pos);
		return ts[1] * this.width + ts[0];
	}
}
