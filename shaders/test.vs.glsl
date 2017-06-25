#include "common.glsl"

in vec4 in_pos;
in vec4 in_color;

out vec4 vColor;
out vec4 w_pos;

void main(void) {
	w_pos = modelMatrix * in_pos;
	gl_Position = projectionViewMatrix * w_pos;
	vColor = in_color;
}
