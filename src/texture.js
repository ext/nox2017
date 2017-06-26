const cache = {};

export class Texture {
	constructor(gl){
		this.context = gl;
		this.binding = gl.createTexture();
	}

	static load(gl, filename){
		if (!cache.hasOwnProperty(filename)){
			const texture = new Texture(gl);
			cache[filename] = texture.loadImage(gl, filename);
		}
		return cache[filename];
	}

	static preload(gl, filename){
		return Texture.load(gl, filename);
	}

	bind(){
		const gl = this.context;
		gl.bindTexture(gl.TEXTURE_2D, this.binding);
	}

	unbind(){
		const gl = this.context;
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	loadImage(gl, filename){
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line no-undef
			const img = new Image();
			img.onload = () => {
				this.bind();
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				resolve(this);
			};
			img.onerror = (err) => {
				reject(err);
			};
			img.src = `/assets/${filename}`;
		});
	}
}
