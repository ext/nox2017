/* eslint-disable angular/no-controller */

import { WaypointBehaviour } from 'behaviour';
import { Waypoint } from 'behaviour/waypoint-behaviour';
import { Waypoint as WaypointItem } from './items/waypoint';
import { Camera, PerspectiveCamera } from 'camera';
import { CanvasController } from 'canvas';
import { Entity } from 'entity';
import { Framebuffer } from 'framebuffer';
import { Map } from 'map';
import { Model, ModelService } from 'model';
import { Shader } from 'shader';
import { Texture } from 'texture';
import { AABB } from 'math';
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

interface Route {
	waypoint: Waypoint[];
}

class MainController extends CanvasController {
	$scope: ng.IScope;
	ModelService: ModelService;
	static $$ngIsClass: boolean;

	fbo: Framebuffer;
	ortho: Matrix;
	quad: Model;
	shader: Shader;
	postshader: Shader;
	camera: PerspectiveCamera;
	map: Map;
	routes: { [key:number]: Route };
	entity: Entity;
	texture: Texture;

	constructor($scope: ng.IScope, $element: any, $injector: angular.auto.IInjectorService, ModelService: ModelService){
		super($element, $injector);
		this.$scope = $scope;
		this.ModelService = ModelService;
		this.fbo = undefined;
		this.ortho = null;
		this.routes = {};

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
		this.postshader = this.loadShader('/shaders/post.yml');
		this.entity = new Entity({
			model: this.ModelService.fromFile(gl, '/data/cube.yml'),
			position: [55, -9, 0],
		});

		this.camera = new PerspectiveCamera({
			fov: FOV,
			aspect: this.width / this.height,
			znear: zNear,
			zfar: zFar,
			onUpdate: Camera.follow(this.entity, {offset: [0, -8, 25]}),
		});

		promises.push(this.loadMap('/data/map.json').then((map: Map) => {
			this.map = map;

			/* find all routes */
			this.routes = {};
			const waypoints = map.object.filter(item => item instanceof WaypointItem);
			waypoints.forEach((item: WaypointItem) => {
				if (!(item.route in this.routes)){
					this.routes[item.route] = {
						waypoint: [],
					};
				}
				const route = this.routes[item.route];
				route.waypoint.push({
					name: item.name,
					aabb: AABB.fromItem(item),
					next: item.next,
				});
			});

			const chainsaw = this.map.getObjectByName('chainsaw');
			chainsaw.attachBehaviour(new WaypointBehaviour(this.routes[1].waypoint));
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
		this.fbo.addColorBuffer(gl, gl.RGBA8UI, gl.NEAREST);
	}

	tick(){
		const game = this.$scope.game; /* angular parent controller */
		const run: boolean = game.running || game.step;
		super.tick(run);
		game.step = false;
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

		this.map.update(dt);
		this.entity.position = this.entity.position.add(velocity.x(dt));
		this.entity.update(dt);

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
			gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 1]);
			gl.clearBufferuiv(gl.COLOR, 1, [0, 0, 0, 0]);
			gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1.0, 0);

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

		this.postshader.bind();
		this.fbo.bindTexture(gl, 0);
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
