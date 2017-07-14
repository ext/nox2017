import { Item } from 'item'; // eslint-disable-line

export class AABB {
	xmin: number;
	ymin: number;
	xmax: number;
	ymax: number;

	constructor(xmin: number, ymin: number, xmax: number, ymax: number){
		this.xmin = xmin;
		this.ymin = ymin;
		this.xmax = xmax;
		this.ymax = ymax;
	}

	static fromItem(item: Item){
		const xmin = item.position.elements[0];
		const ymin = item.position.elements[1];
		const xmax = xmin + item.width;
		const ymax = ymin + item.height;
		return new AABB(xmin, ymin, xmax, ymax);
	}

	intersectPoint(x: number, y: number){
		if (x < this.xmin || x > this.xmax) return false;
		if (y < this.ymin || y > this.ymax) return false;
		return true;
	}
}
