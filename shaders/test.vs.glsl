#include "common.glsl"

in vec4 in_pos;
in vec2 in_uv;
in vec4 in_color;

out vec2 uv;
out vec4 color;
out vec4 w_pos;

void main(void) {
	uv = in_uv;
	color = in_color;
	w_pos = modelMatrix * in_pos;
	gl_Position = projectionViewMatrix * w_pos;
}
