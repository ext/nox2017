/* eslint-disable angular/no-controller */

import { CanvasController } from './canvas';
import { Entity } from './entity';
import { Model } from './model';
import { Vector, Matrix } from 'sylvester';

const FOV = 45.0;
const zNear = 0.1;
const zFar = 100.0;

class MainController extends CanvasController {
	constructor($window, $element, ShaderService){
		super($window, $element, ShaderService);

		this.init();
		this.shader = this.loadShader('/shaders/test.shader.yml');

		const model = new Model(this.context);
		model.upload([
			1.0,  1.0,  0.0, 1.0, 1.0, 1.0, 1.0,
			-1.0, 1.0,  0.0, 1.0, 0.0, 1.0, 1.0,
			1.0,  -1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
			-1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		]);

		this.entity = new Entity(this.context, {
			model,
		});

		this.render();
	}

	resize(width, height){
		super.resize(width, height);
		this.matP = makePerspective(FOV, width / height, zNear, zFar);
		this.context.viewport(0, 0, width, height);
	}

	render(){
		const gl = this.context;

		this.clear();

		this.shader.bind();
		gl.uniformMatrix4fv(this.shader.uP, false, new Float32Array(this.matP.flatten()));

		this.entity.render(this.shader);
	}
}

// augment Sylvester some
Matrix.Translation = function(v){
	if (v.elements.length === 2){
		let r = Matrix.I(3);
		r.elements[2][0] = v.elements[0];
		r.elements[2][1] = v.elements[1];
		return r;
	}

	if (v.elements.length === 3){
		let r = Matrix.I(4);
		r.elements[0][3] = v.elements[0];
		r.elements[1][3] = v.elements[1];
		r.elements[2][3] = v.elements[2];
		return r;
	}

	throw "Invalid length for Translation";
};

Matrix.prototype.flatten = function(){
	let result = [];
	if (this.elements.length === 0){
		return [];
	}

	for (let j = 0; j < this.elements[0].length; j++){
		for (let i = 0; i < this.elements.length; i++){
			result.push(this.elements[i][j]);
		}
	}
	return result;
};

Matrix.prototype.ensure4x4 = function(){ // eslint-disable-line complexity
	if (this.elements.length === 4 &&
			this.elements[0].length === 4){
		return this;
	}

	if (this.elements.length > 4 ||
			this.elements[0].length > 4){
		return null;
	}

	for (let i = 0; i < this.elements.length; i++){
		for (let j = this.elements[i].length; j < 4; j++){
			if (i === j){
				this.elements[i].push(1);
			} else {
				this.elements[i].push(0);
			}
		}
	}

	for (let i = this.elements.length; i < 4; i++){
		if (i === 0){
			this.elements.push([1, 0, 0, 0]);
		} else if (i === 1){
			this.elements.push([0, 1, 0, 0]);
		} else if (i === 2){
			this.elements.push([0, 0, 1, 0]);
		} else if (i === 3){
			this.elements.push([0, 0, 0, 1]);
		}
	}

	return this;
};

Matrix.prototype.make3x3 = function(){
	if (this.elements.length !== 4 ||
			this.elements[0].length !== 4){
		return null;
	}

	return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
												[this.elements[1][0], this.elements[1][1], this.elements[1][2]],
												[this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.flatten = function(){
	return this.elements;
};

//
// gluLookAt
//
function makeLookAt(ex, ey, ez,
										cx, cy, cz,
										ux, uy, uz){
	let eye = Vector.create([ex, ey, ez]);
	let center = Vector.create([cx, cy, cz]);
	let up = Vector.create([ux, uy, uz]);

	let mag;

	let z = eye.subtract(center).toUnitVector();
	let x = up.cross(z).toUnitVector();
	let y = z.cross(x).toUnitVector();

	let m = Matrix.create([[x.e(1), x.e(2), x.e(3), 0],
							[y.e(1), y.e(2), y.e(3), 0],
							[z.e(1), z.e(2), z.e(3), 0],
							[0, 0, 0, 1]]);

	let t = Matrix.create([[1, 0, 0, -ex],
							[0, 1, 0, -ey],
							[0, 0, 1, -ez],
							[0, 0, 0, 1]]);
	return m.x(t);
}

//
// glOrtho
//
function makeOrtho(left, right,
									 bottom, top,
									 znear, zfar){
	let tx = -(right+left)/(right-left);
	let ty = -(top+bottom)/(top-bottom);
	let tz = -(zfar+znear)/(zfar-znear);

	return Matrix.create([[2/(right-left), 0, 0, tx],
						 [0, 2/(top-bottom), 0, ty],
						 [0, 0, -2/(zfar-znear), tz],
						 [0, 0, 0, 1]]);
}

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar){
	let ymax = znear * Math.tan(fovy * Math.PI / 360.0);
	let ymin = -ymax;
	let xmin = ymin * aspect;
	let xmax = ymax * aspect;

	return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
										 bottom, top,
										 znear, zfar){
	let X = 2*znear/(right-left);
	let Y = 2*znear/(top-bottom);
	let A = (right+left)/(right-left);
	let B = (top+bottom)/(top-bottom);
	let C = -(zfar+znear)/(zfar-znear);
	let D = -2*zfar*znear/(zfar-znear);

	return Matrix.create([[X, 0, A, 0],
						 [0, Y, B, 0],
						 [0, 0, C, D],
						 [0, 0, -1, 0]]);
}

MainController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('MainController', MainController);
