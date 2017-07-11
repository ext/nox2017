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
	return Matrix.create([
		[1.0 - 2.0 * qy*qy - 2.0 * qz*qz, 2.0 * qx*qy - 2.0 * qz*qw,       2.0 * qx*qz + 2.0 * qy*qw, 0.0],
		[2.0 * qx*qy + 2.0 * qz*qw,       1.0 - 2.0 * qx*qx - 2.0 * qz*qz, 2.0 * qy*qz - 2.0 * qx*qw, 0.0],
		[2.0 * qx*qz - 2.0 * qy*qw,       2.0 * qy*qz + 2.0 * qx*qw, 1.0 - 2.0 * qx*qx - 2.0 * qy*qy, 0.0],
		[0.0, 0.0, 0.0, 1.0],
	]);
};

Matrix.ortho = function(left, right,  bottom, top, znear, zfar){
	const tx = -(right+left)/(right-left);
	const ty = -(top+bottom)/(top-bottom);
	const tz = -(zfar+znear)/(zfar-znear);

	return Matrix.create([
		[2/(right-left), 0, 0, tx],
		[0, 2/(top-bottom), 0, ty],
		[0, 0, -2/(zfar-znear), tz],
		[0, 0, 0, 1],
	]);
};

Matrix.prototype.flatten = function(){
	let result = [];
	if (this.elements.length === 0){
		return [];
	}

	for (let j = 0; j < this.elements[0].length; j++){
		for (let i = 0; i < this.elements.length; i++){
			result.push(this.elements[i][j]);
		}
	}
	return result;
};

Matrix.prototype.ensure4x4 = function(){ // eslint-disable-line complexity
	if (this.elements.length === 4 &&
			this.elements[0].length === 4){
		return this;
	}

	if (this.elements.length > 4 ||
			this.elements[0].length > 4){
		return null;
	}

	for (let i = 0; i < this.elements.length; i++){
		for (let j = this.elements[i].length; j < 4; j++){
			if (i === j){
				this.elements[i].push(1);
			} else {
				this.elements[i].push(0);
			}
		}
	}

	for (let i = this.elements.length; i < 4; i++){
		if (i === 0){
			this.elements.push([1, 0, 0, 0]);
		} else if (i === 1){
			this.elements.push([0, 1, 0, 0]);
		} else if (i === 2){
			this.elements.push([0, 0, 1, 0]);
		} else if (i === 3){
			this.elements.push([0, 0, 0, 1]);
		}
	}

	return this;
};

Matrix.prototype.make3x3 = function(){
	if (this.elements.length !== 4 ||
			this.elements[0].length !== 4){
		return null;
	}

	return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
		[this.elements[1][0], this.elements[1][1], this.elements[1][2]],
		[this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};
