import { Shader } from './shader';

class ShaderService {
	constructor($templateCache){
		this.$templateCache = $templateCache;
	}

	load(gl, filename){
		const data = this.$templateCache.get(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load shader "${filename}", file not found.`);
		}
		return new Shader(gl, data);
	}

	initialize(gl){
		Shader.initialize(gl);
	}

	uploadProjectionView(gl, proj, view){
		Shader.uploadProjectionView(gl, proj, view);
	}

	uploadModel(gl, model){
		Shader.uploadModel(gl, model);
	}
}

ShaderService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ShaderService', ShaderService);
