import { Behaviour } from 'behaviour';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector } from 'sylvester';
import { Waypoint } from '../items/waypoint';
import { Map } from 'map';
import { AABB } from 'math';

interface Route {
	path: AABB[];
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

	constructor(map: Map, precalculated: TileData[], dynamicMap: Uint32Array, waypoints: Waypoint[]){
		super();
		this.precalculated = precalculated;
		this.dynamicMap = dynamicMap;
		this.waypoints = waypoints;
		this.map = map;
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
		if (current.aabb.pointInside(p[0], p[1])){
			data.current = this.findWaypointByName(current.next);
			return;
		}

		if (data.route == null) {
			data.route = this.calculateRoute(entity, data, data.current);
		}

		/* move entity towards next waypoint */
		const target = Vector.create(current.aabb.center());
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
			const yworld = (-y - 1);
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
					const waypoint = waypoints[i];
					const center = waypoint.aabb.center();
					const delta = [Math.abs(center[0] - xworld), Math.abs(center[1] - yworld)];
					result[index].perWaypointCost[i] = delta[0] + delta[1];
					// todo: do bfs here instead of manhatan distance
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

		const targetIndex = this.map.worldSpaceToIndex(targetWaypoint.aabb.center());

		let currentIndex = this.map.worldSpaceToIndex([entity.position.elements[0], entity.position.elements[1]]);

		nodeInfo[currentIndex].reachCost = 0;
		nodeInfo[currentIndex].goalCost = this.precalculated[currentIndex].perWaypointCost[waypoint];

		pendingNodes.add(currentIndex);

		const build_path = (index: number) => {
			let next = index;
			let result = [this.precalculated[next].aabb];
			while(nodeInfo[next].prevNode != -1) {
				next = nodeInfo[next].prevNode;
				result.push(this.precalculated[next].aabb);
			}
			return result;
		};


		while (pendingNodes.size > 0) {
			currentIndex = -1;
			let currentCost = Infinity;
			// pick the pending node that is closest to the goal
			for (const node of pendingNodes.values()) {
				if (nodeInfo[node].goalCost < currentCost) {
					currentIndex = node;
					currentCost = nodeInfo[node].goalCost;
				}
			}

			if(currentIndex === waypoint) {
				route.path = build_path(currentIndex);
				return route;
			}

			pendingNodes.delete(currentIndex);
			visitedNodes.add(currentIndex);

			const currentReachCost = nodeInfo[currentIndex].reachCost;

			for (const n of neighbors) {
				const neighborIndex = currentIndex + n.offset;
				if (neighborIndex < 0 || neighborIndex >= nodeInfo.length) {
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

		return route;
	}

}
