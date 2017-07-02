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
		model.upload(data.vertices, data.indices);
		return model;
	}

	fromData(gl, vertices, indices){
		const model = new Model(gl);
		model.upload(vertices, indices);
		return model;
	}
}

ModelService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ModelService', ModelService);
