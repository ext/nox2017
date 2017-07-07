const cache = {};
const FALLBACK_TEXTURE = 'textures/default.jpg';

export class Texture {
	constructor(gl){
		this.context = gl;
		this.binding = gl.createTexture();
	}

	static load(gl, filename, filter, wrap){
		const key = cacheKey(filename, filter, wrap);
		if (!cache.hasOwnProperty(key)){
			const texture = new Texture(gl);

			/* store for easier debugging */
			texture.filename = filename;
			texture.filter = filter;
			texture.wrap = wrap;

			/* cache texture */
			cache[key] = texture.loadImage(gl, filename, filter, wrap);
		}
		return cache[key];
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

	loadImage(gl, filename, filter, wrap){
		filter = filter || gl.LINEAR;
		wrap = wrap || gl.CLAMP_TO_EDGE;
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line no-undef
			const img = new Image();
			img.onload = () => {
				this.bind();
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
				resolve(this);
			};
			img.onerror = (err) => {
				Texture.load(gl, FALLBACK_TEXTURE).then(fallback => {
					reject(fallback);
				}).catch(() => {
					reject(err);
				});
			};
			img.src = `/assets/${filename}`;
		});
	}
}

function cacheKey(filename, filter, wrap){
	return `${filename}#${filter||'default'},${wrap||'default'}`;
}
