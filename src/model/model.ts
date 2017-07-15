import { Attribute } from 'shader';

let quad: Model = null;
let quad2: Model = null;

const stride = 9 * 4;

export class Model {
	vertices: WebGLBuffer;
	indices: WebGLBuffer;
	numIndices: number;

	constructor(gl: WebGL2RenderingContext){
		this.vertices = gl.createBuffer();
		this.indices = gl.createBuffer();
		this.numIndices = 0;
	}

	static Quad(gl: WebGL2RenderingContext){
		if (!quad){
			quad = new Model(gl);
			quad.upload(gl, new Float32Array([
				/* X     Y     Z       U     V       R    G    B    A */
				 1.0,  1.0,  0.0,    1.0,  1.0,    1.0, 1.0, 1.0, 1.0,
				 0.0,  1.0,  0.0,    0.0,  1.0,    1.0, 1.0, 1.0, 1.0,
				 1.0,  0.0,  0.0,    1.0,  0.0,    1.0, 1.0, 1.0, 1.0,
				 0.0,  0.0,  0.0,    0.0,  0.0,    1.0, 1.0, 1.0, 1.0,
			]), new Uint32Array([0, 1, 2, 1, 3, 2]));
		}
		return quad;
	}

	static Quad2(gl: WebGL2RenderingContext){
		if (!quad2){
			quad2 = new Model(gl);
			quad2.upload(gl, new Float32Array([
				/* X     Y     Z       U     V       R    G    B    A */
				 0.8,  0.8,  0.0,    1.0,  1.0,    1.0, 1.0, 1.0, 1.0,
				-0.8,  0.8,  0.0,    1.0,  0.0,    1.0, 1.0, 1.0, 1.0,
				 0.8, -0.8,  0.0,    0.0,  1.0,    1.0, 1.0, 1.0, 1.0,
				-0.8, -0.8,  0.0,    0.0,  0.0,    1.0, 1.0, 1.0, 1.0,
			]), new Uint32Array([0, 1, 2, 1, 3, 2]));
		}
		return quad2;
	}

	upload(gl: WebGL2RenderingContext, vertices: Float32Array, indices: Uint32Array){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
		this.numIndices = indices.length;
	}

	bind(gl: WebGL2RenderingContext){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.vertexAttribPointer(Attribute.Position, 3, gl.FLOAT, false, stride, 0*4);
		gl.vertexAttribPointer(Attribute.UV, 2, gl.FLOAT, false, stride, 3*4);
		gl.vertexAttribPointer(Attribute.Color, 4, gl.FLOAT, false, stride, 5*4);
	}

	render(gl: WebGL2RenderingContext){
		if (gl === null) throw new Error('Model.render() called without GL context');
		this.bind(gl);
		gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_INT, 0);
	}
}
