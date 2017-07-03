/* eslint-disable angular/no-controller */

import { Camera } from 'camera';
import { CanvasController } from 'canvas';
import { Entity } from 'entity';
import { Texture } from 'texture';
import { Vector, Matrix } from 'sylvester';

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

		this.shader = this.loadShader('/shaders/test.shader.yml');
		this.entity = new Entity(this.context, {
			model: this.ModelService.fromFile(this.context, '/data/cube.yml'),
		});

		this.camera = new Camera({
			onUpdate: Camera.follow(this.entity, {offset: [0, 0, 25]}),
		});

		promises.push(this.loadMap('/data/test3.json').then((map) => {
			this.map = map;
		}));

		promises.push(Texture.load(this.context, '/textures/uvgrid.jpg').then(texture => {
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
		this.matP = makePerspective(FOV, width / height, zNear, zFar);
		this.context.viewport(0, 0, width, height);
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

		this.clear();
		this.ShaderService.uploadProjectionView(gl, this.matP, this.camera.getViewMatrix());

		{
			this.shader.bind();
			this.ShaderService.uploadModel(gl, Matrix.I(4));
			this.map.render(this.shader);
		}

		{
			this.shader.bind();
			this.texture.bind();
			this.ShaderService.uploadModel(gl, this.entity.modelMatrix);
			this.entity.render(this.shader);
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