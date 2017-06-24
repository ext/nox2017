attribute vec3 position;
attribute vec4 color;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying highp vec4 vColor;

void main(void) {
	gl_Position = uPMatrix * uMVMatrix * vec4(position + color.rgb * 0.0, 1.0);
	vColor = color;
}
