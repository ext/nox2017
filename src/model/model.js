let quad = null;

const stride = 9 * 4;

export class Model {
	constructor(gl){
		this.context = gl;
		this.vertices = gl.createBuffer();
		this.indices = gl.createBuffer();
		this.numIndices = 0;
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
			], [0, 1, 2, 3]);
		}
		return quad;
	}

	upload(vertices, indices){
		vertices = flatten(vertices);
		indices = flatten(indices);
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
		this.numIndices = indices.length;
	}

	bind(shader){
		const gl = this.context;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.vertexAttribPointer(shader.aPosition, 3, gl.FLOAT, false, stride, 0*4);
		gl.vertexAttribPointer(shader.aUV,       2, gl.FLOAT, false, stride, 3*4);
		gl.vertexAttribPointer(shader.aColor,    4, gl.FLOAT, false, stride, 5*4);
	}

	render(shader){
		const gl = this.context;
		this.bind(shader);
		gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_INT, 0);
	}
}

function flatten(src){
	return src.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}