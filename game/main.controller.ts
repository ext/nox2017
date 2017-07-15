/* eslint-disable angular/no-controller */

/* eslint-disable no-unused-vars */
import { PathfindingBehaviour } from './behaviour';
import { TileData } from './behaviour/pathfinding-behaviour';
import { Waypoint } from './items/waypoint';
import { Area } from './items/area';
import { Spawn } from './items/spawn';
import { Camera, PerspectiveCamera } from 'camera';
import { CanvasController } from 'canvas';
import { Entity, IEntityProperty } from 'entity';
import { Framebuffer } from 'framebuffer';
import { Map } from 'map';
import { Model, ModelService } from 'model';
import { Shader } from 'shader';
import { Texture } from 'texture';
import { AABB } from 'math';
import { Vector, Matrix } from 'sylvester';
import { registerItems } from './items';
/* eslint-enable no-unused-vars */

const FOV = 45.0;
const zNear = 0.1;
const zFar = 100.0;

const KEY_LEFT = "KeyA";
const KEY_RIGHT = "KeyD";
const KEY_UP = "KeyW";
const KEY_DOWN = "KeyS";

const PLAYER_SPEED = 15;

interface Route {
	areas: AABB[];
	waypoints: Waypoint[];
	precalculateMap: TileData[];
}

interface Wave {
	entities: IEntityProperty[];
}

interface Constants {
	spawnInitial: number;
	spawnNextWave: number;
	spawnCooldown: number;
	spawnDelay: number;
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
	routes: Route[];
	entity: Entity;
	texture: Texture;
	constants: Constants;
	wave: Wave[];
	dynamicMap: Uint32Array;

	constructor($scope: ng.IScope, $element: any, $injector: angular.auto.IInjectorService, ModelService: ModelService){
		super($element, $injector);
		this.$scope = $scope;
		this.ModelService = ModelService;
		this.fbo = undefined;
		this.ortho = null;
		this.routes = [];
		this.dynamicMap = null;

		registerItems();

		this.init('/data/game.yml').then(() => {
			this.start();
		}).catch((err) => {
			// eslint-disable-next-line no-console
			console.error(err);
		});
	}

	init(filename: string): Promise<any> {
		return super.init(filename).then((config) => {
			this.wave = config.wave;
			this.constants = config.constants;
			return Promise.all([
				this.setupEventHandlers(),
				this.setupWorld(),
			]);
		}).then(() => {
			this.startWave(0, this.constants.spawnInitial);
		});
	}

	setupWorld(){
		const promises = [];
		const gl = this.context;

		this.quad = this.ModelService.quad(gl);
		this.shader = this.loadShader('/shaders/default.yml');
		this.postshader = this.loadShader('/shaders/post.yml');
		this.entity = new Entity({
			model: null,
			position: [50, -10, 0],
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
			this.routes = [];

			const waypoints = map.object.filter(item => item instanceof Waypoint);
			waypoints.forEach((item: Waypoint) => {
				if (!(item.route in this.routes)){
					this.routes[item.route] = {
						areas: [],
						waypoints: [],
						precalculateMap: [],
					};
				}

				const route = this.routes[item.route];
				route.waypoints.push(item);
			});

			const areas = map.object.filter(item => item instanceof Area);
			areas.forEach((item: Area) => {
				if (!(item.route in this.routes)){
					this.routes[item.route] = {
						areas: [],
						waypoints: [],
						precalculateMap: [],
					};
				}

				const route = this.routes[item.route];
				route.areas.push(
					AABB.fromItem(item),
				);
			});

			this.routes.forEach((route: Route) => {
				const staticMap = new Uint32Array(this.map.width * this.map.height);
				for (let y=0; y < this.map.height; ++y) {
					const yworld = (-y - 1);
					for (let x=0; x < this.map.width; ++x) {
						const index = y * this.map.width + x;
						const xworld = x;

						if (!this.map.tileCollidable(this.map.grid[index])) {
							staticMap[index] = 0;
							continue;
						}

						let insideArea = false;
						for (let area of route.areas) {
							if (area.pointInside(xworld, yworld)) {
								insideArea = true;
								break;
							}
						}

						staticMap[index] = insideArea ? 1 : 0;
					}
				}
				route.precalculateMap = PathfindingBehaviour.precalculateMap(staticMap, this.map, route.waypoints);
			});

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
		return Promise.resolve();
	}

	startWave(index: number, timeout: number){
		const game = this.$scope.game; /* angular parent controller */
		this.$scope.$apply(() => {
			game.next = timeout / 1000;
		});

		this.addTimeout(timeout, () => {
			this.$scope.$apply(() => {
				game.next = null;
			});
			this.spawnWave(index);
		}, (left: number) => {
			game.next = Math.ceil(left);
		});
	}

	spawnWave(index: number){
		const gl = this.context;
		const wave = this.wave[index];
		const allSpawnPoints: Spawn[] = [];

		this.map.object.forEach(entity => {
			if (entity instanceof Spawn){
				allSpawnPoints.push(entity);
			}
		});

		for (const spawn of allSpawnPoints){
			const route = spawn.route;
			const waypoints = this.routes[route].waypoints;
			const precalculateMap = this.routes[route].precalculateMap;
			const behaviour = new PathfindingBehaviour(this.map, precalculateMap, this.dynamicMap, waypoints);
			for (const it of wave.entities){
				for (let i=0; i < it.count; i++){
					setTimeout(() => {
						const properties: IEntityProperty = Object.assign(it, {
							name: null,
							position: spawn.getPointInside(),
						});
						const entity = this.map.spawn(null, gl, properties);
						entity.attachBehaviour(behaviour);
					}, i * this.constants.spawnDelay);
				}
			}
		}
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
