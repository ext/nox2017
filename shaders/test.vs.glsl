#include "common.glsl"

in vec3 position;
in vec4 color;

uniform mat4 MV;
uniform mat4 P;

out vec4 vColor;

void main(void) {
	gl_Position = projectionMatrix * MV * vec4(position, 1.0);
	vColor = color;
}
