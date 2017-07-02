import { Texture } from './texture';
import { Matrix } from 'sylvester';

export class CanvasController {
	constructor($element, $injector){
		const $window = $injector.get('$window');
		this.$timeout = $injector.get('$timeout');
		this.element = $element[0];
		this.$templateCache = $injector.get('$templateCache');
		this.ShaderService = $injector.get('ShaderService');
		this.MapService = $injector.get('MapService');
		this.context = null;

		$window.addEventListener('resize', () => {
			const canvas = this.element;
			canvas.width = 0;
			canvas.height = 0;
			canvas.classList.add('loading');
			this.calculateSize().then(() => {
				this.render();
				canvas.classList.remove('loading');
			});
		});
	}

	init(filename){
		const config = this.$templateCache.get(filename);
		if (!config){
			throw new Error(`Failed to load game configuration "${filename}".`);
		}

		const canvas = this.element;
		const gl = this.context = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');

		/* enable backface culling */
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		/* depth */
		gl.enable(gl.DEPTH_TEST);

		this.context.wgeUniforms = {}; /* uniform blocks */
		this.ShaderService.initialize(this.context);
		this.matP = Matrix.I(4);

		canvas.classList.add('loading');
		return Promise.all([
			this.preload(config.preload || {}),
			this.calculateSize(),
		]).then(() => {
			canvas.classList.remove('loading');
		});
	}

	calculateSize(){
		const canvas = this.element;
		return new Promise(resolve => {
			this.$timeout(() => {
				const parent = angular.element(canvas).parent();
				const width = parent.width();
				const height = parent.height();
				this.resize(width, height);
				resolve();
			});
		});
	}

	preload(preload){
		const textures = (preload.texture||[]);
		return Promise.all(textures.map(cur => {
			return Texture.preload(this.context, cur);
		}));
	}

	loadShader(filename){
		return this.ShaderService.load(this.context, filename);
	}

	loadMap(filename){
		return this.MapService.fromFile(this.context, filename);
	}

	clear(){
		this.context.clearColor(0.0, 0.0, 0.0, 1.0);
		this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
	}

	resize(width, height){
		const canvas = this.element;
		canvas.width = width;
		canvas.height = height;
	}

	render(){

	}
}
