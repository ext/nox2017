import { Uniform } from './uniform';
import { IShaderData } from './shader-data'; // eslint-disable-line no-unused-vars

declare global {
	interface WebGL2RenderingContext {
		wgeUniforms: any;
	}
}

export const Attribute = {
	Position: 0,
	UV: 1,
	Color: 2,
};

const numAttributes = Object.keys(Attribute).length;

export class Shader {
	context: WebGL2RenderingContext;
	sp: WebGLProgram;

	constructor(gl: WebGL2RenderingContext, data: IShaderData){
		this.context = gl;

		const sp = this.sp = gl.createProgram();

		/* for now only singlepass is supported */
		const pass = data.pass[0];
		attach(gl, sp, pass);
		gl.linkProgram(sp);

		if (!gl.getProgramParameter(sp, gl.LINK_STATUS)){
			throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(sp));
		}

		this.bind();
		this.setupUniformBlocks();
	}

	static initialize(gl: WebGL2RenderingContext){
		gl.wgeUniforms.projectionViewMatrices = new Uniform(gl, 'projectionViewMatrices', 4*16*3);
		gl.wgeUniforms.modelMatrices = new Uniform(gl, 'modelMatrices', 4*16*1);

		for (let i = 0; i < numAttributes; i++){
			gl.enableVertexAttribArray(i);
		}
	}

	setupUniformBlocks(){
		const gl = this.context;
		for (const it of Object.values(gl.wgeUniforms)){
			const id = gl.getUniformBlockIndex(this.sp, it.name);
			if (id !== -1){
				gl.uniformBlockBinding(this.sp, id, it.binding);
			}
		}
	}

	bind(){
		this.context.useProgram(this.sp);
	}

	static uploadProjectionView(gl: WebGL2RenderingContext, proj: any, view: any){
		const pv = proj.x(view);
		const s = 4*16;
		gl.wgeUniforms.projectionViewMatrices.upload(gl, [
			[0*s, new Float32Array(pv.flatten())],
			[1*s, new Float32Array(proj.flatten())],
			[2*s, new Float32Array(view.flatten())],
		]);
	}

	static uploadModel(gl: WebGL2RenderingContext, model: any){
		gl.wgeUniforms.modelMatrices.upload(gl, [
			[0, new Float32Array(model.flatten())],
		]);
	}

	getAttribLocation(name: string){
		const gl = this.context;
		return gl.getAttribLocation(this.sp, name);
	}

	getUniformLocation(name: string){
		const gl = this.context;
		return gl.getUniformLocation(this.sp, name);
	}
}

function typeToEnum(gl: WebGL2RenderingContext, type: string){
	switch (type){
	case 'vertex': return gl.VERTEX_SHADER;
	case 'fragment': return gl.FRAGMENT_SHADER;
	default: throw new Error(`Unknown shader type "${type}", ignored`);
	}
}

function attach(gl: WebGL2RenderingContext, sp: WebGLProgram, pass: Object){
	for (const [type, source] of Object.entries(pass)){
		const glType = typeToEnum(gl, type);
		const shader = gl.createShader(glType);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			const error = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(`Failed to compile "${type}" shader: "${error}"`);
		}

		gl.attachShader(sp, shader);
	}
}
