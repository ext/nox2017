export class Shader {

	constructor(gl, data){
		this.context = gl;
		const sp = this.sp = gl.createProgram();

		/* for now only singlepass is supported */
		const pass = data.pass[0];
		attach(gl, sp, pass);
		gl.linkProgram(sp);

		if (!gl.getProgramParameter(sp, gl.LINK_STATUS)){
			throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(sp));
		}
	}

	bind(){
		this.context.useProgram(this.sp);
	}

	getAttribLocation(name){
		const gl = this.context;
		return gl.getAttribLocation(this.sp, name);
	}

	getUniformLocation(name){
		const gl = this.context;
		return gl.getUniformLocation(this.sp, name);
	}
}

function typeToEnum(gl, type){
	switch (type){
	case 'vertex': return gl.VERTEX_SHADER;
	case 'fragment': return gl.FRAGMENT_SHADER;
	default: throw new Error(`Unknown shader type "${type}", ignored`);
	}
}

function attach(gl, sp, pass){
	for (const [type, source] of Object.entries(pass)){
		const glType = typeToEnum(gl, type);
		const shader = gl.createShader(glType);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			const error = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(`Failed to compile shader: "${error}"`);
		}

		gl.attachShader(sp, shader);
	}
}
