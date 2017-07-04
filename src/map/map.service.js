import { Map } from './map';
import { Texture } from 'texture';

class MapService {
	constructor($templateCache, ModelService){
		this.$templateCache = $templateCache;
		this.ModelService = ModelService;
	}

	fromFile(gl, filename){
		const data = this.$templateCache.get(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load map "${filename}", file not found.`);
		}

		const map = new Map(gl, {
			width: data.width,
			height: data.height,
			tileWidth: data.tilewidth,
			tileHeight: data.tileheight,
		});

		const promise = this.loadTileset(gl, map, data);

		const layers = data.layers || [];
		for (const layer of layers){
			const name = layer.name;
			switch (layer.type){
			case 'tilelayer':
				this.loadTiles(gl, map, layer);
				break;
			case 'objectgroup':
				this.loadObjects(map, layer.objects);
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

	loadTileset(gl, map, data){
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

	loadTiles(gl, map, layer){
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
		const pitch = (n, i) => (n * verticesPerTile + i) * stride;

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

	loadObjects(map, src){
		for (const obj of src){
			map.object.push(obj);

			if (obj.name){
				map.namedObject[obj.name] = obj;
			}
		}
	}
}

MapService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('MapService', MapService);
