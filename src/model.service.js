import { Model } from './model';

class ModelService {
	constructor($templateCache){
		this.$templateCache = $templateCache;
	}

	load(gl, filename){
		const data = this.$templateCache.get(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load model "${filename}", file not found.`);
		}
		const model = new Model(gl);
		const vertices = flatten(data.vertices);
		const indices = flatten(data.indices);
		model.upload(vertices, indices);
		return model;
	}
}

function flatten(src){
	return src.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}

ModelService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ModelService', ModelService);
