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

	bind(shader){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.vertexAttribPointer(shader.aPosition, 3, gl.FLOAT, false, 7*4, 0);
		gl.vertexAttribPointer(shader.aColor, 4, gl.FLOAT, false, 7*4, 3*4);
	}

}
