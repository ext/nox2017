import { Behaviour } from 'behaviour';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector } from 'sylvester';
import { Matrix } from 'sylvester';
import { Waypoint } from '../items/waypoint';
import { Map } from 'map';
import { AABB } from 'math';
import { Model } from 'model';
import { Texture } from 'texture';
import { Shader } from 'shader';

interface RouteEntry {
	aabb: AABB;
	index: number;
};

interface Route {
	path: RouteEntry[];
	current: number;
}

interface EntityData {
	current?: number;
	route: Route;
}

export interface TileData {
	staticMapValue: number;
	perWaypointCost: number[];
	aabb: AABB;
}

export class PathfindingBehaviour extends Behaviour {
	waypoints: Waypoint[];
	precalculated: TileData[];
	dynamicMap: Uint32Array;
	map: Map;
	white: Texture;

	constructor(map: Map, precalculated: TileData[], dynamicMap: Uint32Array, waypoints: Waypoint[]){
		super();
		this.precalculated = precalculated;
		this.dynamicMap = dynamicMap;
		this.waypoints = waypoints;
		this.map = map;
		this.white = null;
	}

	createData(entity: Entity): EntityData { // eslint-disable-line no-unused-vars
		return {
			current: 0,
			route: null,
		};
	}

	update(entity: Entity, data: EntityData, dt: number): void {
		/* if the entity has no assigned waypoint skip it */
		if (data.current === null){
			return;
		}

		const current: Waypoint = this.waypoints[data.current];

		/* detect if current waypoint is reached */
		const p = entity.position.elements;
		if (current.aabb.pointInside(p[0], p[1]+1)){
			console.log("Reached waypoint. Next: " + current.next);
			data.current = this.findWaypointByName(current.next);
			console.log("Next is " + data.current);
			data.route = null;
			return;
		}

		if (data.route == null || data.route.current > data.route.path.length) {
			data.route = this.calculateRoute(entity, data, data.current);
		}

		if(data.route.path.length === 0 || data.route.current == data.route.path.length) {
			return;
		}

		const nextPoint = data.route.path[data.route.current];
		if(nextPoint.aabb.pointInside(p[0], p[1])) {
			++data.route.current;
		}

		/* move entity towards next waypoint */
		const target = Vector.create(nextPoint.aabb.center());
		const direction = target.subtract(entity.position).toUnitVector();
		const velocity = direction.x(entity.speed * dt);
		entity.position = entity.position.add(velocity);
		entity.rotation = direction;
	}

	findWaypointByName(name: string){
		const index = this.waypoints.findIndex(cur => cur.name === name);
		return index >= 0 ? index : null;
	}

	static precalculateMap(staticMap: Uint32Array, map: Map, waypoints: Waypoint[]) : TileData[]{
		const result: TileData[] = [];
		for (let y = 0; y < map.height; ++y) {
			const yworld = y + 1;

			for (let x = 0; x < map.width; ++x) {
				const xworld = x;
				const index = y * map.width + x;
				const aabb = new AABB(xworld, yworld, xworld+1, yworld+1);
				result[index] = {
					staticMapValue: staticMap[index],
					perWaypointCost: [],
					aabb: aabb,
				};

				for (let i = 0; i<waypoints.length; ++i) {
					if(staticMap[index] > 0) {
						const waypoint = waypoints[i];
						const center = waypoint.aabb.center();
						const delta = [Math.abs(center[0] - xworld), Math.abs(center[1] - yworld)];
						result[index].perWaypointCost[i] = delta[0] + delta[1];
						// todo: do bfs here instead of manhatan distance
					}
					else
					{
						result[index].perWaypointCost[i] = Infinity;
					}
				}

			}
		}

		return result;
	}

	calculateRoute(entity: Entity, data: EntityData, waypoint: number): Route {
		let route : Route = {
			current: 0,
			path: [],
		};

		// Run A*

		let visitedNodes = new Set();
		let pendingNodes = new Set();

		let nodeInfo : any[] = [];

		const neighbors = [];
		for (let y = -1; y<=1; ++y) {
			for (let x = -1; x<=1; ++x) {
				if (x === 0 && y === 0) {
					continue;
				}

				neighbors.push({
					offset: y * this.map.width + x,
					cost: Math.abs(y) + Math.abs(x),
				});
			}
		}

		for (let i=0; i<this.map.width * this.map.height; ++i) {
			nodeInfo[i] = {
				prevNode: -1,
				reachCost: Infinity, // cost of reaching this node
				goalCost: Infinity, // cost of reaching the goal by going through this node
			};
		}

		const targetWaypoint = this.waypoints[waypoint];

		const targetCenterNonFluff = targetWaypoint.aabb.center();
		const targetIndex = this.map.fluffSpaceToIndex([targetCenterNonFluff[0], -targetCenterNonFluff[1] - 1]);

		let currentIndex = this.map.fluffSpaceToIndex([entity.position.elements[0], -entity.position.elements[1]]);

		if (currentIndex < 0 || currentIndex >= nodeInfo.length) {
			return route;
		}

		nodeInfo[currentIndex].reachCost = 0;
		nodeInfo[currentIndex].goalCost = this.precalculated[currentIndex].perWaypointCost[waypoint];

		pendingNodes.add(currentIndex);

		const build_path = (index: number) => {
			let next = index;
			let result = [{
				aabb: this.precalculated[next].aabb,
				index: next,
			}];

			while(nodeInfo[next].prevNode != -1) {
				next = nodeInfo[next].prevNode;
				result.push({
					aabb: this.precalculated[next].aabb,
					index: next,
				});
			}
			return result.reverse();
		};

		let closest = 0;
		let closestVal = Infinity;

		while (pendingNodes.size > 0) {
			currentIndex = pendingNodes.values().next().value;
			let currentCost = Infinity;
			// pick the pending node that is closest to the goal
			for (const node of pendingNodes.values()) {
				if (nodeInfo[node].goalCost < currentCost) {
					currentIndex = node;
					currentCost = nodeInfo[node].goalCost;
				}
			}

			if(currentIndex == targetIndex) {
				route.path = build_path(currentIndex);
				return route;
			}

			if(this.precalculated[currentIndex].perWaypointCost[waypoint] < closestVal) {
				closestVal = this.precalculated[currentIndex].perWaypointCost[waypoint];
				closest = currentIndex;
			}

			pendingNodes.delete(currentIndex);
			visitedNodes.add(currentIndex);

			const currentReachCost = nodeInfo[currentIndex].reachCost;

			for (const n of neighbors) {
				const neighborIndex = currentIndex + n.offset;
				if (neighborIndex < 0 || neighborIndex >= nodeInfo.length) {
					continue;
				}

				if(this.precalculated[neighborIndex].staticMapValue === 0) {
					continue;
				}

				if (visitedNodes.has(neighborIndex)) {
					continue;
				}

				pendingNodes.add(neighborIndex);

				const neighbor = nodeInfo[neighborIndex];

				let tentativeReachCost = currentReachCost + n.cost;
				if (tentativeReachCost >= neighbor.reachCost) {
					continue; // not a better path
				}

				neighbor.prevNode = currentIndex;
				neighbor.reachCost = tentativeReachCost;
				neighbor.goalCost = tentativeReachCost + this.precalculated[neighborIndex].perWaypointCost[waypoint];
			}
		}

		console.log("Couldn't find any route :(");

		route.path = build_path(closest);

		return route;
	}

	Quad(gl: WebGL2RenderingContext, scale: number, color: [number, number, number, number]){
			let quad = new Model(gl);
			quad.upload(gl, new Float32Array([
				/* X     Y     Z       U     V       R    G    B    A */
				 scale,  scale,  0.0,    1.0,  1.0,    color[0], color[1], color[2], color[3],
				 0.0,  scale,  0.0,    0.0,  1.0,    color[0], color[1], color[2], color[3],
				 scale,  0.0,  0.0,    1.0,  0.0,    color[0], color[1], color[2], color[3],
				 0.0,  0.0,  0.0,    0.0,  0.0,    color[0], color[1], color[2], color[3],
			]), new Uint32Array([0, 1, 2, 1, 3, 2]));
		return quad;
	}

	render(gl: WebGL2RenderingContext, entity: Entity, data: EntityData) : void {
	/*
			let quad = [
				this.Quad(gl, 1.0, [1.0, 0.0, 0.0, 0.5]),
				this.Quad(gl, 1.0, [1.0, 1.0, 1.0, 0.5]),
				this.Quad(gl, 1.0, [0.0, 1.0, 0.0, 0.5]),
				this.Quad(gl, 1.0, [0.0, 0.0, 1.0, 0.1]),
				this.Quad(gl, 1.0, [1.0, 0.0, 1.0, 0.7]),
			];

			if(this.white) {
				this.white.bind(gl);
			}

			this.precalculated.forEach(c => {
				if(c.staticMapValue === 1) {
					const center = [c.aabb.xmin, -c.aabb.ymin];
					//const center = [c.aabb.xmin, c.aabb.ymin];
					let m = Matrix.Translation(Vector.create([center[0], center[1], 0]));
					Shader.uploadModel(gl, m);
					quad[3].render(gl);
				}
			});

			if(data.route) {
				for(let i = 0; i<data.route.path.length; ++i) {
					const center = [data.route.path[i].aabb.xmin, data.route.path[i].aabb.ymin];
					let m = Matrix.Translation(Vector.create([center[0], -center[1], 0]));
					Shader.uploadModel(gl, m);
					if(i < data.route.current) {
						quad[0].render(gl);
					} else if(i == data.route.current) {
						quad[1].render(gl);
					} else {
						quad[2].render(gl);
					}
				}
			}
*/
	}

}
