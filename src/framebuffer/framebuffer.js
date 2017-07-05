export class Framebuffer {
	constructor(gl, size, options){
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

		for (const target of this.color){
			gl.bindTexture(gl.TEXTURE_2D, target);
			gl.texImage2D(gl.TEXTURE_2D, 0, options.format, size[0], size[1], 0, options.format === gl.RGBA8 ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter);
		}

		if (this.depth){
			gl.bindTexture(gl.TEXTURE_2D, this.depth);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, size[0], size[1], 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
		}

		this.with(gl, () => {
			if (this.depth){
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
			}

			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			if (status !== gl.FRAMEBUFFER_COMPLETE){
				const message = framebufferStatusMessage(gl, status);
				throw new Error(`Framebuffer not complete: ${message}`);
			}

			gl.disable(gl.CULL_FACE);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			this.clear(gl, 0, 0, 0, 1);
		});
	}

	destroy(gl){
		gl.deleteFramebuffer(this.id);
		gl.deleteTexture(this.color[0]);
		gl.deleteTexture(this.color[1]);
		if (this.depth){
			gl.deleteTexture(this.depth);
		}
	}

	bindTexture(gl){
		gl.bindTexture(gl.TEXTURE_2D, this.color[1-this.current]);
	}

	with(gl, cb){
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color[this.current], 0);
		{
			cb();
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.current = 1 - this.current;
	}

	clear(gl, ...args){
		gl.clearColor(...args);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	}
}

function framebufferStatusMessage(gl, status){
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
