/* eslint-disable angular/no-controller */

import { Camera } from 'camera';
import { CanvasController } from 'canvas';
import { Entity } from 'entity';
import { Texture } from 'texture';
import { Vector, Matrix } from 'sylvester';
import { Framebuffer } from 'framebuffer';
import { registerItems } from './items';

const FOV = 45.0;
const zNear = 0.1;
const zFar = 100.0;

const KEY_LEFT = 65;
const KEY_RIGHT = 68;
const KEY_UP = 87;
const KEY_DOWN = 83;

const PLAYER_SPEED = 5;

class MainController extends CanvasController {
	constructor($scope, $element, $injector, ModelService){
		super($element, $injector);
		this.$scope = $scope;
		this.ModelService = ModelService;
		this.fbo = undefined;
		this.ortho = null;

		registerItems();

		this.init('/data/game.yml').then(() => {
			this.start();
		}).catch((err) => {
			// eslint-disable-next-line no-console
			console.error(err);
		});
	}

	init(filename){
		return super.init(filename).then(() => {
			return Promise.all([
				this.setupEventHandlers(),
				this.setupWorld(),
			]);
		});
	}

	setupWorld(){
		const promises = [];
		const gl = this.context;

		this.quad = this.ModelService.quad(gl);
		this.shader = this.loadShader('/shaders/test.shader.yml');
		this.entity = new Entity({
			model: this.ModelService.fromFile(gl, '/data/cube.yml'),
			position: [55, -9, 0],
		});

		this.camera = new Camera({
			onUpdate: Camera.follow(this.entity, {offset: [0, 0, 15]}),
		});

		promises.push(this.loadMap('/data/map.json').then((map) => {
			this.map = map;
		}));

		promises.push(Texture.load(gl, '/textures/uvgrid.jpg').then(texture => {
			this.texture = texture;
		}));

		return Promise.all(promises);
	}

	setupEventHandlers(){
		this.$scope.$watchGroup([
			'cam.x',
			'cam.y',
			'cam.z',
		], (pos) => {
			this.camera.setPosition(Vector.create(pos));
			this.render();
		});
		this.$scope.$watchGroup([
			'rot.x',
			'rot.y',
			'rot.z',
		], (rot) => {
			this.entity.rotation = Vector.quatFromEuler(rot[0], rot[1], rot[2]);
			this.entity.calc();
			this.render();
		});
		return Promise.resolve();
	}

	resize(width, height){
		super.resize(width, height);
		this.projection = makePerspective(FOV, width / height, zNear, zFar);
		this.context.viewport(0, 0, width, height);
		this.ortho = Matrix.ortho(0, width, 0, height, 0, 100);

		const gl = this.context;

		if (this.fbo){
			this.fbo.destroy();
		}

		this.fbo = new Framebuffer(gl, [width, height], {
			format: gl.RGB8,
			depth: true,
		});
	}

	update(dt){
		let velocity = Vector.create([0, 0, 0]);

		if (this.keypress[KEY_RIGHT]){
			velocity.elements[0] += PLAYER_SPEED;
		}

		if (this.keypress[KEY_LEFT]){
			velocity.elements[0] -= PLAYER_SPEED;
		}

		if (this.keypress[KEY_UP]){
			velocity.elements[1] += PLAYER_SPEED;
		}

		if (this.keypress[KEY_DOWN]){
			velocity.elements[1] -= PLAYER_SPEED;
		}

		this.entity.position = this.entity.position.add(velocity.x(dt));
		this.entity.calc();

		this.camera.update();
	}

	render(){
		const gl = this.context;
		let error;

		error = gl.getError();
		if (error !== gl.NO_ERROR){
			throw new Error(`Pre frame check returned error ${error}`);
		}

		this.clear();
		this.ShaderService.uploadProjectionView(gl, this.projection, this.camera.getViewMatrix());

		this.shader.bind();
		this.fbo.with(() => {
			this.fbo.clear(gl, 0, 0, 0, 0);

			this.map.render(gl);

			this.texture.bind();
			this.ShaderService.uploadModel(gl, this.entity.modelMatrix);
			this.entity.render(gl);
		});

		const scale = Matrix.create([
			[this.width, 0, 0, 0],
			[0, this.height, 0, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 1],
		]);

		this.ShaderService.uploadProjectionView(gl, this.ortho, Matrix.I(4));
		this.ShaderService.uploadModel(gl, scale);

		this.fbo.bindTexture(gl);
		this.quad.render(gl);

		if (error !== gl.NO_ERROR){
			throw new Error(`Post frame check returned error ${error}`);
		}
	}
}

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
