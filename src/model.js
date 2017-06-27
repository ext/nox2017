let quad = null;
const stride = 9 * 4;

export class Model {
	constructor(gl){
		this.context = gl;
		this.buffer = gl.createBuffer();
	}

	static Quad(gl){
		if (!quad){
			quad = new Model(gl);
			quad.upload([
				/* X     Y     Z       U     V       R    G    B    A */
				 1.0,  1.0,  0.0,    1.0,  0.0,    1.0, 1.0, 1.0, 1.0,
				 0.0,  1.0,  0.0,    0.0,  0.0,    1.0, 1.0, 1.0, 1.0,
				 1.0,  0.0,  0.0,    1.0,  1.0,    1.0, 1.0, 1.0, 1.0,
				 0.0,  0.0,  0.0,    0.0,  1.0,    1.0, 1.0, 1.0, 1.0,
			]);
		}
		return quad;
	}

	upload(vertices){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	}

	bind(shader){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.vertexAttribPointer(shader.aPosition, 3, gl.FLOAT, false, stride, 0*4);
		gl.vertexAttribPointer(shader.aUV,       2, gl.FLOAT, false, stride, 3*4);
		gl.vertexAttribPointer(shader.aColor,    4, gl.FLOAT, false, stride, 5*4);
	}
}
