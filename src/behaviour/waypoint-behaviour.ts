import { AABB } from 'math';
import { Behaviour } from './behaviour';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector } from 'sylvester';

export interface Waypoint {
	name: string;
	aabb: AABB;
	next?: string;
}

interface EntityData {
	current?: number;
}

export class WaypointBehaviour extends Behaviour {
	waypoint: Waypoint[];

	constructor(waypoints: Waypoint[]){
		super();
		this.waypoint = waypoints;
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

		const current: Waypoint = this.waypoint[data.current];

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
	}

	findWaypointByName(name: string){
		const index = this.waypoint.findIndex(cur => cur.name === name);
		return index >= 0 ? index : null;
	}
}
