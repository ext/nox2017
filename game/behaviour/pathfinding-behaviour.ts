import { Behaviour } from 'behaviour';
import { Entity } from 'entity'; // eslint-disable-line no-unused-vars
import { Vector } from 'sylvester';
import { Waypoint } from '../items/waypoint';
import { Map } from 'map';

interface EntityData {
	current?: number;
}

export interface TileData {
	staticMapValue: number;
	perWaypointCost: number[];
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

	static precalculateMap(staticMap: Uint32Array, map: Map, waypoints: Waypoint[]) : TileData[]{
		const result: TileData[] = [];
		for (let y = 0; y < map.height; ++y) {
			const yworld = (-y - 1);
			for (let x = 0; x < map.width; ++x) {
				const xworld = x;
				const index = y * map.width + x;
				result[index] = {
					staticMapValue: staticMap[index],
					perWaypointCost: [],
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
}
