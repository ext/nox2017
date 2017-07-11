import { Texture } from 'texture';

declare global {
	const angular: ng.IAngularStatic;
}

export class CanvasController {
	element: HTMLCanvasElement;
	$window: Window;
	$timeout: ng.ITimeoutService;
	$templateCache: ng.ITemplateCacheService;
	ShaderService: any;
	MapService: any;
	lastFrame: number;
	context: WebGL2RenderingContext;
	keypress: boolean[];
	width: number;
	height: number;

	constructor($element: any, $injector: angular.auto.IInjectorService){
		this.$window = $injector.get('$window');
		this.$timeout = $injector.get('$timeout');
		this.element = $element[0];
		this.$templateCache = $injector.get('$templateCache');
		this.ShaderService = $injector.get('ShaderService');
		this.MapService = $injector.get('MapService');
		this.context = null;
		this.lastFrame = null;              /* timestamp of last frame */
		this.keypress = [];                 /* state of keyboard */

		this.$window.addEventListener('resize', () => {
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

	init(filename: string): Promise<any> {
		const config = this.$templateCache.get<any>(filename);
		if (!config){
			throw new Error(`Failed to load game configuration "${filename}".`);
		}

		const canvas = this.element;
		const gl = <any>(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2')) as WebGL2RenderingContext;
		this.context = gl;

		/* enable backface culling */
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		/* depth */
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		/* blending */
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

		this.context.wgeUniforms = {}; /* uniform blocks */
		this.ShaderService.initialize(this.context);

		this.bindKeys();

		canvas.classList.add('loading');
		return Promise.all([
			this.preload(config.preload || {}),
			this.calculateSize(),
		]).then(() => {
			canvas.classList.remove('loading');
		});
	}

	bindKeys(){
		this.$window.addEventListener('keydown', event => {
			this.keypress[event.keyCode] = true;
		});
		this.$window.addEventListener('keyup', event => {
			this.keypress[event.keyCode] = false;
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

	preload(preload: any){
		const textures = (preload.texture||[]);
		return Promise.all(textures.map((cur: string) => {
			return Texture.preload(this.context, cur);
		}));
	}

	loadShader(filename: string){
		return this.ShaderService.load(this.context, filename);
	}

	loadMap(filename: string){
		return this.MapService.fromFile(this.context, filename);
	}

	start(){
		this.lastFrame = Date.now();
		this.tick();
	}

	tick(){
		const now = Date.now();
		const dt = (now - this.lastFrame) / 1000;
		this.lastFrame = now;

		this.update(dt);
		this.render();

		requestAnimationFrame(() => {
			this.tick();
		});
	}

	clear(){
		this.context.clearColor(0.0, 0.0, 0.0, 1.0);
		this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
	}

	resize(width: number, height: number){
		const canvas = this.element;
		this.width = canvas.width = width;
		this.height = canvas.height = height;
	}

	update(dt: number){ // eslint-disable-line no-unused-vars

	}

	render(){

	}
}
