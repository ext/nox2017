import { Framebuffer } from 'framebuffer';
import { glMock } from 'gl-mock';

describe('Framebuffer', function(){

	let gl;

	beforeEach(() => {
		gl = glMock();
	});

	describe('constructor', () => {

		it('should be initialized', () => {
			const fbo = new Framebuffer(gl, [800, 600]);
			expect(fbo.id).toBeFramebuffer(1);
			expect(fbo.color[0]).toBeTexture(2);
			expect(fbo.color[1]).toBeTexture(3);
			expect(fbo.depth).toBeTexture(4);
			expect(fbo.size[0]).toEqual(800);
			expect(fbo.size[1]).toEqual(600);
		});

		it('should be initialized without depth', () => {
			const fbo = new Framebuffer(gl, [800, 600], {depth: false});
			expect(fbo.id).toBeFramebuffer(1);
			expect(fbo.color[0]).toBeTexture(2);
			expect(fbo.color[1]).toBeTexture(3);
			expect(fbo.depth).toBe(null);
		});

		it('should be cleared', () => {
			spyOn(gl, 'clear');
			spyOn(gl, 'clearColor');
			const fbo = new Framebuffer(gl, [800, 600]); // eslint-disable-line no-unused-vars
			expect(gl.clearColor).toHaveBeenCalledWith(0, 0, 0, 1);
			expect(gl.clear).toHaveBeenCalled();
		});

	});

	describe('destroy()', () => {

		it('should release resources, with depth enabled', () => {
			spyOn(gl, 'deleteFramebuffer');
			spyOn(gl, 'deleteTexture');
			const fbo = new Framebuffer(gl, [800, 600], {depth: true});
			fbo.destroy();
			expect(gl.deleteFramebuffer).toHaveBeenCalled();
			expect(gl.deleteTexture.calls.count()).toBe(3);
			expect(gl.deleteTexture.calls.argsFor(0)).toEqual([fbo.color[0]]);
			expect(gl.deleteTexture.calls.argsFor(1)).toEqual([fbo.color[1]]);
			expect(gl.deleteTexture.calls.argsFor(2)).toEqual([fbo.depth]);
		});

	});

	describe('bindTexture()', () => {

		it('should bind the colorbuffer currently not rendered to', () => {
			const fbo = new Framebuffer(gl, [800, 600]);
			spyOn(gl, 'bindTexture');
			fbo.bindTexture();
			expect(fbo.color[fbo.current]).toEqual(jasmine.objectContaining({id: 3}));
			expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, jasmine.objectContaining({id: 2}));
			fbo.swap();
			fbo.bindTexture();
			expect(fbo.color[fbo.current]).toEqual(jasmine.objectContaining({id: 2}));
			expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, jasmine.objectContaining({id: 3}));
		});

	});

	describe('with()', () => {

		it('should call provided callback', () => {
			const fbo = new Framebuffer(gl, [800, 600]);
			const cb = jasmine.createSpy('callback');
			fbo.with(cb);
			expect(cb).toHaveBeenCalled();
		});

		it('should swap buffers', () => {
			const fbo = new Framebuffer(gl, [800, 600]);
			const cb = jasmine.createSpy('callback');
			spyOn(fbo, 'swap');
			fbo.with(cb);
			expect(fbo.swap).toHaveBeenCalled();
		});

	});

});
