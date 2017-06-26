import { Texture } from './texture';
import { Matrix } from 'sylvester';

export class CanvasController {
	constructor($window, $element, $templateCache, ShaderService){
		this.$window = $window;
		this.$element = $element;
		this.$templateCache = $templateCache;
		this.ShaderService = ShaderService;
		this.context = null;

		$window.addEventListener('resize', () => {
			const canvas = this.$element[0];
			this.resize(canvas.clientWidth, canvas.clientHeight);
			this.render();
		});
	}

	init(filename){
		const config = this.$templateCache.get(filename);
		if (!config){
			throw new Error(`Failed to load game configuration "${filename}".`);
		}

		const canvas = this.$element[0];
		this.context = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
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
		const canvas = this.$element[0];
		canvas.width = width;
		canvas.height = height;
	}

	render(){

	}
}
