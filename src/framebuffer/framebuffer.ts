export class Framebuffer {
	id: WebGLFramebuffer;
	color: [WebGLTexture, WebGLTexture];
	depth: WebGLTexture;
	current: number;
	size: [number, number];
	attachments: WebGLTexture[];

	constructor(gl: WebGL2RenderingContext, size: [number, number], options: any){
		options = Object.assign({
			format: gl.RGBA8,
			depth: true,
			alpha: true,
			filter: gl.NEAREST,
		}, options);

		this.id = gl.createFramebuffer();
		this.color = [gl.createTexture(), gl.createTexture()];
		this.depth = options.depth ? gl.createTexture() : null;
		this.current = 0;
		this.size = size;
		this.attachments = [0];

		for (const target of this.color){
			gl.bindTexture(gl.TEXTURE_2D, target);
			this.setupColorBuffer(gl, size, options.format, options.filter);
		}

		if (this.depth){
			gl.bindTexture(gl.TEXTURE_2D, this.depth);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, size[0], size[1], 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
		}

		this.with(gl, () => {
			if (this.depth){
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
			}

			this.validate(gl);

			gl.disable(gl.CULL_FACE);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 1]);
			gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1.0, 0);
		});

		this.checkGLErrors(gl, 'Post framebuffer creation');
	}

	destroy(gl: WebGL2RenderingContext){
		gl.deleteFramebuffer(this.id);
		gl.deleteTexture(this.color[0]);
		gl.deleteTexture(this.color[1]);
		if (this.depth){
			gl.deleteTexture(this.depth);
		}
	}

	bindTexture(gl: WebGL2RenderingContext, index: number = 0){
		if (index === 0){
			gl.bindTexture(gl.TEXTURE_2D, this.color[1-this.current]);
		} else {
			gl.bindTexture(gl.TEXTURE_2D, this.attachments[index]);
		}
	}

	swap(){
		this.current = 1 - this.current;
	}

	with(gl: WebGL2RenderingContext, cb: () => void){
		this.checkGLErrors(gl, 'Pre framebuffer check');
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color[this.current], 0);
		gl.drawBuffers(this.attachments.map((_, i) => (gl.COLOR_ATTACHMENT0 + i)));
		{
			cb();
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.drawBuffers([gl.BACK]);
		this.swap();
		this.checkGLErrors(gl, 'Post framebuffer check');
	}

	checkGLErrors(gl: WebGL2RenderingContext, msg: string){
		const error = gl.getError();
		if (error !== gl.NO_ERROR){
			throw new Error(`${msg} returned error ${error}`);
		}
	}

	addColorBuffer(gl: WebGL2RenderingContext, format: number, filter: number){
		const texture = gl.createTexture();
		const n = this.attachments.length;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		this.setupColorBuffer(gl, this.size, format, filter);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.TEXTURE_2D, texture, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.attachments.push(texture);
		this.validate(gl);
	}

	private setupColorBuffer(gl: WebGL2RenderingContext, size: [number, number], internalformat: number, filter: number): void {
		let format = gl.RGB;
		switch (internalformat){
		case gl.RGBA8: format = gl.RGBA; break;
		case gl.RGBA8UI: format = gl.RGBA_INTEGER; break;
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, size[0], size[1], 0, format, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	}

	private validate(gl: WebGL2RenderingContext){
		const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (status !== gl.FRAMEBUFFER_COMPLETE){
			const message = framebufferStatusMessage(gl, status);
			throw new Error(`Framebuffer not complete: ${message}`);
		}
	}
}

function framebufferStatusMessage(gl: WebGL2RenderingContext, status: number){
	switch (status){
	case gl.FRAMEBUFFER_COMPLETE: return "FRAMEBUFFER_COMPLETE";
	case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
	case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
	case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
	case gl.FRAMEBUFFER_UNSUPPORTED: return "FRAMEBUFFER_UNSUPPORTED";
	case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";
	case gl.RENDERBUFFER_SAMPLES: return "RENDERBUFFER_SAMPLES";
	default: return `[${status}]`;
	}
}
