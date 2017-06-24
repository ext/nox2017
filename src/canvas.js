export class CanvasController {
	constructor($element, ShaderService){
		this.$element = $element;
		this.ShaderService = ShaderService;
		this.context = null;
	}

	init(){
		const canvas = this.$element[0];
		return this.context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	}

	loadShader(filename){
		return this.ShaderService.load(this.context, filename);
	}

	clear(){
		this.context.clearColor(0.0, 0.0, 0.0, 1.0);
		this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
	}
}
