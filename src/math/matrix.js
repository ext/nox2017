import { Matrix } from 'sylvester';

Matrix.Translation = function(v){
	if (v.elements.length === 2){
		let r = Matrix.I(3);
		r.elements[2][0] = v.elements[0];
		r.elements[2][1] = v.elements[1];
		return r;
	}

	if (v.elements.length === 3){
		let r = Matrix.I(4);
		r.elements[0][3] = v.elements[0];
		r.elements[1][3] = v.elements[1];
		r.elements[2][3] = v.elements[2];
		return r;
	}

	throw "Invalid length for Translation";
};

Matrix.RotationFromQuat = function(q){
	const n = q.normalized();
	const qx = n.elements[0];
	const qy = n.elements[1];
	const qz = n.elements[2];
	const qw = n.elements[3];
	return new Matrix.create([
		[1.0 - 2.0 * qy*qy - 2.0 * qz*qz, 2.0 * qx*qy - 2.0 * qz*qw,       2.0 * qx*qz + 2.0 * qy*qw, 0.0],
		[2.0 * qx*qy + 2.0 * qz*qw,       1.0 - 2.0 * qx*qx - 2.0 * qz*qz, 2.0 * qy*qz - 2.0 * qx*qw, 0.0],
		[2.0 * qx * qz - 2.0 * qy*qw,     2.0 * qy*qz + 2.0 * qx*qw, 1.0 - 2.0 * qx*qx - 2.0 * qy*qy, 0.0],
		[0.0, 0.0, 0.0, 1.0],
	]);
};
