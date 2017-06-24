import { Matrix } from 'sylvester';

export class CanvasController {
	constructor($window, $element, ShaderService){
		this.$window = $window;
		this.$element = $element;
		this.ShaderService = ShaderService;
		this.context = null;

		$window.addEventListener('resize', () => {
			const canvas = this.$element[0];
			this.resize(canvas.clientWidth, canvas.clientHeight);
			this.render();
		});
	}

	init(){
		const canvas = this.$element[0];
		this.context = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
		this.matP = Matrix.I(4);
		this.resize(canvas.clientWidth, canvas.clientHeight);
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
