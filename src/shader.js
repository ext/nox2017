class Uniform {

	constructor(shader, name, size, usage){
		const gl = shader.context;

		this.shader = shader;
		this.id = gl.createBuffer();
		this.name = name;
		this.size = size;
		this.binding = shader.getUniformLocation(name);

		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		gl.bufferData(gl.UNIFORM_BUFFER, this.size, usage || gl.DYNAMIC_DRAW);
		gl.bindBufferRange(gl.UNIFORM_BUFFER, this.binding, this.id, 0, this.size);
	}

	upload(data){
		const gl = this.shader.context;
		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		for (const [offset, value] of data){
			gl.bufferSubData(gl.UNIFORM_BUFFER, offset, new Float32Array(value.flatten()));
		}
	}

}

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

		this.uP = this.getUniformLocation('P');
		this.uMV = this.getUniformLocation('MV');

		this.setupUniformBlocks();
		this.setupAttributes();
	}

	setupUniformBlocks(){
		this.uProjectionView = new Uniform(this, 'projectionViewMatrices', 4*16*3);
	}

	setupAttributes(){
		const gl = this.context;
		this.aPosition = this.getAttribLocation("position");
		this.aColor = this.getAttribLocation("color");
		gl.enableVertexAttribArray(this.aPosition);
		gl.enableVertexAttribArray(this.aColor);
	}

	bind(){
		this.context.useProgram(this.sp);
	}

	uploadProjectionView(proj, view){
		const pv = view.x(proj);
		const s = 4*16;
		this.uProjectionView.upload([
			[0*s, pv],
			[1*s, proj],
			[2*s, view],
		]);
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
			throw new Error(`Failed to compile "${type}" shader: "${error}"`);
		}

		gl.attachShader(sp, shader);
	}
}
