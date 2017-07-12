const cache: { [key:string]: any } = {};
const FALLBACK_TEXTURE = 'textures/default.jpg';

export class Texture {
	binding: WebGLTexture;
	filename: string;
	filter: number;
	wrap: number;

	constructor(gl: WebGL2RenderingContext){
		this.binding = gl.createTexture();
	}

	static load(gl: WebGL2RenderingContext, filename: string, filter?: number, wrap?: number){
		const key: string = cacheKey(filename, filter, wrap);
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

	static preload(gl: WebGL2RenderingContext, filename: string){
		return Texture.load(gl, filename);
	}

	bind(gl: WebGL2RenderingContext){
		gl.bindTexture(gl.TEXTURE_2D, this.binding);
	}

	unbind(gl: WebGL2RenderingContext){
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	loadImage(gl: WebGL2RenderingContext, filename: string, filter?: number, wrap?: number){
		filter = filter || gl.LINEAR;
		wrap = wrap || gl.CLAMP_TO_EDGE;
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line no-undef
			const img = new Image();
			img.onload = () => {
				this.bind(gl);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
				resolve(this);
			};
			img.onerror = (err) => {
				Texture.load(gl, FALLBACK_TEXTURE).then((fallback: Texture) => {
					reject(fallback);
				}).catch(() => {
					reject(err);
				});
			};
			img.src = `assets/${filename}`;
		});
	}
}

function cacheKey(filename: string, filter: number, wrap: number): string {
	return `${filename}#${filter||'default'},${wrap||'default'}`;
}
