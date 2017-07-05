import { Model } from './model';

class ModelService {
	constructor($templateCache){
		this.$templateCache = $templateCache;
	}

	fromFile(gl, filename){
		const data = this.$templateCache.get(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load model "${filename}", file not found.`);
		}
		const model = new Model(gl);
		model.upload(
			new Float32Array(flatten(data.vertices)),
			new Uint32Array(flatten(data.indices))
		);
		return model;
	}

	fromData(gl, vertices, indices){
		const model = new Model(gl);
		model.upload(vertices, indices);
		return model;
	}

	quad(gl){
		return Model.Quad(gl);
	}
}

ModelService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ModelService', ModelService);

function flatten(src){
	return src.reduce((a, b) => a.concat(b), []);
}
