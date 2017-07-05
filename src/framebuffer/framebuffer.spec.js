import { Framebuffer } from 'framebuffer';
import { glMock } from 'gl-mock';

describe('Framebuffer', function(){

	let gl;

	beforeEach(() => {
		gl = glMock();
	});

	describe('should be initialized', () => {

		it('with size', () => {
			const fbo = new Framebuffer(gl, [800, 600]);
			expect(fbo.size[0]).toEqual(800);
			expect(fbo.size[1]).toEqual(600);
		});

	});

});
