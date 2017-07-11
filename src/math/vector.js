import { Vector } from 'sylvester';

Vector.prototype.normalized = function(){
	const li = 1.0 / this.norm();
	return this.x(li);
};

Vector.quatFromEuler = function(pitch, roll, yaw){
	const t0 = Math.cos(yaw * 0.5);
	const t1 = Math.sin(yaw * 0.5);
	const t2 = Math.cos(roll * 0.5);
	const t3 = Math.sin(roll * 0.5);
	const t4 = Math.cos(pitch * 0.5);
	const t5 = Math.sin(pitch * 0.5);

	return Vector.create([
		t0 * t3 * t4 - t1 * t2 * t5,
		t0 * t2 * t5 + t1 * t3 * t4,
		t1 * t2 * t4 - t0 * t3 * t5,
		t0 * t2 * t4 + t1 * t3 * t5,
	]);
};

Vector.prototype.flatten = function(){
	return this.elements;
};
