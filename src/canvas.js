import { Texture } from './texture';
import { Matrix } from 'sylvester';

export class CanvasController {
	constructor($element, $injector){
		const $timeout = $injector.get('$timeout');
		const $window = $injector.get('$window');
		this.element = $element[0];
		this.$templateCache = $injector.get('$templateCache');
		this.ShaderService = $injector.get('ShaderService');
		this.context = null;

		$window.addEventListener('resize', () => {
			const canvas = this.element;
			canvas.width = 0;
			canvas.height = 0;
			canvas.classList.add('loading');
			$timeout(() => {
				this.resize(canvas.clientWidth, canvas.clientHeight);
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
		this.resize(canvas.clientWidth, canvas.clientHeight);

		return this.preload(config.preload || {});
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
