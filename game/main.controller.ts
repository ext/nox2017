/* eslint-disable angular/no-controller */

/* eslint-disable no-unused-vars */
import { WaypointBehaviour } from 'behaviour';
import { Waypoint } from 'behaviour/waypoint-behaviour';
import { Waypoint as WaypointItem } from './items/waypoint';
import { BuildingMoney } from './items/building';
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
const KEY_ESCAPE = "Escape";

const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

const PLAYER_SPEED = 15;

interface Route {
	waypoint: Waypoint[];
}

interface Wave {
	entities: IEntityProperty[];
}

interface Constants {
	spawnInitial: number;
	spawnNextWave: number;
	spawnCooldown: number;
	spawnDelay: number;
	startingMoney: number;
}

export class MainController extends CanvasController {
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
	constants: Constants;
	wave: Wave[];
	selected?: [number, number]; /* selected tile, coordinates in tile space as integers */
	selectionModel: Model;
	selectionTexture: [Texture, Texture];
	buildingMap: Uint32Array;
	currentlyBuilding: IEntityProperty;
	buildingModel: Model;

	constructor($scope: ng.IScope, $element: any, $injector: angular.auto.IInjectorService, ModelService: ModelService){
		super($element, $injector);
		this.$scope = $scope;
		this.ModelService = ModelService;
		this.fbo = undefined;
		this.ortho = null;
		this.routes = {};
		this.selected = null;
		this.selectionTexture = [null, null];

		registerItems();

		/* Register this controller onto the parent controller so the GUI can call
		 * stuff on this one. */
		const game = this.$scope.game; /* angular parent controller */
		game.registerCanvasController(this);

		this.init('/data/game.yml').then(() => {
			this.start();
		}).catch((err) => {
			// eslint-disable-next-line no-console
			console.error(err);
		});
	}

	init(filename: string): Promise<any> {
		return super.init(filename).then((config) => {
			const game = this.$scope.game; /* angular parent controller */
			this.wave = config.wave;
			this.constants = config.constants;
			game.money = this.constants.startingMoney;
			game.buildings = config.buildings.map((x: any, index: number) => {
				x.index = index + 1;
				return x;
			});
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
		this.buildingModel = this.ModelService.fromFile(gl, '/data/cube-pseudo-shaded.yml');
		this.selectionModel = this.buildingModel;
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

			/* fill building map */
			this.buildingMap = new Uint32Array(map.width * map.height);
			this.buildingMap.fill(0);
			this.map.grid.forEach((tile: number, i: number) => {
				this.buildingMap[i] = this.map.tileCollidable(tile) ? 9999 : 0;
			});
		}));

		promises.push(Texture.load(gl, '/textures/uvgrid.jpg').then((texture: Texture) => {
			this.texture = texture;
		}));

		promises.push(Texture.load(gl, '/textures/white.jpg').then((texture: Texture) => {
			this.selectionTexture[0] = texture;
		}));

		promises.push(Texture.load(gl, '/textures/red.jpg').then((texture: Texture) => {
			this.selectionTexture[1] = texture;
		}));

		return Promise.all(promises);
	}

	setupEventHandlers(){
		const game = this.$scope.game; /* angular parent controller */

		this.$window.addEventListener('keydown', event => {
			switch (event.code){
			case KEY_ESCAPE:
				this.currentlyBuilding = null;
				this.$scope.$apply(() => {
					game.selectedBuilding = null;
				});
				break;
			}
		});

		this.$window.addEventListener('mousedown', event => {
			event.preventDefault();
			switch (event.button){
			case MOUSE_LEFT:
				this.constructBuilding(this.currentlyBuilding);
				break;
			case MOUSE_RIGHT:
				this.currentlyBuilding = null;
				this.$scope.$apply(() => {
					game.selectedBuilding = null;
				});
				break;
			}
		});

		/* disable rightclick context menu */
		document.addEventListener('contextmenu', event => event.preventDefault());

		this.element.addEventListener('mousemove', event => {
			this.setSelection(event.clientX, event.clientY);
		});

		/* make money */
		this.addInterval(1000, () => {
			const sum = this.map.object.filter(x => x instanceof BuildingMoney).reduce((sum: number, item: any) => {
				return sum + item.amount;
			}, 0);
			this.$scope.$apply(() => {
				game.money += sum;
			});
		});

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

	setSelection(x: number, y: number){
		if (!this.map) return;

		const intersect = this.unprojectMap(x, y);
		const tx = Math.floor(intersect.elements[0]);
		const ty = -Math.floor(intersect.elements[1]) - 1;

		if (this.map.isInsideMap(tx, ty)){
			this.selected = [tx, ty];
		} else {
			this.selected = null;
		}
	}

	/**
	 * Set the current building player wants to build.
	 */
	setBuilding(building: IEntityProperty): void {
		this.currentlyBuilding = building;
	}

	/**
	 * Actually construct building.
	 */
	constructBuilding(obj: IEntityProperty): void {
		const game = this.$scope.game; /* angular parent controller */

		if (!(obj && this.selected)){
			return;
		}

		if (obj.cost > game.money){
			return;
		}

		/* validate that no other building exists on this position */
		const i = this.selected[1] * this.map.width + this.selected[0];
		if (this.buildingMap[i] !== 0){
			return;
		}

		/* spawn entity */
		const gl = this.context;
		this.map.spawn(obj.type || 'Building', gl, Object.assign({}, obj, {
			position: Vector.create([this.selected[0], -this.selected[1] - 1, 0]),
			model: this.buildingModel,
		}));

		/* record that something exists on this position */
		this.buildingMap[i] = obj.index;

		/* reduce player money */
		this.$scope.$apply(() => {
			game.money -= obj.cost;
		});
	}

	/**
	 * Takes two screenspace coordinates, unprojects and intersects with map-plane
	 * to get coordinate of where on the tilemap the point is.
	 */
	unprojectMap(x: number, y: number): Vector {
		const w = this.element.width;
		const h = this.element.height;
		y = h - y;

		const pv = this.camera.getProjectionMatrix().x(this.camera.getViewMatrix());
		const inv = pv.inverse();
		const winClip = Vector.create([
			2 * x / w - 1.0,
			2 * y / h - 1.0,
			-1.0,
			1.0,
		]);

		let near = inv.x(winClip);
		near = near.x(1.0 / near.elements[3]);

		winClip.elements[2] = 1.0;
		let far = inv.x(winClip);
		far = far.x(1.0 / far.elements[3]);

		const near3 = Vector.create(near.elements.slice(0, 3));
		const far3 = Vector.create(far.elements.slice(0, 3));
		const dir = far3.subtract(near3).toUnitVector();
		const plane = Vector.create([0, 0, 1]);
		const t = -plane.dot(near3) / plane.dot(dir);
		const intersect = near3.add(dir.x(t));

		return intersect;
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
			const waypoints = this.routes[route].waypoint;
			const behaviour = new WaypointBehaviour(waypoints);
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

			if (this.selected && this.currentlyBuilding){
				const i = this.selected[1] * this.map.width + this.selected[0];
				const q = this.buildingMap[i] > 0 ? 1 : 0;
				const selectionMatrix = Matrix.Translation(Vector.create([
					this.selected[0],
					-1 - this.selected[1],
					0,
				]));
				this.ShaderService.uploadModel(gl, selectionMatrix);
				this.selectionTexture[q].bind(gl);
				this.selectionModel.render(gl);
			}
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
