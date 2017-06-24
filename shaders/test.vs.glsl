attribute vec3 position;
attribute vec4 color;

uniform mat4 MV;
uniform mat4 P;

varying highp vec4 vColor;

void main(void) {
	gl_Position = P * MV * vec4(position, 1.0);
	vColor = color;
}
