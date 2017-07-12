import { Shader } from './shader';
import { IShaderData } from './shader-data'; // eslint-disable-line no-unused-vars

const cache: { [key:string]: Shader } = {};

class ShaderService {
	$templateCache: ng.ITemplateCacheService;
	static $$ngIsClass: boolean;

	constructor($templateCache: ng.ITemplateCacheService){
		this.$templateCache = $templateCache;
	}

	load(gl: WebGL2RenderingContext, filename: string): Shader {
		const cacheKey = filename;

		if (!(cacheKey in cache)){
			this.preload(gl, filename);
		}

		return cache[cacheKey];
	}

	preload(gl: WebGL2RenderingContext, filename: string): void {
		const data = this.$templateCache.get<IShaderData>(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load shader "${filename}", file not found.`);
		}

		const cacheKey = filename;
		const shader = new Shader(gl, data);
		cache[cacheKey] = shader;
	}

	initialize(gl: WebGL2RenderingContext): void {
		Shader.initialize(gl);
	}

	uploadProjectionView(gl: WebGL2RenderingContext, proj: Float32Array, view: Float32Array): void {
		Shader.uploadProjectionView(gl, proj, view);
	}

	uploadModel(gl: WebGL2RenderingContext, model: Float32Array): void {
		Shader.uploadModel(gl, model);
	}
}

ShaderService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ShaderService', ShaderService);
