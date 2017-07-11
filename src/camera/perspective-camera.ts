import { Camera } from './camera';
import { makePerspective } from './math';

interface IPerspectiveData {
	fov?: number;
	aspect?: number;
	znear?: number;
	zfar?: number;
}

const defaults: IPerspectiveData = {
	fov: 45,
	aspect: 1.3,
	znear: 0.1,
	zfar: 100,
};

export class PerspectiveCamera extends Camera {
	parameters: IPerspectiveData;

	constructor(options: any){
		options = Object.assign(defaults, options);

		super(options);

		this.parameters = defaults;
		this.resize({
			fov: options.fov,
			aspect: options.aspect,
			znear: options.znear,
			zfar: options.zfar,
		});
	}

	resize(data: IPerspectiveData): void {
		const p = this.parameters = Object.assign(this.parameters, data);
		const m = makePerspective(p.fov, p.aspect, p.znear, p.zfar);
		this.setProjectionMatrix(m);
	}
}
