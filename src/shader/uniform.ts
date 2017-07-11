let uniformBlockCounter: number = 0;

export class Uniform {
	id: WebGLBuffer;
	name: string;
	size: number;
	binding: number;

	constructor(gl: WebGL2RenderingContext, name: string, size: number){
		this.id = gl.createBuffer();
		this.name = name;
		this.size = size;
		this.binding = uniformBlockCounter;
		uniformBlockCounter++;

		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		gl.bufferData(gl.UNIFORM_BUFFER, this.size, gl.DYNAMIC_DRAW);
		gl.bindBufferRange(gl.UNIFORM_BUFFER, this.binding, this.id, 0, this.size);
	}

	upload(gl: WebGL2RenderingContext, data: [[number, Float32Array]]){
		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		for (const [offset, value] of data){
			gl.bufferSubData(gl.UNIFORM_BUFFER, offset, value);
		}
	}
}
