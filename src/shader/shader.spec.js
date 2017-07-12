import { glMock } from 'gl-mock';
import { Shader } from 'shader';

describe('Shader', function(){

	let gl;

	beforeEach(() => {
		gl = glMock();
		gl.wgeUniforms = {}; /* simulate initialize */
	});

	describe('initialize()', () => {

		it('should add uniforms', () => {
			Shader.initialize(gl);
			expect(gl.wgeUniforms.projectionViewMatrices).toBeDefined();
			expect(gl.wgeUniforms.modelMatrices).toBeDefined();
		});

		it('should enable vertex attributes', () => {
			const expectedNumberOfAttributes = 3;
			spyOn(gl, 'enableVertexAttribArray');
			Shader.initialize(gl);
			expect(gl.enableVertexAttribArray.calls.count()).toBe(expectedNumberOfAttributes);
			for (let i = 0; i < expectedNumberOfAttributes; i++){
				expect(gl.enableVertexAttribArray.calls.argsFor(i)).toEqual([i]);
			}
		});

	});

	describe('constructor()', () => {

		it('should create program', () => {
			spyOn(gl, 'createProgram');
			spyOn(gl, 'linkProgram');
			const shader = new Shader(gl, {
				pass: [{}],
			});
			expect(gl.createProgram).toHaveBeenCalled();
			expect(gl.linkProgram).toHaveBeenCalledWith(shader.sp);
		});

		it('should initialize uniforms', () => {
			spyOn(gl, 'uniformBlockBinding');
			gl.wgeUniforms = {
				foo: {
					name: 'foo',
					binding: 7,
				},
			};
			const shader = new Shader(gl, {
				pass: [{}],
			});
			expect(gl.uniformBlockBinding).toHaveBeenCalledWith(shader.sp, 0, 7);
		});

	});

	describe('bind()', () => {

		it('should bind shader', () => {
			const shader = new Shader(gl, {
				pass: [{}],
			});
			spyOn(gl, 'useProgram');
			shader.bind();
			expect(gl.useProgram).toHaveBeenCalled();
		});

	});

});
