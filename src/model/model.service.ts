import { Model } from './model';

type deepArray = number[][];

interface IModelData {
	vertices: deepArray;
	indices: deepArray;
}

export class ModelService {
	$templateCache: ng.ITemplateCacheService;
	static $$ngIsClass: boolean;

	constructor($templateCache: ng.ITemplateCacheService){
		this.$templateCache = $templateCache;
	}

	fromFile(gl: WebGL2RenderingContext, filename: string){
		const data = this.$templateCache.get<IModelData>(filename);
		if (angular.isUndefined(data)){
			throw new Error(`Failed to load model "${filename}", file not found.`);
		}
		const model = new Model(gl);
		model.upload(gl,
			new Float32Array(flatten(data.vertices)),
			new Uint32Array(flatten(data.indices))
		);
		return model;
	}

	fromData(gl: WebGL2RenderingContext, vertices: Float32Array, indices: Uint32Array){
		const model = new Model(gl);
		model.upload(gl, vertices, indices);
		return model;
	}

	quad(gl: WebGL2RenderingContext){
		return Model.Quad(gl);
	}
}

ModelService.$$ngIsClass = true;

angular
	.module('wge')
	.factory('ModelService', ModelService);

function flatten(src: deepArray){
	return src.reduce((a: number[], b: number[]) => a.concat(b), []);
}
