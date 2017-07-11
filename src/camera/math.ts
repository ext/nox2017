import { Vector, Matrix } from 'sylvester'; // eslint-disable-line no-unused-vars

export function makePerspective(fovy: number, aspect: number, znear: number, zfar: number){
	const ymax = znear * Math.tan(fovy * Math.PI / 360.0);
	const ymin = -ymax;
	const xmin = ymin * aspect;
	const xmax = ymax * aspect;
	return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

function makeFrustum(left: number, right: number,
	                   bottom: number, top: number,
	                   znear: number, zfar: number){
	const X = 2*znear/(right-left);
	const Y = 2*znear/(top-bottom);
	const A = (right+left)/(right-left);
	const B = (top+bottom)/(top-bottom);
	const C = -(zfar+znear)/(zfar-znear);
	const D = -2*zfar*znear/(zfar-znear);

	return Matrix.create([
		[X, 0, A, 0],
		[0, Y, B, 0],
		[0, 0, C, D],
		[0, 0, -1, 0],
	]);
}

export function lookAt(eye: Vector, center: Vector, up: Vector){
	const z = eye.subtract(center).toUnitVector();
	const x = up.cross(z).toUnitVector();
	const y = z.cross(x).toUnitVector();

	const m = Matrix.create([
		[x.e(1), x.e(2), x.e(3), 0],
		[y.e(1), y.e(2), y.e(3), 0],
		[z.e(1), z.e(2), z.e(3), 0],
		[0, 0, 0, 1],
	]);

	const t = Matrix.create([
		[1, 0, 0, -eye.e(1)],
		[0, 1, 0, -eye.e(2)],
		[0, 0, 1, -eye.e(3)],
		[0, 0, 0, 1],
	]);

	return m.x(t);
}
