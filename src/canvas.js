export class CanvasController {
	constructor(){
		this.context = null;
	}

	init($element){
		const canvas = $element[0];
		this.context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		console.log(this.context);
	}

	clear(){
		this.context.clearColor(0.0, 0.0, 0.0, 1.0);
		this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
	}
}
