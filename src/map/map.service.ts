import { Map } from './map';
import { ModelService } from 'model';
import { Texture } from 'texture';
import { IEntityProperty } from 'entity'; // eslint-disable-line no-unused-vars
import { Item } from 'item';
import { Vector } from 'sylvester';
import { IMapData, IMapLayer, IMapObject, IMapProperties } from './map-data'; // eslint-disable-line no-unused-vars

class MapService {
	$templateCache: ng.ITemplateCacheService;
	ModelService: ModelService;
	static $$ngIsClass: boolean;

	constructor($templateCache: ng.ITemplateCacheService, ModelService: ModelService){
		this.$templateCache = $templateCache;
		this.ModelService = ModelService;
	}

	fromFile(gl: WebGL2RenderingContext, filename: string){
		const data = this.$templateCache.get<IMapData>(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load map "${filename}", file not found.`);
		}

		const map = new Map(gl, data);

		const promise = this.loadTileset(gl, map, data);

		const layers = data.layers || [];
		for (const layer of layers){
			const name = layer.name;
			switch (layer.type){
			case 'tilelayer':
				this.loadTiles(gl, map, layer);
				break;
			case 'objectgroup':
				this.loadObjects(gl, map, layer.objects, layer.properties);
				break;
			default:
				// eslint-disable-next-line
				console.warn(`Unsupported layer type "${layer.type}", the layer named "${name}" ignored.`);
			}
		}

		return promise.then(() => {
			return map;
		});
	}

	loadTileset(gl: WebGL2RenderingContext, map: Map, data: IMapData){
		const tileset = data.tilesets || [];
		const texture = [];
		for (const it of tileset){
			texture.push(Texture.load(gl, it.image, gl.NEAREST));
		}
		// TODO support multiple tilesets
		if (texture.length > 1){
			// eslint-disable-next-line
			console.warn('Currently only one tileset is supported, first one will be used');
		}
		return Promise.all(texture).then((texture) => {
			map.texture = texture[0];
		});
	}

	loadTiles(gl: WebGL2RenderingContext, map: Map, layer: IMapLayer){
		/* hardcoded */
		const dx = map.tileWidth	/ 128.0;
		const dy = map.tileHeight / 128.0;
		const tileDiv = 128 / map.tileWidth;

		/* only count tiles where something is drawn */
		const numTiles = layer.data.reduce((n, tile) => {
			return n + (tile >= 1 ? 1 : 0);
		}, 0);

		const stride = 9;
		const verticesPerTile = 4;
		const indicesPerTile = 6;
		const numFloats = numTiles * verticesPerTile * stride;
		const vertices = new Float32Array(numFloats);
		const indices = new Uint32Array(numTiles * indicesPerTile);
		const pitch = (n: number, i: number) => (n * verticesPerTile + i) * stride;

		for (let i = 0, n = 0; i < layer.data.length; i++){
			const tile = layer.data[i] - 1; // format uses tile 1-indexed, but want 0-indexed
			if (tile < 0) continue;

			const x = i % map.width;
			const y = -Math.floor(i / map.width);
			const tx = tile % tileDiv;
			const ty = Math.floor(tile / tileDiv);

			vertices.set([x+1, y+1, 0, tx*dx+dx, ty*dy, 1, 1, 1, 1], pitch(n, 0));
			vertices.set([x,   y+1, 0, tx*dx,    ty*dy, 1, 1, 1, 1], pitch(n, 1));
			vertices.set([x+1, y,   0, tx*dx+dx, ty*dy+dy, 1, 1, 1, 1], pitch(n, 2));
			vertices.set([x,   y,   0, tx*dx,    ty*dy+dy, 1, 1, 1, 1], pitch(n, 3));

			indices.set([0, 1, 2, 1, 3, 2].map(x => n*4 + x), n * indicesPerTile);
			n++;
		}

		map.model.push(this.ModelService.fromData(gl, vertices, indices));

		/* for now only first layer is used for tilemap checks */
		if (angular.isUndefined(map.grid)){
			map.grid = layer.data;
		}
	}

	loadObjects(gl: WebGL2RenderingContext, map: Map, src: IMapObject[], layerProperties: IMapProperties = {}){
		const defaultType = layerProperties.type || null;
		delete layerProperties.type;

		for (const obj of src){
			/* remap position from absolute pixel {.x, .y} to tile position vector [x, y, 0] */
			const scale = (1.0 / 8.0); // TODO Hardcoded value
			const properties: IEntityProperty = Object.assign(obj, layerProperties, obj.properties, {
				position: Vector.create([obj.x * scale, -obj.y * scale, 0]),
			});

			const type = obj.type || defaultType;
			map.spawn(type, gl, properties);
		}
	}
}

MapService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('MapService', MapService);
