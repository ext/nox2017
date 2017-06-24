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
}

ShaderService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ShaderService', ShaderService);
