import { AABB } from 'math';
import { Behaviour } from 'behaviour';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector } from 'sylvester';
import { Waypoint } from '../items/waypoint';
import { Map } from 'map';

interface EntityData {
	current?: number;
}

export class PathfindingBehaviour extends Behaviour {
	waypoints: Waypoint[];
	staticMap: Uint32Array;
	dynamicMap: Uint32Array;
	map: Map;

	constructor(map: Map, staticMap: Uint32Array, dynamicMap: Uint32Array, waypoints: Waypoint[]){
		super();
		this.staticMap = staticMap;
		this.dynamicMap = dynamicMap;
		this.waypoints = waypoints;
		this.map = map;
	}

	createData(entity: Entity): EntityData { // eslint-disable-line no-unused-vars
		return {
			current: 0,
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
}
