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
		const ymin = -item.position.elements[1];
		const xmax = xmin + item.width;
		const ymax = ymin + item.height;
		return new AABB(xmin, ymin, xmax, ymax);
	}

	center(): [number, number, number] {
		const w = this.xmax - this.xmin;
		const h = this.ymax - this.ymin;
		return [
			this.xmin + w * 0.5,
			-(this.ymin + h* 0.5),
			0,
		];
	}

	pointInside(x: number, y: number){
		/* because reasons... (y-axis is flipped pretty much everywhere and I dont
		 * have time to fix */
		y = -y;

		if (x < this.xmin || x > this.xmax) return false;
		if (y < this.ymin || y > this.ymax) return false;
		return true;
	}
}
