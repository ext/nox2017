export class Model {

	constructor(gl){
		this.context = gl;
		this.buffer = gl.createBuffer();
	}

	upload(vertices){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	bind(){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	}

}
