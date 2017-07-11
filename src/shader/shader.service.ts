import { Shader } from './shader';

interface IShaderPass {
	vertex: string;
	fragment: string;
}

interface IShaderData {
	name: string;
	pass: IShaderPass[];
}

class ShaderService {
	$templateCache: ng.ITemplateCacheService;
	static $$ngIsClass: boolean;

	constructor($templateCache: ng.ITemplateCacheService){
		this.$templateCache = $templateCache;
	}

	load(gl: WebGL2RenderingContext, filename: string){
		const data = this.$templateCache.get<IShaderData>(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load shader "${filename}", file not found.`);
		}
		return new Shader(gl, data);
	}

	initialize(gl: WebGL2RenderingContext){
		Shader.initialize(gl);
	}

	uploadProjectionView(gl: WebGL2RenderingContext, proj: Float32Array, view: Float32Array){
		Shader.uploadProjectionView(gl, proj, view);
	}

	uploadModel(gl: WebGL2RenderingContext, model: Float32Array){
		Shader.uploadModel(gl, model);
	}
}

ShaderService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ShaderService', ShaderService);
