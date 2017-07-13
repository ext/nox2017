/* eslint-disable angular/no-controller */

import { Camera, PerspectiveCamera } from 'camera';
import { CanvasController } from 'canvas';
import { Entity } from 'entity';
import { Framebuffer } from 'framebuffer';
import { Map } from 'map';
import { Model, ModelService } from 'model';
import { Shader } from 'shader';
import { Texture } from 'texture';
import { Vector, Matrix } from 'sylvester';
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
	$scope: ng.IScope;
	ModelService: ModelService;
	static $$ngIsClass: boolean;

	fbo: Framebuffer;
	ortho: Matrix;
	quad: Model;
	shader: Shader;
	camera: PerspectiveCamera;
	map: Map;
	entity: Entity;
	texture: Texture;

	constructor($scope: ng.IScope, $element: any, $injector: angular.auto.IInjectorService, ModelService: ModelService){
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

	init(filename: string): Promise<any> {
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
		this.shader = this.loadShader('/shaders/default.yml');
		this.entity = new Entity({
			model: this.ModelService.fromFile(gl, '/data/cube.yml'),
			position: [55, -9, 0],
		});

		this.camera = new PerspectiveCamera({
			fov: FOV,
			aspect: this.width / this.height,
			znear: zNear,
			zfar: zFar,
			onUpdate: Camera.follow(this.entity, {offset: [0, 0, 15]}),
		});

		promises.push(this.loadMap('/data/map.json').then((map: Map) => {
			this.map = map;
		}));

		promises.push(Texture.load(gl, '/textures/uvgrid.jpg').then((texture: Texture) => {
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
			this.entity.updateModelMatrix();
			this.render();
		});
		return Promise.resolve();
	}

	resize(width: number, height: number){
		super.resize(width, height);
		if (this.camera){
			this.camera.resize({aspect: width / height});
		}
		this.context.viewport(0, 0, width, height);
		this.ortho = Matrix.ortho(0, width, 0, height, 0, 100);

		const gl = this.context;

		if (this.fbo){
			this.fbo.destroy(gl);
		}

		this.fbo = new Framebuffer(gl, [width, height], {
			format: gl.RGB8,
			depth: true,
		});
	}

	update(dt: number){
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
		this.entity.updateModelMatrix();

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
		this.ShaderService.uploadProjectionView(gl, this.camera.getProjectionMatrix(), this.camera.getViewMatrix());

		this.shader.bind();
		this.fbo.with(gl, () => {
			this.fbo.clear(gl, 0, 0, 0, 0);

			this.map.render(gl);

			this.texture.bind(gl);
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

MainController.$$ngIsClass = true;

angular
	.module('wge')
	.controller('MainController', MainController);
